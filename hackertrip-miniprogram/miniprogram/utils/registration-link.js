// 报名链接解析与打开：detail / discover / hackathon-list 三处共用，避免各写一份。
// 能直跳的小程序目标用 wx.navigateToMiniProgram，其余复制链接并按类型给出正确引导。

// 新闻/资讯站域名：抓取数据常把报道页误填进 website，不能当报名链接引导用户
const NEWS_HOSTS = [
  'ithome.com',
  'zhihu.com',
  'sina.com.cn',
  'sina.cn',
  'geekpark.net',
  '36kr.com',
  'sohu.com',
  'thepaper.cn',
  'ifeng.com',
];

function firstText(values) {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function isNewsUrl(url) {
  const m = String(url || '').match(/^https?:\/\/([^/]+)/i);
  if (!m) return false;
  const host = m[1].toLowerCase();
  return NEWS_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

function classifyUrl(url) {
  if (/^#小程序:\/\//.test(url)) return 'miniProgramShortLink';
  if (/^(weixin:\/\/|https?:\/\/wxaurl\.cn\/)/i.test(url)) return 'miniProgramLink';
  if (/^https?:\/\/mp\.weixin\.qq\.com\//i.test(url)) return 'wechatArticle';
  return 'webUrl';
}

function toastFor(type) {
  if (type === 'wechatArticle' || type === 'miniProgramLink') return '报名链接已复制,请在微信内打开报名';
  if (type === 'miniProgramPath') return '小程序报名路径已复制,请在微信内打开报名';
  return '报名链接已复制,请到浏览器打开报名';
}

/**
 * 解析赛事条目的报名入口。返回 null 表示没有可信的报名链接（新闻稿不算）。
 * type: miniProgramApp(直跳) / miniProgramShortLink(直跳) / miniProgramLink /
 *       miniProgramPath / wechatArticle / webUrl（后四种为复制引导）
 */
function resolveRegistrationLink(item) {
  const source = item || {};
  const miniProgram = source.registrationMiniProgram || source.miniProgram || {};

  const appId = firstText([
    source.registrationMiniProgramAppId,
    source.miniProgramAppId,
    miniProgram.appId,
    miniProgram.appid,
  ]);
  const path = firstText([
    source.registrationMiniProgramPath,
    source.miniProgramPath,
    miniProgram.path,
  ]);
  if (appId) {
    return { type: 'miniProgramApp', appId, path, value: path || appId, cta: '打开报名小程序' };
  }
  if (path) {
    return { type: 'miniProgramPath', value: path, toast: toastFor('miniProgramPath'), cta: '报名链接' };
  }

  // 明确的报名字段即使是资讯域名也尊重（人工填写优先）；
  // website/officialUrl 等模糊字段过滤新闻稿。
  const explicitUrl = firstText([
    source.registrationUrl,
    source.registerUrl,
    source.applyUrl,
    source.signupUrl,
  ]);
  const fallbackCandidates = [
    source.officialUrl,
    source.website,
    source.registrationMiniProgramUrl,
    source.miniProgramUrl,
    source.miniProgramScheme,
    miniProgram.url,
    miniProgram.scheme,
  ].filter((value) => typeof value === 'string' && value.trim() && !isNewsUrl(value));
  const url = explicitUrl || firstText(fallbackCandidates);
  if (!url) return null;

  const type = classifyUrl(url);
  if (type === 'miniProgramShortLink') {
    return { type, value: url, cta: '打开报名小程序' };
  }
  return { type, value: url, toast: toastFor(type), cta: '报名链接' };
}

function copyTextToClipboard(text, successToast) {
  const data = String(text || '').trim();
  if (!data) {
    wx.showToast({ title: '暂无可复制内容', icon: 'none' });
    return;
  }
  const attempt = (retried) => {
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({ title: successToast || '链接已复制', icon: 'none' });
      },
      fail: (err) => {
        if (!retried) {
          setTimeout(() => attempt(true), 120);
          return;
        }
        console.warn('[registration-link] setClipboardData failed', err);
        wx.showModal({
          title: '复制失败',
          content: `请手动复制:\n${data}`,
          confirmText: '知道了',
          showCancel: false,
        });
      },
    });
  };
  attempt(false);
}

/**
 * 打开报名入口。小程序目标直跳，其余复制链接。
 * 返回解析到的 link；返回 null 表示该赛事没有可信报名链接（调用方决定兜底）。
 */
function openRegistration(item) {
  const link = (item && item.registrationLink) || resolveRegistrationLink(item);
  if (!link || !link.value) return null;

  if (link.type === 'miniProgramApp' || link.type === 'miniProgramShortLink') {
    const params = link.type === 'miniProgramApp'
      ? { appId: link.appId, path: link.path || undefined }
      : { shortLink: link.value };
    wx.navigateToMiniProgram(Object.assign({}, params, {
      fail: (err) => {
        const msg = String((err && err.errMsg) || '');
        if (msg.indexOf('cancel') !== -1) return; // 用户主动取消不打扰
        // 直跳失败（appId 未关联等）兜底为复制
        copyTextToClipboard(link.path || link.value, toastFor('miniProgramPath'));
      },
    }));
    return link;
  }

  copyTextToClipboard(link.value, link.toast);
  return link;
}

module.exports = {
  resolveRegistrationLink,
  openRegistration,
  copyTextToClipboard,
  isNewsUrl,
};
