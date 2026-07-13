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
  eventBaseToken: process.env.FEISHU_EVENT_BASE_TOKEN || 'WeUkbz9xRax4iKs8x1Lcjr6Sn4e',
  eventMainTableId: process.env.FEISHU_EVENT_MAIN_TABLE_ID || 'tblHGtaEqzNtYJja',
  crawlerTableId: process.env.FEISHU_CRAWLER_TABLE_ID || 'tblv9oIouHxJI9ps',
  sourceTableId: process.env.FEISHU_SOURCE_TABLE_ID || 'tblaueBKae5Rt7vz',
  partnerBaseToken: process.env.FEISHU_PARTNER_BASE_TOKEN || 'RXTAbIgkBaC0v4soMQocwu0AnSe',
  partnerTableId: process.env.FEISHU_PARTNER_TABLE_ID || localConfig.partnerTableId || '',
  reviewChatId: process.env.FEISHU_REVIEW_CHAT_ID || localConfig.reviewChatId || '',
  reviewLeadOpenId: process.env.FEISHU_REVIEW_LEAD_OPEN_ID || localConfig.reviewLeadOpenId || '',
  reviewLeadName: process.env.FEISHU_REVIEW_LEAD_NAME || localConfig.reviewLeadName || '',
  reviewLeadRole: process.env.FEISHU_REVIEW_LEAD_ROLE || localConfig.reviewLeadRole || '',
  feishuIdentity: (process.env.FEISHU_IDENTITY === 'bot' || localConfig.feishuIdentity === 'bot' ? 'bot' : 'user') as 'bot' | 'user',
  runtimeDir: path.resolve(process.cwd(), 'runtime/hackathon-ops'),
  miniprogramEnvId: process.env.CLOUDBASE_ENV_ID || localConfig.miniprogramEnvId || 'test-1-d8gn28apcbf409627',
};

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
