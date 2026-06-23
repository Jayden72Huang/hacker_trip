// SKILL 入口：注册 HackerTrip 黑客松向导的原子接口
// 按官方规范 wx.modelContext.createSkill(path).registerAPI(name, fn)
const searchHackathons = require('./apis/searchHackathons.js');
const matchHackathonsByStack = require('./apis/matchHackathonsByStack.js');
const getHackathonDetail = require('./apis/getHackathonDetail.js');

const skill = wx.modelContext.createSkill('/skills/hackathon-guide');

skill.registerAPI('searchHackathons', searchHackathons);
skill.registerAPI('matchHackathonsByStack', matchHackathonsByStack);
skill.registerAPI('getHackathonDetail', getHackathonDetail);

module.exports = skill;
