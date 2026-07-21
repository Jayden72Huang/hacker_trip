import path from 'path';
import fs from 'fs';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

interface LocalOpsConfig {
  reviewChatId?: string;
  reviewLeadOpenId?: string;
  reviewLeadName?: string;
  reviewLeadRole?: string;
  partnerTableId?: string;
  feishuIdentity?: 'user' | 'bot';
  miniprogramEnvId?: string;
  larkProfile?: string;
  opsSyncUrl?: string;
  opsSyncToken?: string;
}

function loadLocalConfig(): LocalOpsConfig {
  const configPath = path.resolve(process.cwd(), 'config/hackathon-ops.local.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as LocalOpsConfig;
  } catch {
    return {};
  }
}

const localConfig = loadLocalConfig();

export const hackathonOpsConfig = {
  feishuBaseDomain: process.env.FEISHU_BASE_DOMAIN || 'gcnoblw8v438.feishu.cn',
  eventBaseToken: process.env.FEISHU_EVENT_BASE_TOKEN || 'BBOKbv2FbaGGDvsQzDHcYrdbnNb',
  eventMainTableId: process.env.FEISHU_EVENT_MAIN_TABLE_ID || 'tbl9rmEFfeXaSQb8',
  crawlerTableId: process.env.FEISHU_CRAWLER_TABLE_ID || 'tblmclhJp5RSYay4',
  sourceTableId: process.env.FEISHU_SOURCE_TABLE_ID || 'tblBPtzSFId0JHkt',
  // 小程序审核台同步目标：组织者申请 / 赛事上线申请（云 DB → 飞书子表）
  organizerApplyTableId: process.env.FEISHU_ORGANIZER_APPLY_TABLE_ID || 'tblFv1agEJU9DDBY',
  draftApplyTableId: process.env.FEISHU_DRAFT_APPLY_TABLE_ID || 'tbl2ScG7ZpkrMVl6',
  partnerBaseToken: process.env.FEISHU_PARTNER_BASE_TOKEN || 'KIYXbSxDxatyRCsl32CcNbganvh',
  partnerTableId: process.env.FEISHU_PARTNER_TABLE_ID || localConfig.partnerTableId || 'tblfY8ej2kAaA5kI',
  reviewChatId: process.env.FEISHU_REVIEW_CHAT_ID || localConfig.reviewChatId || '',
  reviewWebhookUrl: process.env.FEISHU_REVIEW_WEBHOOK_URL || '',
  reviewWebhookSecret: process.env.FEISHU_REVIEW_WEBHOOK_SECRET || '',
  reviewLeadOpenId: process.env.FEISHU_REVIEW_LEAD_OPEN_ID || localConfig.reviewLeadOpenId || '',
  reviewLeadName: process.env.FEISHU_REVIEW_LEAD_NAME || localConfig.reviewLeadName || '',
  reviewLeadRole: process.env.FEISHU_REVIEW_LEAD_ROLE || localConfig.reviewLeadRole || '',
  feishuIdentity: (process.env.FEISHU_IDENTITY === 'bot' || localConfig.feishuIdentity === 'bot' ? 'bot' : 'user') as 'bot' | 'user',
  larkProfile: process.env.LARK_CLI_PROFILE || localConfig.larkProfile || 'hackertrip-enterprise',
  runtimeDir: path.resolve(process.cwd(), 'runtime/hackathon-ops'),
  miniprogramEnvId: process.env.CLOUDBASE_ENV_ID || localConfig.miniprogramEnvId || 'test-1-d8gn28apcbf409627',
  // opsReviewSync 云函数的 HTTP 触发器地址 + 鉴权密钥（服务端无头读写云库，替代开发者工具 automator）
  opsSyncUrl: process.env.OPS_SYNC_URL || localConfig.opsSyncUrl || '',
  opsSyncToken: process.env.OPS_SYNC_TOKEN || localConfig.opsSyncToken || '',
};

export function hasOpsEndpoint(): boolean {
  return Boolean(hackathonOpsConfig.opsSyncUrl && hackathonOpsConfig.opsSyncToken);
}

export function hasReviewPushTarget(): boolean {
  return Boolean(hackathonOpsConfig.reviewWebhookUrl || hackathonOpsConfig.reviewChatId);
}

export const reviewStatuses = {
  pending: '待审核',
  verify: '补充核验',
  approved: '通过待上架',
  rejected: '拒绝',
  duplicate: '重复',
  synced: '已同步',
} as const;

export const outreachStatuses = {
  notStarted: '待建联',
  contacted: '已联系',
  replied: '已回复',
  succeeded: '建联成功',
  paused: '暂不合作',
  unreachable: '无法联系',
  synced: '已同步建联表',
} as const;

export const targetPlatforms = ['网站', '小程序'] as const;
