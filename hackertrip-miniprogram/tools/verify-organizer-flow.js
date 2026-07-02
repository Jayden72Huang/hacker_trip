#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function matchField(actual, expected) {
  if (expected && typeof expected === 'object' && expected.__op === 'in') {
    return expected.values.indexOf(actual) !== -1;
  }
  if (expected && typeof expected === 'object' && expected.__op === 'neq') {
    return actual !== expected.value;
  }
  return actual === expected;
}

function matchesQuery(doc, query) {
  const keys = Object.keys(query || {});
  return keys.every((key) => matchField(doc[key], query[key]));
}

function ensureCollection(state, name) {
  if (!state[name]) state[name] = [];
  return state[name];
}

function createDb(state) {
  const command = {
    in(values) {
      return { __op: 'in', values };
    },
    neq(value) {
      return { __op: 'neq', value };
    },
  };

  function makeQuery(name, query) {
    let limitValue = 100;
    let order = null;
    return {
      orderBy(field, direction) {
        order = { field, direction };
        return this;
      },
      limit(value) {
        limitValue = value;
        return this;
      },
      async get() {
        let data = ensureCollection(state, name)
          .filter((doc) => matchesQuery(doc, query))
          .map((doc) => clone(doc));
        if (order) {
          data.sort((a, b) => {
            const av = a[order.field] || 0;
            const bv = b[order.field] || 0;
            return order.direction === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
          });
        }
        return { data: data.slice(0, limitValue) };
      },
    };
  }

  function makeDoc(name, id) {
    return {
      async get() {
        const doc = ensureCollection(state, name).find((item) => item._id === id);
        return { data: doc ? clone(doc) : null };
      },
      async update({ data }) {
        const list = ensureCollection(state, name);
        const index = list.findIndex((item) => item._id === id);
        if (index === -1) throw new Error(`${name}/${id} not found`);
        list[index] = Object.assign({}, list[index], clone(data || {}));
        return { updated: 1 };
      },
      async set({ data }) {
        const list = ensureCollection(state, name);
        const index = list.findIndex((item) => item._id === id);
        const next = Object.assign({ _id: id }, clone(data || {}));
        if (index === -1) list.push(next);
        else list[index] = next;
        return { updated: 1 };
      },
    };
  }

  return {
    command,
    collection(name) {
      return {
        where(query) {
          return makeQuery(name, query || {});
        },
        orderBy(field, direction) {
          return makeQuery(name, {}).orderBy(field, direction);
        },
        limit(value) {
          return makeQuery(name, {}).limit(value);
        },
        doc(id) {
          return makeDoc(name, id);
        },
        async add({ data }) {
          const list = ensureCollection(state, name);
          const id = `${name}_${String(list.length + 1).padStart(4, '0')}`;
          list.push(Object.assign({}, clone(data || {}), { _id: id }));
          return { _id: id };
        },
      };
    },
  };
}

function loadCloudFunction(rel, state, runtime) {
  const filename = path.join(root, rel);
  const code = fs.readFileSync(filename, 'utf8');
  const module = { exports: {} };
  const fakeCloud = {
    DYNAMIC_CURRENT_ENV: 'test-env',
    init() {},
    database() {
      return createDb(state);
    },
    getWXContext() {
      return { OPENID: runtime.openid || '' };
    },
    openapi: {
      security: {
        async msgSecCheck() {
          return { errcode: 0, result: { suggest: 'pass', label: 100 }, trace_id: 'trace-test' };
        },
      },
      subscribeMessage: {
        async send(payload) {
          runtime.sentMessages.push(clone(payload));
          return { errMsg: 'ok' };
        },
      },
    },
  };

  const context = {
    module,
    exports: module.exports,
    require(name) {
      if (name === 'wx-server-sdk') return fakeCloud;
      return require(name);
    },
    process: {
      env: Object.assign({}, process.env, {
        ADMIN_OPENIDS: 'admin-openid',
        NEW_HACKATHON_TEMPLATE_ID: 'tmpl-new',
      }),
    },
    console,
    Date,
    Promise,
    String,
    Number,
    Array,
    Object,
    RegExp,
    Math,
    JSON,
    encodeURIComponent,
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(code, context, { filename });
  return module.exports.main;
}

async function main() {
  const state = {
    organizer_applications: [],
    hackathon_drafts: [],
    hackathons: [],
    admin_users: [],
    sync_pairs: [],
    message_subscriptions: [],
    notification_logs: [],
  };
  const runtime = { openid: 'organizer-openid', sentMessages: [] };

  const submitOrganizerApplication = loadCloudFunction('cloudfunctions/submitOrganizerApplication/index.js', state, runtime);
  const submitHackathonDraft = loadCloudFunction('cloudfunctions/submitHackathonDraft/index.js', state, runtime);
  const adminHackathonManage = loadCloudFunction('cloudfunctions/adminHackathonManage/index.js', state, runtime);
  const sendHackathonNotifications = loadCloudFunction('cloudfunctions/sendHackathonNotifications/index.js', state, runtime);
  const eventSync = loadCloudFunction('cloudfunctions/eventSync/index.js', state, runtime);

  const organizerForm = {
    orgName: 'HackerTrip 测试主办方',
    role: '社区负责人',
    contact: 'organizer@example.com',
    website: 'https://hackertrip.space',
    note: '本地契约验证，不写线上库。',
  };
  const appRes = await submitOrganizerApplication({ form: organizerForm });
  assert(appRes.ok && appRes.status === 'pending', 'organizer application should enter pending');
  assert(state.organizer_applications.length === 1, 'organizer application should be saved');

  const unapprovedDraft = await submitHackathonDraft({
    form: {
      name: '未审核不能提交',
      city: '线上',
      mode: 'online',
      startDate: '2026-07-10',
      endDate: '2026-07-12',
      website: 'https://example.com',
      summary: 'should fail before organizer approval',
    },
  });
  assert(!unapprovedDraft.ok && unapprovedDraft.code === 'NOT_ORGANIZER', 'unapproved organizer must not submit draft');

  runtime.openid = 'admin-openid';
  const approveOrganizer = await adminHackathonManage({
    action: 'approveOrganizer',
    applicationId: appRes.id,
  });
  assert(approveOrganizer.ok, 'admin should approve organizer application');
  assert(state.organizer_applications[0].status === 'approved', 'organizer status should become approved');

  runtime.openid = 'organizer-openid';
  const draftRes = await submitHackathonDraft({
    form: {
      name: '主办方流程测试赛',
      city: '线上',
      mode: 'online',
      startDate: '2026-07-10',
      endDate: '2026-07-12',
      prizePool: '测试奖池',
      tracks: 'AI Agent',
      website: 'https://hackertrip.space',
      summary: '本地契约验证赛事。',
    },
  });
  assert(draftRes.ok && draftRes.status === 'pending_manual_review', 'approved organizer should submit draft to manual review');
  assert(state.hackathon_drafts.length === 1, 'draft should be saved');

  state.sync_pairs.push({
    _id: 'sync_pair_unapproved',
    code: '111111',
    uploadToken: 'bad-token',
    openid: 'unapproved-openid',
    expireAt: Date.now() + 30 * 60 * 1000,
    eventBound: false,
  });
  const rejectedCli = await eventSync({
    action: 'submit',
    pairCode: '111111',
    submitToken: 'bad-token',
    event: {
      name: '未认证 CLI 测试赛',
      city: '线上',
      startDate: '2026-07-10',
      endDate: '2026-07-12',
      website: 'https://example.com',
    },
  });
  assert(!rejectedCli.ok && rejectedCli.code === 'NOT_ORGANIZER', 'eventSync must reject unapproved pair owner');

  state.sync_pairs.push({
    _id: 'sync_pair_approved',
    code: '222222',
    uploadToken: 'good-token',
    openid: 'organizer-openid',
    expireAt: Date.now() + 30 * 60 * 1000,
    eventBound: false,
  });
  const cliDraft = await eventSync({
    action: 'submit',
    pairCode: '222222',
    submitToken: 'good-token',
    event: {
      name: 'CLI 主办方测试赛',
      city: '线上',
      mode: 'online',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      website: 'https://hackertrip.space',
      summary: 'CLI contract test',
      tracks: ['AI Agent'],
    },
  });
  assert(cliDraft.ok && cliDraft.status === 'pending_manual_review', 'approved eventSync pair should create draft');
  assert(state.sync_pairs.find((item) => item._id === 'sync_pair_approved').eventBound === true, 'eventSync pair should become one-time bound');

  runtime.openid = 'admin-openid';
  const approveDraft = await adminHackathonManage({
    action: 'approveDraft',
    draftId: draftRes.id,
  });
  assert(approveDraft.ok && approveDraft.id, 'admin should publish approved draft');
  assert(state.hackathons.length === 1, 'published hackathon should be inserted');
  assert(state.hackathon_drafts[0].status === 'approved', 'draft should be marked approved');

  const setOffline = await adminHackathonManage({
    action: 'setPublished',
    docId: state.hackathons[0]._id,
    id: state.hackathons[0].id,
    isPublished: false,
  });
  assert(setOffline.ok && setOffline.isPublished === false, 'admin should be able to unpublish hackathon');
  assert(state.hackathons[0].isPublished === false, 'hackathon should become unpublished');

  state.message_subscriptions.push({
    _id: 'sub_1',
    openid: 'subscriber-openid',
    type: 'new_hackathon',
    templateId: 'tmpl-new',
    status: 'accept',
    updatedAt: Date.now(),
  });
  const preview = await sendHackathonNotifications({
    action: 'preview',
    type: 'new_hackathon',
  });
  assert(preview.ok && preview.count === 1, 'notification preview should count accepted subscribers');

  const send = await sendHackathonNotifications({
    action: 'send',
    type: 'new_hackathon',
    hackathonId: state.hackathons[0].id,
    hackathon: state.hackathons[0],
    title: state.hackathons[0].shortName || state.hackathons[0].name,
    note: '打开 HackerTrip 查看详情',
  });
  assert(send.ok && send.sent === 1 && send.failed === 0, 'notification send should deliver to accepted subscribers in fake runtime');
  assert(runtime.sentMessages.length === 1, 'fake subscribeMessage.send should be called once');
  assert(state.notification_logs.length === 1 && state.notification_logs[0].ok === true, 'notification send should be logged');

  console.log(JSON.stringify({
    ok: true,
    cases: {
      organizerApplication: appRes.status,
      unapprovedSubmitCode: unapprovedDraft.code,
      organizerApproved: state.organizer_applications[0].status,
      draftStatus: draftRes.status,
      eventSyncRejectedCode: rejectedCli.code,
      eventSyncAcceptedStatus: cliDraft.status,
      publishedHackathons: state.hackathons.length,
      notificationSubscribers: preview.count,
      notificationSent: send.sent,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
