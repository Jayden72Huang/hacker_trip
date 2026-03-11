/**
 * HackerBot Tool System - Shared Types
 */

export interface ToolResult {
  success: boolean;
  content: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolContext {
  teamId: string;
  sessionId: string;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: 'running' | 'success' | 'error';
  result?: string;
  error?: string;
  executionTimeMs?: number;
}
