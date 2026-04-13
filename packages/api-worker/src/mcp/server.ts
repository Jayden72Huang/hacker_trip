import { createDb } from '../db/client';
import { toolDefinitions, callTool } from './tools';
import { resourceDefinitions, readResource } from './resources';

// ============ JSON-RPC Types ============

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// JSON-RPC error codes
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

// ============ MCP Server ============

const SERVER_INFO = {
  name: 'hackertrip-mcp',
  version: '0.1.0',
};

const SERVER_CAPABILITIES = {
  tools: {},
  resources: {},
};

function successResponse(id: number | string, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function errorResponse(
  id: number | string | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? 0,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
  };
}

export async function handleMcpRequest(
  body: string,
  databaseUrl: string
): Promise<JsonRpcResponse> {
  // Parse JSON
  let request: JsonRpcRequest;
  try {
    request = JSON.parse(body);
  } catch {
    return errorResponse(null, PARSE_ERROR, 'Parse error: invalid JSON');
  }

  // Validate JSON-RPC envelope
  if (
    request.jsonrpc !== '2.0' ||
    typeof request.method !== 'string' ||
    request.id === undefined
  ) {
    return errorResponse(
      request?.id ?? null,
      INVALID_REQUEST,
      'Invalid JSON-RPC request'
    );
  }

  const { id, method, params } = request;

  try {
    switch (method) {
      // --- initialize ---
      case 'initialize':
        return successResponse(id, {
          protocolVersion: '2024-11-05',
          serverInfo: SERVER_INFO,
          capabilities: SERVER_CAPABILITIES,
        });

      // --- tools/list ---
      case 'tools/list':
        return successResponse(id, { tools: toolDefinitions });

      // --- tools/call ---
      case 'tools/call': {
        const toolName = params?.name as string | undefined;
        const toolArgs = (params?.arguments ?? {}) as Record<string, unknown>;

        if (!toolName) {
          return errorResponse(id, INVALID_PARAMS, 'Missing tool name');
        }

        const known = toolDefinitions.find((t) => t.name === toolName);
        if (!known) {
          return errorResponse(id, INVALID_PARAMS, `Unknown tool: ${toolName}`);
        }

        const db = createDb(databaseUrl);
        const result = await callTool(db, toolName, toolArgs);
        return successResponse(id, result);
      }

      // --- resources/list ---
      case 'resources/list':
        return successResponse(id, { resources: resourceDefinitions });

      // --- resources/read ---
      case 'resources/read': {
        const uri = params?.uri as string | undefined;
        if (!uri) {
          return errorResponse(id, INVALID_PARAMS, 'Missing resource URI');
        }

        const db = createDb(databaseUrl);
        const result = await readResource(db, uri);
        if (!result) {
          return errorResponse(id, INVALID_PARAMS, `Unknown resource: ${uri}`);
        }
        return successResponse(id, result);
      }

      // --- notifications (no-op, return nothing) ---
      case 'notifications/initialized':
        // Client notification, no response needed per spec, but we respond for HTTP
        return successResponse(id, {});

      // --- unknown method ---
      default:
        return errorResponse(id, METHOD_NOT_FOUND, `Method not found: ${method}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(id, INTERNAL_ERROR, message);
  }
}
