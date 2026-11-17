/**
 * 大肥鱼（三只形态共用）的台词覆盖。
 *
 * 基准文案是鲸鱼口吻（"正在深潜检索知识库""游一游"），从一只蹲在桌面上的蓝毛小女仆嘴里
 * 说出来很违和。这里只改口吻相关的几组，其余自动回落基准（见 i18n.ts 的 mergeStrings）。
 *
 * @module dsh-pet/src/client/pets/dafeiyu/text
 */
import type { PetTextOverrides } from '../../i18n'

const zh: PetTextOverrides = {
  status: {
    idle: [
      '（嚼着白米饭，腮帮子鼓鼓的）',
      '今天要写什么代码？我趴在键盘边看着 👀',
      '有点困…但你要是开工我就醒着',
      '（甩了甩尾巴，水花没溅出来）',
    ],
    think: ['嗯…让我想想这道题的解法 🤔', '（托腮）这个词是什么意思啊…', '脑子转起来了，尾巴也跟着晃 🐟'],
    working: ['我帮你盯着进度！⚡', '正在跑工具——别急，我数着呢', '（掏出画板开始记笔记）'],
    celebrate: ['搞定啦！奖励我一口白饭吧 🍚', '测试全绿，尾鳍都翘起来了 ✨', '（开心地转了个圈）'],
  },
  aria: {
    mini: '显示桌面宠大肥鱼',
    miniTitle: (state) => `大肥鱼（${state}）· 点击召回，可拖动`,
  },
}

const en: PetTextOverrides = {
  status: {
    idle: ['(chewing rice, cheeks puffed)', 'What are we coding today? I am watching 👀', 'Sleepy... but I stay awake if you work'],
    think: ['Hmm... let me think 🤔', '(chin in hand) what does this word mean...', 'Brain spinning, tail swinging 🐟'],
    working: ['I am watching the progress! ⚡', 'Tools are running — counting along', '(pulling out a notepad)'],
    celebrate: ['Done! Reward me with rice 🍚', 'All green — my tail curled up ✨', '(spins around happily)'],
  },
  aria: {
    mini: 'Show desktop pet Dafeiyu',
    miniTitle: (state) => `Dafeiyu (${state}) · click to recall, draggable`,
  },
}

export const DAFEIYU_TEXT = { zh, en }
