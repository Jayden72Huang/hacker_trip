/**
 * API: 草稿箱 CRUD
 * GET    /api/drafts       - 获取所有草稿
 * POST   /api/drafts       - 创建草稿
 * PUT    /api/drafts/:id   - 更新草稿
 * DELETE /api/drafts/:id   - 删除草稿
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { DraftHackathon } from '@/scrapers/core/types';

const DRAFTS_FILE = path.join(process.cwd(), 'data', 'drafts.json');

/**
 * GET: 获取所有草稿
 */
export async function GET() {
  try {
    const drafts = await readDrafts();
    return NextResponse.json({ success: true, drafts });
  } catch (error) {
    console.error('Get drafts error:', error);
    return NextResponse.json(
      { error: '读取草稿失败' },
      { status: 500 }
    );
  }
}

/**
 * POST: 创建新草稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, source = 'manual' } = body;

    if (!data) {
      return NextResponse.json(
        { error: '缺少数据' },
        { status: 400 }
      );
    }

    const drafts = await readDrafts();

    const newDraft: DraftHackathon = {
      draftId: generateDraftId(),
      ...data,
      source,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    drafts.push(newDraft);
    await writeDrafts(drafts);

    return NextResponse.json({
      success: true,
      draft: newDraft
    });

  } catch (error) {
    console.error('Create draft error:', error);
    return NextResponse.json(
      { error: '创建草稿失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT: 更新草稿
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { draftId, data } = body;

    if (!draftId || !data) {
      return NextResponse.json(
        { error: '缺少参数' },
        { status: 400 }
      );
    }

    const drafts = await readDrafts();
    const index = drafts.findIndex(d => d.draftId === draftId);

    if (index === -1) {
      return NextResponse.json(
        { error: '草稿不存在' },
        { status: 404 }
      );
    }

    drafts[index] = {
      ...drafts[index],
      ...data
    };

    await writeDrafts(drafts);

    return NextResponse.json({
      success: true,
      draft: drafts[index]
    });

  } catch (error) {
    console.error('Update draft error:', error);
    return NextResponse.json(
      { error: '更新草稿失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 删除草稿
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('draftId');

    if (!draftId) {
      return NextResponse.json(
        { error: '缺少 draftId' },
        { status: 400 }
      );
    }

    const drafts = await readDrafts();
    const filtered = drafts.filter(d => d.draftId !== draftId);

    if (filtered.length === drafts.length) {
      return NextResponse.json(
        { error: '草稿不存在' },
        { status: 404 }
      );
    }

    await writeDrafts(filtered);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete draft error:', error);
    return NextResponse.json(
      { error: '删除草稿失败' },
      { status: 500 }
    );
  }
}

/**
 * 读取草稿文件
 */
async function readDrafts(): Promise<DraftHackathon[]> {
  try {
    const content = await fs.readFile(DRAFTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * 写入草稿文件
 */
async function writeDrafts(drafts: DraftHackathon[]): Promise<void> {
  await fs.writeFile(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf-8');
}

/**
 * 生成草稿 ID
 */
function generateDraftId(): string {
  return 'draft-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
