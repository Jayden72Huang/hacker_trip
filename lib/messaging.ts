import { db } from '@/lib/db';
import { conversations, directMessages, notifications, users } from '@/lib/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';

export type MessageType =
  | 'text'
  | 'team_invite'
  | 'team_request'
  | 'agent_negotiation'
  | 'system';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ConversationWithPreview {
  id: string;
  participantA: string;
  participantB: string;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  createdAt: Date | null;
  otherParticipant: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  };
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  metadata: Record<string, unknown>;
  status: MessageStatus;
  isFromAgent: boolean;
  agentId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

const notificationTitleByType: Record<MessageType, string> = {
  text: '你收到一条新私信',
  team_invite: '你收到一个组队邀请',
  team_request: '你收到一个组队申请',
  agent_negotiation: '你收到一个 Agent 协商请求',
  system: '你收到一条系统消息',
};
const messageTypes = new Set<MessageType>([
  'text',
  'team_invite',
  'team_request',
  'agent_negotiation',
  'system',
]);

function canonicalizeParticipants(userA: string, userB: string) {
  return userA < userB
    ? { participantA: userA, participantB: userB }
    : { participantA: userB, participantB: userA };
}

function truncatePreview(content: string) {
  return content.slice(0, 100);
}

function isMessageType(type: unknown): type is MessageType {
  return typeof type === 'string' && messageTypes.has(type as MessageType);
}

function toMetadataRecord(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }

  return {};
}

function mapMessage(row: typeof directMessages.$inferSelect): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    type: row.type ?? 'text',
    metadata: toMetadataRecord(row.metadata),
    status: row.status ?? 'sent',
    isFromAgent: row.isFromAgent ?? false,
    agentId: row.agentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findOrCreateConversation(userA: string, userB: string): Promise<string> {
  const { participantA, participantB } = canonicalizeParticipants(userA, userB);

  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      or(
        and(
          eq(conversations.participantA, participantA),
          eq(conversations.participantB, participantB),
        ),
        and(
          eq(conversations.participantA, participantB),
          eq(conversations.participantB, participantA),
        ),
      ),
    )
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [created] = await db
    .insert(conversations)
    .values({ participantA, participantB })
    .onConflictDoNothing({
      target: [conversations.participantA, conversations.participantB],
    })
    .returning({ id: conversations.id });

  if (created) {
    return created.id;
  }

  const [raceWinner] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.participantA, participantA),
        eq(conversations.participantB, participantB),
      ),
    )
    .limit(1);

  if (!raceWinner) {
    throw new Error('Failed to create conversation');
  }

  return raceWinner.id;
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}): Promise<{ messageId: string }> {
  const [conversation] = await db
    .select({
      participantA: conversations.participantA,
      participantB: conversations.participantB,
    })
    .from(conversations)
    .where(eq(conversations.id, params.conversationId))
    .limit(1);

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const recipientId =
    conversation.participantA === params.senderId
      ? conversation.participantB
      : conversation.participantB === params.senderId
        ? conversation.participantA
        : null;

  if (!recipientId) {
    throw new Error('Sender is not a participant in this conversation');
  }

  const type = isMessageType(params.type) ? params.type : 'text';
  const preview = truncatePreview(params.content);
  const now = new Date();

  const message = await db.transaction(async (tx) => {
    const [createdMessage] = await tx
      .insert(directMessages)
      .values({
        conversationId: params.conversationId,
        senderId: params.senderId,
        content: params.content,
        type,
        metadata: params.metadata ?? {},
      })
      .returning({ id: directMessages.id });

    if (!createdMessage) {
      throw new Error('Failed to send message');
    }

    await tx
      .update(conversations)
      .set({
        lastMessageAt: now,
        lastMessagePreview: preview,
      })
      .where(eq(conversations.id, params.conversationId));

    await tx.insert(notifications).values({
      userId: recipientId,
      type: 'direct_message',
      title: notificationTitleByType[type],
      body: preview,
      linkUrl: `/messages?conversation=${params.conversationId}`,
    });

    return createdMessage;
  });

  return { messageId: message.id };
}

export async function getConversations(userId: string): Promise<ConversationWithPreview[]> {
  const rows = await db
    .select({
      id: conversations.id,
      participantA: conversations.participantA,
      participantB: conversations.participantB,
      lastMessageAt: conversations.lastMessageAt,
      lastMessagePreview: conversations.lastMessagePreview,
      createdAt: conversations.createdAt,
      otherParticipant: {
        id: users.id,
        name: users.name,
        image: users.image,
        username: users.username,
      },
      unreadCount: sql<number>`(
        select count(*)::int
        from ${directMessages}
        where ${directMessages.conversationId} = ${conversations.id}
          and ${directMessages.senderId} <> ${userId}
          and ${directMessages.status} <> 'read'
      )`,
    })
    .from(conversations)
    .innerJoin(
      users,
      sql`${users.id} = case
        when ${conversations.participantA} = ${userId} then ${conversations.participantB}
        else ${conversations.participantA}
      end`,
    )
    .where(
      or(
        eq(conversations.participantA, userId),
        eq(conversations.participantB, userId),
      ),
    )
    .orderBy(desc(conversations.lastMessageAt));

  return rows.map((row) => ({
    ...row,
    unreadCount: Number(row.unreadCount),
  }));
}

export async function getMessages(
  conversationId: string,
  limit = 50,
  before?: Date,
): Promise<Message[]> {
  const rows = await db
    .select()
    .from(directMessages)
    .where(
      before
        ? and(
            eq(directMessages.conversationId, conversationId),
            sql`${directMessages.createdAt} < ${before}`,
          )
        : eq(directMessages.conversationId, conversationId),
    )
    .orderBy(desc(directMessages.createdAt))
    .limit(limit);

  return rows.map(mapMessage);
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await db
    .update(directMessages)
    .set({
      status: 'read',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(directMessages.conversationId, conversationId),
        sql`${directMessages.senderId} <> ${userId}`,
      ),
    );
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [result] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(directMessages)
    .innerJoin(conversations, eq(conversations.id, directMessages.conversationId))
    .where(
      and(
        or(
          eq(conversations.participantA, userId),
          eq(conversations.participantB, userId),
        ),
        sql`${directMessages.senderId} <> ${userId}`,
        sql`${directMessages.status} <> 'read'`,
      ),
    );

  return Number(result?.count ?? 0);
}
