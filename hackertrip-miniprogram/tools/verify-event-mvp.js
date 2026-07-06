#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

function checkJsSyntax(rel) {
  const code = read(rel);
  try {
    new vm.Script(code, { filename: rel });
  } catch (e) {
    throw new Error(`${rel} syntax error: ${e.message}`);
  }
}

function main() {
  const app = JSON.parse(read('miniprogram/app.json'));
  const pages = [
    'pages/event-checkin/event-checkin',
    'pages/event-members/event-members',
    'pages/handshake/handshake',
    'pages/achievements/achievements',
    'pages/form-assistant/form-assistant',
    'pages/organizer-verify/organizer-verify',
    'pages/team-builder/team-builder',
  ];

  pages.forEach((page) => {
    assert(app.pages.indexOf(page) !== -1, `app.json missing page: ${page}`);
    ['js', 'json', 'wxml', 'wxss'].forEach((ext) => {
      const rel = `miniprogram/${page}.${ext}`;
      assert(exists(rel), `missing page file: ${rel}`);
      if (ext === 'js') checkJsSyntax(rel);
      if (ext === 'json') JSON.parse(read(rel));
    });
  });

  checkJsSyntax('miniprogram/utils/api.js');
  checkJsSyntax('miniprogram/pages/detail/detail.js');
  checkJsSyntax('miniprogram/pages/profile/profile.js');
  checkJsSyntax('cloudfunctions/eventHub/index.js');
  checkJsSyntax('cloudfunctions/submitHackathonClaim/index.js');
  checkJsSyntax('cloudfunctions/saveProfile/index.js');
  checkJsSyntax('cloudfunctions/getProfile/index.js');
  checkJsSyntax('cloudfunctions/adminHackathonManage/index.js');

  const eventPkg = JSON.parse(read('cloudfunctions/eventHub/package.json'));
  assert(eventPkg.dependencies && eventPkg.dependencies['wx-server-sdk'], 'eventHub package missing wx-server-sdk');

  const api = read('miniprogram/utils/api.js');
  [
    'getEventProfile',
    'checkinEvent',
    'saveEventProfile',
    'listEventMembers',
    'createHandshake',
    'listAchievements',
    'verifyAchievement',
    'generateRegistrationDraft',
    'recommendTeamMembers',
    'getHackathonClaims',
    'getHackathonClaim',
    'submitHackathonClaim',
    'getOwnedHackathons',
  ].forEach((name) => {
    assert(api.indexOf(name) !== -1, `api.js missing ${name}`);
  });

  const eventHub = read('cloudfunctions/eventHub/index.js');
  [
    'checkin',
    'saveEventProfile',
    'getEventProfile',
    'listEventMembers',
    'createHandshake',
    'verifyAchievement',
    'listAchievements',
  ].forEach((action) => {
    assert(eventHub.indexOf(`'${action}'`) !== -1, `eventHub missing action ${action}`);
  });

  const membersWxml = read('miniprogram/pages/event-members/event-members.wxml');
  assert(membersWxml.indexOf('.join(') === -1, 'event-members.wxml should not call Array.join in template');
  const organizerVerifyWxml = read('miniprogram/pages/organizer-verify/organizer-verify.wxml');
  assert(organizerVerifyWxml.indexOf('levelText(') === -1, 'organizer-verify.wxml should not call page methods in template');

  console.log('event MVP verification passed');
}

main();
