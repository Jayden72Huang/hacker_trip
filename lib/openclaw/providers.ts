/**
 * LLM Provider definitions for HackerBot.
 * Each provider specifies its API format (anthropic or openai-compatible),
 * default base URL, default model, and UI hints.
 */

export interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  keyPlaceholder: string;
  keyLink: string;
  format: 'anthropic' | 'openai';
}

export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-5-20250929',
    keyPlaceholder: 'sk-ant-api03-...',
    keyLink: 'https://console.anthropic.com/settings/keys',
    format: 'anthropic',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (GPT)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://platform.openai.com/api-keys',
    format: 'openai',
  },
  google: {
    id: 'google',
    name: 'Google (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    keyPlaceholder: 'AIza...',
    keyLink: 'https://aistudio.google.com/apikey',
    format: 'openai',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://platform.deepseek.com/api_keys',
    format: 'openai',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    keyPlaceholder: '...',
    keyLink: 'https://console.mistral.ai/api-keys',
    format: 'openai',
  },
  custom: {
    id: 'custom',
    name: '自定义 (OpenAI 兼容)',
    baseUrl: '',
    defaultModel: '',
    keyPlaceholder: 'API Key',
    keyLink: '',
    format: 'openai',
  },
};

export const PROVIDER_IDS = Object.keys(LLM_PROVIDERS);
export type ProviderId = keyof typeof LLM_PROVIDERS;
