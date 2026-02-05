// OpenNext 配置，仅用于 Cloudflare Workers 构建 (npm run build:cf)
// Vercel 部署使用 next build，不会读取此文件
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

export default defineCloudflareConfig({
  // 默认配置，可根据需要调整
});
