import assert from 'node:assert/strict';
import {
  buildConfirmationCommand,
  normalizeIncomingText,
  parseConfirmedCommand,
} from '../lib/feishu-agent/agent';

assert.equal(
  normalizeIncomingText('@_user_1 赛事 AdventureX', ['@_user_1']),
  '赛事 AdventureX',
);

assert.deepEqual(
  parseConfirmedCommand('确认更新赛事 ht-12｜建联状态=已联系｜建联负责人=柳艺Mandy｜下一步=约电话'),
  {
    action: 'update_event',
    target: 'ht-12',
    fields: {
      建联状态: '已联系',
      建联负责人: '柳艺Mandy',
      下一步: '约电话',
    },
  },
);

assert.deepEqual(
  parseConfirmedCommand('确认新增合作方 主办方=Example Labs｜主办方类型=企业｜跟进负责人=柳艺Mandy'),
  {
    action: 'create_partner',
    target: '',
    fields: {
      主办方: 'Example Labs',
      主办方类型: '企业',
      跟进负责人: '柳艺Mandy',
    },
  },
);

assert.equal(
  buildConfirmationCommand({
    type: 'propose_partner_update',
    target: 'SHE NICEST',
    fields: { 建联状态: '建联成功', 下一步: '同步合作资料' },
  }),
  '确认更新合作方 SHE NICEST｜建联状态=建联成功｜下一步=同步合作资料',
);

assert.equal(parseConfirmedCommand('更新赛事 ht-12｜建联状态=已联系'), null);

console.log('✅ HackerTrip Feishu Agent 指令验证通过');
