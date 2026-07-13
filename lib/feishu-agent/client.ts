import type { FeishuAgentConfig } from './config';

export interface FeishuBaseRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

interface FeishuResponse<T> {
  code: number;
  msg: string;
  data?: T;
}

interface TokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
}

interface RecordPage {
  items?: FeishuBaseRecord[];
  has_more?: boolean;
  page_token?: string;
}

let tokenCache: { appId: string; token: string; expiresAt: number } | null = null;

export function readableCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        const candidate = item as Record<string, unknown>;
        return readableCell(candidate.text ?? candidate.name ?? candidate.value ?? candidate.id ?? item);
      }
      return readableCell(item);
    }).filter(Boolean).join('、');
  }
  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    return readableCell(candidate.text ?? candidate.name ?? candidate.value ?? candidate.link ?? JSON.stringify(value));
  }
  return String(value);
}

export class FeishuAgentClient {
  constructor(private readonly config: FeishuAgentConfig) {}

  private async getTenantToken(): Promise<string> {
    if (tokenCache && tokenCache.appId === this.config.appId && tokenCache.expiresAt > Date.now() + 60_000) {
      return tokenCache.token;
    }

    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ app_id: this.config.appId, app_secret: this.config.appSecret }),
    });
    const payload = await response.json() as TokenResponse;
    if (!response.ok || payload.code !== 0 || !payload.tenant_access_token) {
      throw new Error(`获取 tenant_access_token 失败：${payload.msg || response.status}`);
    }

    tokenCache = {
      appId: this.config.appId,
      token: payload.tenant_access_token,
      expiresAt: Date.now() + Math.max((payload.expire || 7200) - 120, 60) * 1000,
    };
    return payload.tenant_access_token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getTenantToken();
    const response = await fetch(`https://open.feishu.cn${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
        ...(init?.headers || {}),
      },
    });
    const payload = await response.json() as FeishuResponse<T>;
    if (!response.ok || payload.code !== 0) {
      throw new Error(`飞书 API 失败 ${payload.code || response.status}：${payload.msg || 'unknown error'}`);
    }
    return payload.data as T;
  }

  async listRecords(baseToken: string, tableId: string, maxRecords = 500): Promise<FeishuBaseRecord[]> {
    const records: FeishuBaseRecord[] = [];
    let pageToken = '';

    do {
      const query = new URLSearchParams({ page_size: '200' });
      if (pageToken) query.set('page_token', pageToken);
      const data = await this.request<RecordPage>(
        `/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records?${query.toString()}`,
      );
      records.push(...(data.items || []));
      pageToken = data.has_more ? data.page_token || '' : '';
    } while (pageToken && records.length < maxRecords);

    return records.slice(0, maxRecords);
  }

  async updateRecord(baseToken: string, tableId: string, recordId: string, fields: Record<string, unknown>): Promise<void> {
    await this.request(
      `/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/${recordId}`,
      { method: 'PUT', body: JSON.stringify({ fields }) },
    );
  }

  async createRecord(baseToken: string, tableId: string, fields: Record<string, unknown>): Promise<FeishuBaseRecord> {
    const data = await this.request<{ record: FeishuBaseRecord }>(
      `/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records`,
      { method: 'POST', body: JSON.stringify({ fields }) },
    );
    return data.record;
  }

  async reply(messageId: string, text: string): Promise<void> {
    await this.request(
      `/open-apis/im/v1/messages/${messageId}/reply`,
      {
        method: 'POST',
        body: JSON.stringify({
          msg_type: 'text',
          content: JSON.stringify({ text: text.slice(0, 18_000) }),
        }),
      },
    );
  }
}
