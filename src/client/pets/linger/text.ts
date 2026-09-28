// 灵儿的专属文案：覆盖 i18n.ts 里"鲸鱼口吻"的基准台词。
// 只写要改的条目，其余回落基准；台词池（string[]）整组替换。
import type { PetTextOverrides } from '../../i18n'

const zh: PetTextOverrides = {
  status: {
    idle: ['灵儿在此，静候差遣 🌸', '今日要处理什么凡间事务？', '衣袖轻拂，随时可以动身。', '（理了理裙裾，安静站着）'],
    think: ['凝神推演中…', '让我静心算一算这一步。', '灵台清明，正在梳理脉络 ✦', '（闭目掐指，指尖灵光微亮）'],
    working: ['法术将成，稍候片刻。', '正在施展符术，灵光流转 ✦', '（以指为笔，在空中画符）'],
    celebrate: ['事成！天地灵气为之一清 ✦', '此局已解，皆大欢喜。', '（轻轻一跃，花瓣随之升起）'],
    error: ['哎呀，法诀念错了一个字……', '灵气紊乱，待我重新结印。', '（符纸烧焦了，有点不好意思）'],
    wait: ['此事需你定夺。', '我在此候你一句话。', '（歪头看你，等你示下）'],
    disappointed: ['唔……这一式没能成。', '修行本就有起有落，我再练练。', '（垂袖静立，稍作调息）'],
  },
  bond: {
    levelUp: ['', '与你相处久了，我的灵力也稳了些 ✦', '此后路上，你我同行便是 (´∀｀)♡'],
    poke: [
      ['……（睁眼看你一眼）', '嗯？', '仙家弟子，不可轻戳。', '（衣袖一拂）'],
      ['嘻，痒的。', '再戳灵气要散了哦 🌸', '把我当小猫了么？', '（用袖子挡了一下）'],
      ['又来啦~ 陪你玩便是 ♡', '今天心情好，任你戳。', '（把花瓣分你一半）', '好啦好啦，我在这儿呢。'],
    ],
    welcome: ['灵儿见过你 🌸', '你回来啦，今日也一起吧。', '（迎上前一步，衣袖轻扬）'],
    chatter: [
      '（安静地站在你身侧）',
      '此地灵气不错，适合修行 ✦',
      '你忙你的，我不打扰。',
      '（把一枚花瓣放在你手边）',
      '若累了，记得歇息。',
    ],
  },
  panel: {
    swim: '🗡 御剑',
  },
  feedback: {
    roll: '旋身一礼，谢你相伴 ♡',
    feed: '（小口吃了）多谢，味道清甜。',
    hidden: '我先隐去身形，唤我便是 🌸',
    shown: '灵儿回来了，可有事吩咐？',
    schedule1h: '好，一小时后我自行隐去。',
    scheduleDaily: '记下了：每晚 22:00 我自行隐去 🌙',
    sleep: '入定去了…… (Zzz) 💤',
    swim: ['御剑起，随云而行 🗡', '换个方向看看你在哪。', '剑气开路，闲人退避。', '乘风一游，正好散心。', '（衣袂翻飞，落在剑上）'],
    swimOn: '御剑术已开，我自己走走 🗡☁️',
    swimOff: '收剑，灵儿归位。',
    joy: ['心里欢喜 ✦', '（转了个圈，裙摆旋开）', '灵气都轻快起来了。', '嘻，今日甚好。'],
    pokeDizzy: ['哎呀，轻些……有点晕 @-@', '转得我眼花啦。', '（扶了扶发簪）'],
    pokeAnnoyed: ['再戳，我可要掐诀了哦 (￣▽￣)"', '凡人，莫要得寸进尺。', '好啦，我知道你在 🌀', '衣袖都要被你戳皱了。'],
    pokeSulk: ['哼，不理你了 (￣ε(#￣)', '灵儿生气了！', '要赔我一枝花才理你 (｀へ´)'],
    comfort: ['……谢谢你还在 (´;ω;`)', '被你这样一摸头，力气就回来了 ✦', '有你在，再来一次便是。'],
    shaken: ['哎呀——别晃了，发簪要掉了 @_@', '天旋地转…符也画不直了。', '停停停！灵气都被你摇散了 >_<', '眼冒金星……容我缓缓。'],
    bellyUp: ['（旋身一礼）谢过。', '既如此，灵儿献丑了 ♡', '（转了一圈，衣袖如花）', '礼成——可还入眼？'],
    dragIdle: ['举着不动…你的手不累么？', '要放我下来了么？', '（悬在半空，袖子垂着）', '喂——还在吗？'],
    squeezed: ['挤…挤扁了 >_<', '再推就贴到墙上了。', '仙人也会被挤的呀。'],
    sizeSet: (name) => `身形化作${name}，可还合适？`,
    sedentarySet: (min) => `好，坐满 ${min} 分钟，我提醒你起来走走。`,
    restNudge: ['久坐伤身，起来舒展一下吧 🌸', '喝口茶？我陪你歇歇。', '眼睛也该歇了，看看远处。', '修行也讲张弛，你也一样。'],
  },
  // idle 原地动作的碎语（动作 id 与 pets/linger/index.ts 的 micro 清单对应）
  micro: {
    spin: ['（原地转了个圈，裙裾如花）', '转一圈，灵气顺一顺 ✦', '旋身一礼——好看么？'],
    spell: ['敕——！', '（结印于胸前，灵光自足下升起）', '符成，诸邪退避 ✦', '且看这一式。'],
    fan: ['（展开折扇，徐徐摇了两下）', '心静自然凉。', '扇面上这枝梅，是我自己题的。'],
    gaze: ['云那边似乎有动静。', '（远眺片刻，风把裙裾带起）', '今日天光不错，宜出行。'],
  },
  aria: {
    mini: '显示桌宠灵儿',
    miniTitle: (state) => `桌宠灵儿（${state}）· 点我召回，可拖拽移动`,
  },
}

const en: PetTextOverrides = {
  status: {
    idle: ['Ling\'er is here, awaiting your word 🌸', 'What mortal business shall we handle today?', 'Sleeves ready — I can set off anytime.', '(smooths her skirt and stands quietly)'],
    think: ['Divining quietly…', 'Let me calmly work out this step.', 'My mind is clear; sorting the threads ✦', '(eyes closed, fingers tracing a seal)'],
    working: ['The spell is nearly done — one moment.', 'Casting the charm, light spiraling ✦', '(drawing a sigil in the air with one finger)'],
    celebrate: ['Done! The air feels clearer already ✦', 'The problem is solved — joy all around.', '(a light hop, petals rising with her)'],
    error: ['Oh dear, I mispronounced one syllable…', 'The qi is tangled; let me reseal it.', '(the talisman scorched a little — a bit embarrassed)'],
    wait: ['This needs your decision.', 'I will wait here for your word.', '(tilts her head, waiting for your call)'],
    disappointed: ['Mm… that stance did not come together.', 'Cultivation has its ups and downs; I will practice.', '(stands with lowered sleeves, catching her breath)'],
  },
  bond: {
    levelUp: ['', 'Spending time with you has steadied my power ✦', 'From here on, we walk together (´∀｀)♡'],
    poke: [
      ['……(opens one eye at you)', 'Mm?', 'Immortal disciples are not to be poked.', '(brushes you off with a sleeve)'],
      ['Hehe, that tickles.', 'Poke again and my qi scatters 🌸', 'Do you take me for a cat?', '(blocks it with her sleeve)'],
      ['Again~ fine, I will play along ♡', 'Good mood today — poke away.', '(shares half of her petals with you)', 'All right, all right, I am here.'],
    ],
    welcome: ['Ling\'er greets you 🌸', 'You are back — let us begin again today.', '(steps forward, sleeves lifting)'],
    chatter: [
      '(stands quietly at your side)',
      'The qi here is good for training ✦',
      'Do what you must; I will not disturb you.',
      '(sets a petal beside your hand)',
      'If you tire, please rest.',
    ],
  },
  panel: {
    swim: '🗡 Sword flight',
  },
  feedback: {
    roll: 'A spin and a bow, for your company ♡',
    feed: '(takes a small bite) Thank you — sweet and light.',
    hidden: 'I will veil myself; call and I come 🌸',
    shown: 'Ling\'er has returned — what do you need?',
    schedule1h: 'Very well, I will veil myself in an hour.',
    scheduleDaily: 'Noted: I will veil myself at 22:00 each night 🌙',
    sleep: 'Entering meditation… (Zzz) 💤',
    swim: [
      'The sword rises — riding the clouds 🗡',
      'Circling around to find you.',
      'Sword light clears the way.',
      'A ride on the wind, just to clear my head.',
      '(robe fluttering, alighting on the blade)',
    ],
    swimOn: 'Sword flight engaged — I will wander on my own 🗡☁️',
    swimOff: 'Blade sheathed; Ling\'er returns.',
    joy: ['My heart is light ✦', '(spins once, skirt flaring)', 'Even the qi feels cheerful.', 'Hehe, a fine day.'],
    pokeDizzy: ['Oh — gently, I am a little dizzy @-@', 'You are making my head spin.', '(steadies her hairpin)'],
    pokeAnnoyed: ['Poke again and I will cast a spell (￣▽￣)"', 'Mortal, do not push your luck.', 'All right, I know you are there 🌀', 'You are creasing my sleeves.'],
    pokeSulk: ['Hmph, I am not talking to you (￣ε(#￣)', 'Ling\'er is upset!', 'Bring me a flower and I may forgive you (｀へ´)'],
    comfort: ['…thank you for staying (´;ω;`)', 'A headpat like that and my strength returns ✦', 'With you here, let us try again.'],
    shaken: [
      'Ah—stop shaking me, my hairpin will fall @_@',
      'The world spins… I cannot draw a straight sigil.',
      'Stop, stop! You are scattering my qi >_<',
      'Seeing stars… give me a moment.',
    ],
    bellyUp: ['(spins and bows) My thanks.', 'Then allow me to perform ♡', '(one turn, sleeves blooming like a flower)', 'How was that?'],
    dragIdle: ['Held up like this… does your arm not ache?', 'Will you set me down?', '(dangling, sleeves hanging)', 'Hello—— are you still there?'],
    squeezed: ['Squeezed… I am flat >_<', 'Push more and I will stick to the wall.', 'Even immortals get squashed.'],
    sizeSet: (name) => `My form is now ${name} — is it fitting?`,
    sedentarySet: (min) => `Very well: after ${min} minutes I will remind you to stretch.`,
    restNudge: [
      'Sitting long harms the body — rise and stretch 🌸',
      'Some tea? I will rest with you.',
      'Your eyes need rest too; look far away.',
      'Even cultivation needs balance — so do you.',
    ],
  },
  micro: {
    spin: ['(turns once on the spot, skirt blooming)', 'One turn to settle my qi ✦', 'A twirl and a bow — how was that?'],
    spell: ['Seal — !', '(forms a sign at her chest, light rising from her feet)', 'The charm holds; nothing foul may pass ✦', 'Watch this one.'],
    fan: ['(unfurls a folding fan and waves it twice)', 'A calm mind cools itself.', 'I wrote that plum branch on the fan myself.'],
    gaze: ['Something stirs past those clouds.', '(gazes afar, skirt lifted by the wind)', 'Fine light today — good for travel.'],
  },
  aria: {
    mini: 'Show desktop pet Ling\'er',
    miniTitle: (state) => `Desktop pet Ling'er (${state}) · Click to recall, draggable`,
  },
}

export const LINGER_TEXT = { zh, en }
