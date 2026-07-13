export interface FeishuAgentConfig {
  appId: string;
  appSecret: string;
  verificationToken: string;
  chatId: string;
  eventBaseToken: string;
  eventTableId: string;
  crawlerTableId: string;
  partnerBaseToken: string;
  partnerTableId: string;
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
}

export function getFeishuAgentConfig(): FeishuAgentConfig {
  return {
    appId: process.env.FEISHU_AGENT_APP_ID || '',
    appSecret: process.env.FEISHU_AGENT_APP_SECRET || '',
    verificationToken: process.env.FEISHU_AGENT_VERIFICATION_TOKEN || '',
    chatId: process.env.FEISHU_AGENT_CHAT_ID || 'oc_d4bfe5721c67c3b82d4fb015d7c0c287',
    eventBaseToken: process.env.FEISHU_EVENT_BASE_TOKEN || 'WeUkbz9xRax4iKs8x1Lcjr6Sn4e',
    eventTableId: process.env.FEISHU_EVENT_MAIN_TABLE_ID || 'tblHGtaEqzNtYJja',
    crawlerTableId: process.env.FEISHU_CRAWLER_TABLE_ID || 'tblv9oIouHxJI9ps',
    partnerBaseToken: process.env.FEISHU_PARTNER_BASE_TOKEN || 'RXTAbIgkBaC0v4soMQocwu0AnSe',
    partnerTableId: process.env.FEISHU_PARTNER_TABLE_ID || 'tblhGB1B6IkuBwoJ',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY || '',
    deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  };
}

export function getMissingFeishuAgentConfig(config: FeishuAgentConfig): string[] {
  const missing: string[] = [];
  if (!config.appId) missing.push('FEISHU_AGENT_APP_ID');
  if (!config.appSecret) missing.push('FEISHU_AGENT_APP_SECRET');
  if (!config.verificationToken) missing.push('FEISHU_AGENT_VERIFICATION_TOKEN');
  if (!config.chatId) missing.push('FEISHU_AGENT_CHAT_ID');
  return missing;
}
