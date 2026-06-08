#!/usr/bin/env node
/**
 * Skills 同步 —— 推送端桥接脚本。
 *
 * 作用：把电脑上 /ht-scan-project 的扫描结果，连同一个 6 位配对码，
 *       推送到小程序云开发（pairSync 云函数的 HTTP 触发器）。
 *       手机端在「同步」页输入该配对码即可拉取。
 *
 * 前置：
 *   1. 在微信开发者工具给 pairSync 云函数配置「HTTP 触发器」，得到访问路径，形如
 *      https://<envId>.service.tcloudbase.com/pairSync
 *      （云开发控制台 → 云函数 → pairSync → 触发管理 / HTTP 访问服务）
 *   2. 设置环境变量 HT_SYNC_URL 指向该地址
 *
 * 用法：
 *   node push-sync.mjs <scan.json> [配对码]
 *   # 不传配对码则自动生成一个并打印
 *
 * scan.json 结构见 miniprogram/data/mock-scan.js
 */

import { readFileSync } from 'node:fs';

const SYNC_URL = process.env.HT_SYNC_URL;
const file = process.argv[2];
let code = (process.argv[3] || '').toUpperCase();

if (!file) {
  console.error('用法: node push-sync.mjs <scan.json> [配对码]');
  process.exit(1);
}
if (!SYNC_URL) {
  console.error('请先设置环境变量 HT_SYNC_URL（pairSync 云函数的 HTTP 触发地址）');
  process.exit(1);
}

function genCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
if (!code) code = genCode();

let scan;
try {
  scan = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error('读取/解析扫描文件失败：', e.message);
  process.exit(1);
}

// 可选：从 scan.identity 派生一张身份卡一起推送
const card = scan.identity
  ? Object.assign({ id: 'card-identity-' + scan.identity.role, variant: 'identity' }, scan.identity)
  : null;

const res = await fetch(SYNC_URL, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'push', pairCode: code, scan, card }),
});

const text = await res.text();
let json;
try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }

if (json.ok) {
  console.log('\n✅ 已推送到云端。在小程序「同步」页输入配对码：\n');
  console.log('     ┌────────────┐');
  console.log(`     │   ${code}   │`);
  console.log('     └────────────┘\n');
  console.log('   配对码 30 分钟内有效。\n');
} else {
  console.error('❌ 推送失败：', json.message || text);
  process.exit(1);
}
