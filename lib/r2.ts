/**
 * Cloudflare R2 Storage Client
 * 支持 CF Workers 原生绑定和本地开发 (AWS SDK fallback)
 */

// CF Workers R2 绑定类型
interface R2Bucket {
  put(key: string, value: ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

interface R2PutOptions {
  httpMetadata?: { contentType?: string };
}

interface R2Object {
  key: string;
  size: number;
  etag: string;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

// 全局 CF 绑定
declare global {
  const R2_BUCKET: R2Bucket | undefined;
}

// 检测是否在 CF Workers 环境
function isCloudflareWorkers(): boolean {
  return typeof R2_BUCKET !== 'undefined';
}

// ========== CF Workers 原生实现 ==========

async function cfUpload(key: string, body: ArrayBuffer | string, contentType?: string) {
  if (!R2_BUCKET) throw new Error('R2_BUCKET binding not available');
  return R2_BUCKET.put(key, body, {
    httpMetadata: contentType ? { contentType } : undefined,
  });
}

async function cfGet(key: string) {
  if (!R2_BUCKET) throw new Error('R2_BUCKET binding not available');
  return R2_BUCKET.get(key);
}

async function cfDelete(key: string) {
  if (!R2_BUCKET) throw new Error('R2_BUCKET binding not available');
  return R2_BUCKET.delete(key);
}

async function cfList(prefix?: string) {
  if (!R2_BUCKET) throw new Error('R2_BUCKET binding not available');
  return R2_BUCKET.list({ prefix });
}

// ========== AWS SDK Fallback (本地开发) ==========

let s3ClientPromise: Promise<any> | null = null;

async function getS3Client() {
  if (!s3ClientPromise) {
    s3ClientPromise = (async () => {
      const { S3Client } = await import('@aws-sdk/client-s3');
      return new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
    })();
  }
  return s3ClientPromise;
}

async function sdkUpload(key: string, body: Buffer | Uint8Array | string, contentType?: string) {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getS3Client();
  return client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

async function sdkGet(key: string) {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getS3Client();
  return client.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
  );
}

async function sdkDelete(key: string) {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getS3Client();
  return client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
  );
}

async function sdkList(prefix?: string) {
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  const client = await getS3Client();
  return client.send(
    new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
    })
  );
}

// ========== 统一导出 API ==========

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | ArrayBuffer | string,
  contentType?: string
) {
  if (isCloudflareWorkers()) {
    const arrayBuffer = body instanceof ArrayBuffer ? body :
      body instanceof Uint8Array ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) :
      body;
    return cfUpload(key, arrayBuffer as ArrayBuffer | string, contentType);
  }
  return sdkUpload(key, body as Buffer | Uint8Array | string, contentType);
}

export async function getFromR2(key: string) {
  if (isCloudflareWorkers()) {
    return cfGet(key);
  }
  return sdkGet(key);
}

export async function deleteFromR2(key: string) {
  if (isCloudflareWorkers()) {
    return cfDelete(key);
  }
  return sdkDelete(key);
}

export async function listR2Objects(prefix?: string) {
  if (isCloudflareWorkers()) {
    return cfList(prefix);
  }
  return sdkList(prefix);
}

// Presigned URLs (仅本地开发支持，CF 环境使用 Workers 直接处理)
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
) {
  if (isCloudflareWorkers()) {
    throw new Error('Presigned URLs not supported in CF Workers. Use direct upload via API route.');
  }
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const client = await getS3Client();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
  if (isCloudflareWorkers()) {
    throw new Error('Presigned URLs not supported in CF Workers. Use direct download via API route.');
  }
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const client = await getS3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn }
  );
}

export function getPublicUrl(key: string) {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (publicDomain) {
    // 移除可能的 https:// 前缀
    const domain = publicDomain.replace(/^https?:\/\//, '');
    return `https://${domain}/${key}`;
  }
  return null;
}
