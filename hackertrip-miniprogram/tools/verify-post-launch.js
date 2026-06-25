#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function walk(dir, out) {
  const abs = path.join(root, dir);
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

function assertNoForbiddenText(dir, text, message) {
  const files = walk(dir, []).filter((rel) => /\.(js|json|wxml|wxss)$/.test(rel));
  for (const rel of files) {
    assert(!read(rel).includes(text), `${message}: ${rel}`);
  }
}

function contains(rel, pattern, message) {
  const text = read(rel);
  if (pattern instanceof RegExp) {
    assert(pattern.test(text), message || `${rel} missing ${pattern}`);
  } else {
    assert(text.includes(pattern), message || `${rel} missing ${pattern}`);
  }
}

function assertInOrder(rel, patterns, message) {
  const text = read(rel);
  let cursor = -1;
  for (const pattern of patterns) {
    const index = pattern instanceof RegExp
      ? text.slice(cursor + 1).search(pattern)
      : text.slice(cursor + 1).indexOf(pattern);
    assert(index !== -1, `${message || 'expected order not found'}: ${rel}`);
    cursor += 1 + index;
  }
}

function verifyAppJson() {
  const app = JSON.parse(read('miniprogram/app.json'));
  assert(!app.agent, 'app.json must not contain unsupported "agent" field');
  assert(app.usingComponents && app.usingComponents['auth-modal'] === '/components/auth-modal/index', 'auth-modal must be globally registered');
  for (const page of app.pages) {
    for (const ext of ['js', 'json', 'wxml', 'wxss']) {
      assert(exists(`miniprogram/${page}.${ext}`), `missing page file: miniprogram/${page}.${ext}`);
    }
  }
}

function verifyCloudFunctionReferences() {
  const api = read('miniprogram/utils/api.js');
  const refs = [...new Set([...api.matchAll(/callFn\(['"]([^'"]+)['"]/g)].map((match) => match[1]))].sort();
  assert(refs.length > 0, 'no cloud function references found');
  for (const name of refs) {
    assert(exists(`cloudfunctions/${name}/index.js`), `missing cloudfunction implementation: ${name}`);
  }
}

function verifyAuthContract() {
  assertNoForbiddenText('miniprogram', '已取消登录', 'mini program must not show misleading login cancel copy');
  contains('miniprogram/utils/api.js', /function getAuth\(\)[\s\S]*cached\.openid[\s\S]*clearUserSession/, 'getAuth must reject stale auth without openid');
  contains('miniprogram/utils/api.js', /async function requireAuth[\s\S]*isLoggedIn\(\)[\s\S]*selectComponent\('#authModal'\)/, 'requireAuth must open auth-modal only after checking login state');
  contains('miniprogram/utils/api.js', /async function loginWithUserInfo[\s\S]*cloudReady[\s\S]*callFn\('login'[\s\S]*!res\.openid[\s\S]*const openid = res\.openid[\s\S]*openid, userInfo[\s\S]*setAuth\(auth\)/, 'login must require cloud login and bind auth to openid');
  contains('miniprogram/components/auth-modal/index.js', 'wx.getUserProfile', 'auth modal must use WeChat profile authorization');
  contains('miniprogram/components/auth-modal/index.js', '未完成登录', 'auth modal cancel copy must not say 已取消登录');
  contains('miniprogram/pages/profile/profile.wxml', 'bindtap="openLogin"', 'profile page must expose login entry');
  contains('miniprogram/pages/profile/profile.wxml', '<auth-modal id="authModal"', 'profile page must include auth modal');
  assertInOrder('miniprogram/pages/profile/profile.js', ['api.isLoggedIn()', "selectComponent('#authModal')", 'modal.open'], 'profile login entry must avoid prompting already logged-in users');
  contains('miniprogram/pages/settings/settings.js', "wx.switchTab({ url: '/pages/profile/profile' })", 'settings login action must route back to profile login entry');
  assert(!read('miniprogram/pages/settings/settings.wxml').includes('<auth-modal'), 'settings page must not duplicate the primary auth modal');
  assert(!read('miniprogram/pages/settings/settings.wxml').includes('微信登录</button>'), 'settings page must not expose a second direct login button');
  contains('miniprogram/pages/detail/detail.js', 'api.requireAuth(', 'detail join schedule must require auth');
  contains('miniprogram/pages/detail/detail.js', 'api.addRegistration(item)', 'detail join schedule must persist registration');
  assertInOrder('miniprogram/pages/detail/detail.js', ['api.requireAuth(', 'if (!auth) return', 'api.addRegistration(item)'], 'joining schedule must authenticate before registration write');
  contains('cloudfunctions/addRegistration/index.js', /cloud\.getWXContext\(\)[\s\S]*OPENID/, 'addRegistration cloud function must bind records to caller OPENID');
}

function verifyAuthModalCoverage() {
  const files = walk('miniprogram/pages', []).filter((rel) => rel.endsWith('.js'));
  for (const rel of files) {
    const js = read(rel);
    assert(!/api\.requireAuth\(\s*['"]/.test(js), `${rel} must not use legacy redirect-only requireAuth`);
    if (!js.includes('api.requireAuth(this')) continue;
    const wxml = rel.replace(/\.js$/, '.wxml');
    assert(exists(wxml), `${rel} requires auth but ${wxml} is missing`);
    contains(wxml, '<auth-modal id="authModal"', `${wxml} must include auth-modal for modal login`);
  }
}

function verifyScheduleOwnership() {
  contains('miniprogram/pages/profile/profile.js', '我的身份卡', 'profile tools should keep identity entry');
  assert(!read('miniprogram/pages/profile/profile.wxml').includes('还没有关注的赛事'), 'profile page must not show followed-event empty state');
  contains('miniprogram/pages/schedule/schedule.wxml', '已加入赛程', 'schedule page must show joined-event section');
  contains('miniprogram/pages/schedule/schedule.wxml', '已收藏赛事', 'schedule page must show bookmark section');
  contains('miniprogram/pages/schedule/schedule.js', 'activeEvent =', 'schedule page must derive active event from user-owned data');
  assertInOrder('miniprogram/pages/schedule/schedule.js', ['api.isLoggedIn()', 'api.syncUserDataIfLoggedIn()', 'api.getRegistrations()', 'api.getBookmarkedHackathons()'], 'schedule must sync current user data before reading joined/bookmarked events');
  contains('miniprogram/pages/schedule/schedule.wxml', '登录后查看你已加入和收藏的赛事', 'schedule page must show logged-out login prompt instead of stale personal data');
  contains('miniprogram/pages/detail/detail.js', 'api.toggleBookmark(item.id)', 'detail page must let users follow/bookmark an event');
  contains('miniprogram/pages/detail/detail.wxml', "{{bookmarked ? '取消收藏' : '收藏赛事'}}", 'detail page must expose bookmark state');
  contains('miniprogram/pages/schedule/schedule.js', 'async removeBookmark', 'schedule page must let users remove followed/bookmarked events');
  contains('miniprogram/pages/schedule/schedule.wxml', 'catchtap="removeBookmark"', 'schedule bookmark list must expose remove action');
}

function verifyUserBoundDataSync() {
  [
    'function getBookmarks() {\n  if (!hasUserSession()) return [];',
    'function getRegistrations() {\n  if (!hasUserSession()) return [];',
    'function getCards() {\n  if (!hasUserSession()) return [];',
    'function getProfile() {\n  if (!hasUserSession()) return Object.assign({}, DEFAULT_PROFILE);',
    'function getOrganizerApplication() {\n  if (!hasUserSession()) {',
    'function getHackathonDrafts() {\n  if (!hasUserSession()) return [];',
    'function getScanResults() {\n  if (!hasUserSession()) return null;',
    'function getAgentConfig() {\n  if (!hasUserSession()) return Object.assign({}, DEFAULT_AGENT_CONFIG);',
  ].forEach((snippet) => {
    contains('miniprogram/utils/api.js', snippet, 'user-bound getters must not read stale local user cache while logged out');
  });
  contains('miniprogram/utils/api.js', /async function syncUserDataIfLoggedIn\(\)[\s\S]*isLoggedIn\(\)[\s\S]*syncFromCloud\(\)/, 'api must expose a logged-in-only sync helper');
  contains('miniprogram/utils/api.js', /async function syncFromCloud\(\)[\s\S]*!cloudReady\(\) \|\| !isLoggedIn\(\)/, 'syncFromCloud must skip when there is no current login session');
  [
    'miniprogram/pages/profile/profile.js',
    'miniprogram/pages/inbox/inbox.js',
    'miniprogram/pages/index/index.js',
    'miniprogram/pages/hackathon-list/hackathon-list.js',
    'miniprogram/pages/detail/detail.js',
    'miniprogram/pages/public-site/public-site.js',
    'miniprogram/pages/identity/identity.js',
    'miniprogram/pages/identity-edit/identity-edit.js',
    'miniprogram/pages/agent/agent.js',
    'miniprogram/pages/match/match.js',
    'miniprogram/pages/settings/settings.js',
    'miniprogram/pages/organizer/organizer.js',
    'miniprogram/pages/hackathon-create/hackathon-create.js',
    'miniprogram/pages/portfolio/portfolio.js',
  ].forEach((rel) => {
    contains(rel, 'api.syncUserDataIfLoggedIn()', `${rel} must refresh current-user cloud cache before showing user-bound data`);
  });
  const pageFiles = walk('miniprogram/pages', []).filter((rel) => rel.endsWith('.js'));
  for (const rel of pageFiles) {
    assert(!read(rel).includes('api.syncFromCloud()'), `${rel} must use syncUserDataIfLoggedIn instead of raw syncFromCloud`);
  }
}

function verifyIdentityAndShare() {
  contains('miniprogram/pages/identity/identity.wxml', '编辑资料', 'identity page must expose edit step');
  contains('miniprogram/pages/identity/identity.wxml', '生成预览', 'identity page must expose generate step');
  contains('miniprogram/pages/identity/identity.wxml', '保存转发', 'identity page must expose share/save step');
  contains('miniprogram/pages/identity/identity.js', 'api.getProfileQr', 'identity card must request profile QR');
  contains('miniprogram/pages/identity/identity.js', /async regenerateCard\(\)[\s\S]*api\.requireAuth[\s\S]*loadProfileQr\(\{ promptLogin: true \}\)/, 'identity generate action must prompt login before QR generation');
  contains('miniprogram/pages/identity/identity.wxml', '<auth-modal id="authModal" bind:login="onAuthLogin"', 'identity page must bind auth modal login callback');
  contains('miniprogram/pages/identity/identity.js', 'onShareAppMessage', 'identity card must support WeChat share');
  contains('miniprogram/pages/identity/identity.js', /async saveToAlbum\(\)[\s\S]*saveCard\(\{ silent: true \}\)/, 'saving image must persist identity card first');
  contains('miniprogram/pages/identity/identity.wxml', 'bindtap="prepareShare"', 'share button must prepare/persist identity card before forwarding');
  contains('miniprogram/pages/share/share.js', 'api.getPublicProfile(uid)', 'share landing must fetch sharer public profile');
  contains('miniprogram/pages/public-site/public-site.js', 'api.getPublicProfile(uid)', 'public site must fetch public profile by uid');
  contains('miniprogram/pages/public-site/public-site.js', 'projects: api.getPortfolioProjects()', 'own public profile preview must use synced portfolio projects');
  contains('cloudfunctions/getPublicProfile/index.js', /function buildProjects\(scan\)[\s\S]*scan\.project[\s\S]*projects\.length/, 'public profile cloud function must derive public projects from latest synced project');
}

function verifyAgentAndSkills() {
  contains('miniprogram/pages/agent/agent.js', 'api.saveAgentConfig', 'agent page must persist config');
  contains('miniprogram/pages/agent/agent.js', 'sourceSteps', 'agent page must expose context source status');
  contains('miniprogram/pages/agent/agent.wxml', '数据来源', 'agent page must explain where context data comes from');
  contains('miniprogram/pages/agent/agent.wxml', 'Haki 可读取内容', 'agent page must expose authorized context switches');
  contains('cloudfunctions/aiChat/index.js', 'agentConfig', 'aiChat must read agent config');
  contains('cloudfunctions/aiChat/index.js', 'sync_pairs', 'aiChat must read latest synced project context');
  contains('cloudfunctions/saveAgentConfig/index.js', /cloud\.getWXContext\(\)[\s\S]*OPENID/, 'saveAgentConfig must bind config to caller OPENID');
  contains('miniprogram/pages/sync/sync.js', 'api.createSyncPair', 'sync page must create one-time pair');
  contains('miniprogram/pages/sync/sync.js', 'api.pullSyncByCode', 'sync page must pull sync result');
  contains('miniprogram/pages/sync/sync.js', 'syncEndpointReady', 'sync page must guard missing HTTP endpoint');
  assertInOrder('miniprogram/pages/sync/sync.js', ['syncEndpointReady', 'api.requireAuth', 'api.createSyncPair'], 'sync command generation must check endpoint and auth before create pair');
  assertInOrder('miniprogram/pages/sync/sync.js', ['api.requireAuth', 'this.data.code.length !== 6', 'api.pullSyncByCode'], 'sync pull must authenticate and validate code before pulling');
  contains('miniprogram/utils/api.js', '上线产品不再把 mock 当成功', 'sync API must reject mock-as-success behavior');
  assert(!/async function pullSyncByCode[\s\S]*localScan[\s\S]*return \{[\s\S]*synced: true/.test(read('miniprogram/utils/api.js')), 'pullSyncByCode must not return local mock success');
  contains('miniprogram/pages/sync/sync.wxml', '同步后会更新', 'sync page must show where synced data is used');
  contains('miniprogram/utils/api.js', /function getPortfolioProjects\(\)[\s\S]*getScanResults\(\)[\s\S]*project/, 'portfolio projects must derive from synced user project data instead of hardcoded samples');
  assert(!read('miniprogram/pages/identity/identity.js').includes("aiTools: ['Claude Code']"), 'identity card must not prefill fake AI tools');
  assert(!read('miniprogram/utils/card-canvas.js').includes("['Claude Code', 'Cursor']"), 'card canvas must not render fake AI tools when user has none');
  contains('cloudfunctions/pairSync/index.js', "action === 'create'", 'pairSync must support create action');
  contains('cloudfunctions/pairSync/index.js', "action === 'push'", 'pairSync must support push action');
  contains('cloudfunctions/pairSync/index.js', "action === 'pull'", 'pairSync must support pull action');
  contains('cloudfunctions/pairSync/index.js', /action === 'create'[\s\S]*if \(!openid\)[\s\S]*const uploadToken = makeUploadToken\(\)[\s\S]*uploadToken,[\s\S]*openid,/, 'pairSync create must bind one-time upload token to caller OPENID');
  contains('../hackertrip-cli/bin/hackertrip.mjs', '--sync-code', 'CLI must support sync code argument');
}

function main() {
  verifyAppJson();
  verifyCloudFunctionReferences();
  verifyAuthContract();
  verifyAuthModalCoverage();
  verifyScheduleOwnership();
  verifyUserBoundDataSync();
  verifyIdentityAndShare();
  verifyAgentAndSkills();
  console.log('post-launch verification passed');
}

main();
