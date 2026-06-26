// 云函数：redeemInvite —— 核销好友暗号，绑定 referral + 双向解锁（F1 Haki 暗号）。
// 入参 { code }；当前用户=被邀请人(B)，暗号所有者=邀请人(A)。
// 规则：不能用自己的暗号；同一 B 对同一暗号只计一次；返回 A 画像供 Haki 生成组队雷达。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const RECRUITER_THRESHOLD = 3; // 招募值达标解锁「招募官」卡面

function normCode(raw) {
  let s = String(raw || '').toUpperCase().trim();
  // 容错：用户可能只发了 4 位码或带前后缀
  const m = s.match(/HT-?([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4})/);
  if (m) return `HT-${m[1]}`;
  return s;
}

async function readUser(openid) {
  const u = await db.collection('users').where({ openid }).limit(1).get();
  return u.data && u.data[0] ? u.data[0] : null;
}

async function ensureUser(openid) {
  let user = await readUser(openid);
  if (!user) {
    const now = Date.now();
    const add = await db.collection('users').add({
      data: { openid, createdAt: now, recruitScore: 0, unlockedCards: [] },
    });
    user = { _id: add._id, openid, recruitScore: 0, unlockedCards: [] };
  }
  return user;
}

function inviterView(ownerUser) {
  const u = ownerUser || {};
  return {
    name: u.nickname || 'HackerTrip 队友',
    role: u.role || '',
    city: u.city || '',
    bio: u.bio || '',
    skills: Array.isArray(u.skills) ? u.skills.slice(0, 12) : [],
    recruitScore: u.recruitScore || 0,
  };
}

exports.main = async (event) => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  if (!openid) return { ok: false, message: '缺少用户身份' };
  const code = normCode(event && event.code);
  if (!/^HT-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/.test(code)) {
    return { ok: false, code: 'BAD_FORMAT', message: '暗号格式不对，应该像 HT-7K3D' };
  }

  try {
    const inv = await db.collection('invites').where({ code }).limit(1).get();
    const invite = inv.data && inv.data[0];
    if (!invite) return { ok: false, code: 'NOT_FOUND', message: '没找到这个暗号，确认一下有没有发错？' };

    if (invite.ownerOpenid === openid) {
      return { ok: false, code: 'SELF', message: '这是你自己的暗号，发给朋友才有用～' };
    }

    const ownerUser = await readUser(invite.ownerOpenid);
    const alreadyRedeemed = Array.isArray(invite.redeemedBy) && invite.redeemedBy.indexOf(openid) !== -1;

    // 首次核销：绑定 referral + 双向结算
    let firstTime = false;
    let ownerUnlocked = [];
    if (!alreadyRedeemed) {
      firstTime = true;
      const me = await ensureUser(openid);

      // 1) 邀请记录入账
      await db.collection('invites').doc(invite._id).update({
        data: { redeemCount: _.inc(1), redeemedBy: _.addToSet(openid), lastRedeemAt: Date.now() },
      });

      // 2) 被邀请人：绑定 invitedBy（只认第一次）+ 解锁限定卡
      const mePatch = { unlockedCards: _.addToSet('invited_limited') };
      if (!me.invitedBy) mePatch.invitedBy = invite.ownerOpenid;
      await db.collection('users').doc(me._id).update({ data: mePatch });

      // 3) 邀请人：招募值 +1，达标解锁招募官卡
      if (ownerUser && ownerUser._id) {
        const newScore = (ownerUser.recruitScore || 0) + 1;
        const ownerPatch = { recruitScore: _.inc(1) };
        if (newScore >= RECRUITER_THRESHOLD) {
          ownerPatch.unlockedCards = _.addToSet('recruiter');
          ownerUnlocked = ['recruiter'];
        }
        await db.collection('users').doc(ownerUser._id).update({ data: ownerPatch });
        // 4) 给邀请人发一条 inbox 通知（被邀请成功）
        try {
          await db.collection('notifications').add({
            data: {
              openid: invite.ownerOpenid,
              type: 'invite_success',
              title: '有人通过你的暗号加入了 🎉',
              body: '你的招募值 +1，去看看能解锁什么卡面',
              read: false,
              createdAt: Date.now(),
            },
          });
        } catch (e) { /* notifications 集合不存在则忽略，不阻断 */ }
      }
    }

    return {
      ok: true,
      firstTime,
      alreadyRedeemed,
      inviter: inviterView(ownerUser),
      unlocked: firstTime ? ['invited_limited'] : [],
      ownerUnlocked,
    };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
