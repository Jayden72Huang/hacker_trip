import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToR2, getPublicUrl } from '@/lib/r2';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// POST /api/works/upload — 上传截图/视频到 R2
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: '请选择文件' }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 });
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: '图片不能超过 5MB' }, { status: 400 });
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: '视频不能超过 100MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || (isImage ? 'png' : 'mp4');
  const timestamp = Date.now();
  const key = `works/${session.user.id}/${timestamp}.${ext}`;

  const buffer = await file.arrayBuffer();
  await uploadToR2(key, buffer, file.type);

  const publicUrl = getPublicUrl(key);

  return NextResponse.json({
    data: { key, publicUrl, contentType: file.type, size: file.size },
  });
}
