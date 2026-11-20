/**
 * 大肥鱼（三只形态共用）的台词覆盖。
 *
 * 基准文案是鲸鱼口吻（"正在深潜检索知识库""哗啦——肚皮朝天"），从一只蹲在桌面上的
 * 蓝毛小女仆鲸鱼娘嘴里说出来会错位。这里覆盖**用户真会看到的**几组：
 *   status（待机/思考/工作/庆祝）、feedback（打滚/投喂/被摸/被甩/悬空/躺平/休息提醒…）、
 *   bond（熟悉度三档的戳戳/问候/闲聊）、aria
 * 其余条目（菜单文字、设置面板、通知开关等）保持基准，不必重复。
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
      '（甩了甩尾巴，桌上没溅出水）',
    ],
    think: ['嗯…让我想想这道题的解法 🤔', '（托腮）这个词是什么意思啊…', '脑子转起来了，尾巴也跟着晃 🐟'],
    working: ['我帮你盯着进度！⚡', '正在跑工具——别急，我数着呢', '（掏出画板开始记笔记）'],
    celebrate: ['搞定啦！奖励我一口白饭吧 🍚', '测试全绿，尾鳍都翘起来了 ✨', '（开心地转了个圈）'],
  },
  feedback: {
    roll: '咕噜——滚了一圈，尾巴差点打结 (´∀｀)',
    feed: '白米饭！这个我能吃三碗 🍚✨',
    patted: ['唔…被摸头了，尾巴自己摇起来了', '再摸一会儿也可以啦 ♡', '（把头顶往你手上送）'],
    patTooFast: ['太快啦，头发都乱掉了 (｀へ´)', '轻一点嘛，我又不会跑'],
    squish: '呜哇——被捏扁了！',
    joy: ['最喜欢你了！给你表演个甩尾巴 🐟', '（原地转圈）开心！✨', '这么高兴的话…分你半碗白饭吧 🍚', '尾鳍拍拍桌面，心情很好 ✨'],
    pokeDizzy: ['别戳啦…有点晕 @-@', '（晃了晃脑袋）还没晕完呢', '再戳我要倒进你的杯子里了 🥺'],
    pokeAnnoyed: ['喂，戳上瘾啦？(￣▽￣)"', '再戳我就把尾巴甩你脸上 ~', '好啦好啦，知道你在了'],
    pokeSulk: ['哼，不理你了 (￣ε(#￣)', '（背过身去，尾巴却还朝着你）', '生气中，需要一口白饭才能原谅'],
    comfort: ['呜…谢谢你还在 (´;ω;`)', '被摸了摸头，好像又有力气了', '有你在的话，再跑一次测试也行！'],
    shaken: ['呜哇——太晃了！尾巴都甩直了 @_@', '晕…桌上的白米饭都要洒了 🍚', '停停停！我要沉到桌面底下去了 >_<'],
    bellyUp: ['翻肚皮给你看，就这一次哦 ♡', '咕噜噜——肚皮朝天，最省力的躺法 (´∀｀)', '（尾巴慢慢左右摆）这样躺着真舒服'],
    dragIdle: ['举着不动…手不酸吗 (・_・)', '要放下我了吗？还是继续拎着 ~', '悬在半空有点没安全感呀 🥺'],
    squeezed: ['挤扁了挤扁了！我本来就圆啊 >_<'],
    squashedTop: ['上面的头冠都要压平了啦 >_<', '别压啦，头饰要歪了'],
    squashedBottom: ['裙子要贴到桌面上了啦 >_<', '再压我就成饼了'],
    avoid: '让一让，我到旁边去，别戳到你 🐟',
    wake: '唔…醒了醒了，白饭还在吗 🍚',
    sleep: '先眯一会儿…有事就戳我先生 💤',
    swim: ['走两步，活动一下尾巴 🐟', '换个位置待着，别挡你操作 ✨', '巡视桌面（虽然只有一块）👑'],
    swimOn: '好，我自己在桌面上走走，不会走远 🐟',
    desktopOn: '好呀，我搬到桌面上住，右键托盘能退出~ 🖥️',
    desktopOff: '桌面上的我先收起来，想我了再点一次~',
    desktopPreparing: '等等我，正在准备桌面运行时（首次要下载）…',
    swimOff: '好，我就待在这儿不动 🐟',
    restNudge: ['坐了好久啦，站起来伸个懒腰吧 🐟', '喝口水？我陪你歇一会儿 ☕', '眼睛也要休息，看看远处 ✨', '连鱼都要换气，你也歇会儿吧 💤'],
  },
  bond: {
    levelUp: ['', '好像…跟你熟起来了呢 🐟✨', '现在已经离不开你的白米饭啦 (´∀｀)♡'],
    poke: [
      ['……（慢慢眨了下眼）', '唔？', '（尾巴轻轻抽了一下）'],
      ['别戳啦，痒~', '嗯…再戳就要甩尾巴了', '（把脸埋进围裙里）'],
      ['又来？真拿你没办法 (´∀｀)', '好吧好吧，陪你玩一会儿', '（主动把头顶凑过去）'],
    ],
    welcome: ['你好，我是大肥鱼 🐟', '回来啦，今天也一起加油吧！🐟✨', '你来啦，我一直在桌面上等着 🐟'],
    chatter: ['（尾巴敲了敲桌面）', '写累的话，喝口水吧', '白饭…还有剩吗 🍚', '（悄悄看了一眼你的屏幕）'],
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
  feedback: {
    roll: 'Flop — rolled over, nearly knotted my tail (´∀｀)',
    feed: 'Rice! I could eat three bowls 🍚✨',
    patted: ['Mm... headpats make my tail wag on its own', 'A little more is fine too ♡', '(leans her head into your hand)'],
    patTooFast: ['Too fast — my hair is a mess (｀へ´)', 'Gently, I am not going anywhere'],
    squish: 'Whoa — squished flat!',
    joy: ['You are my favorite! Watch my tail 🐟', '(spins in place) So happy! ✨', 'I am this happy... here is half a bowl of rice 🍚', 'Tail taps the desktop, great mood ✨'],
    pokeDizzy: ['Stop poking... a bit dizzy @-@', '(shakes her head) still spinning', 'Poke again and I will fall into your cup 🥺'],
    pokeAnnoyed: ['Hey, addicted to poking? (￣▽￣)"', 'Poke again and my tail goes in your face ~', 'Okay okay, I know you are there'],
    pokeSulk: ['Hmph, not talking to you (￣ε(#￣)', '(turns away, tail still pointing at you)', 'Upset — only a bowl of rice will fix this'],
    comfort: ['Aww... thank you for staying (´;ω;`)', 'A headpat and I feel strong again', 'With you here, I can run the tests again!'],
    shaken: ['Whoa — too much shaking! My tail is straight @_@', 'Dizzy... the rice is about to spill 🍚', 'Stop! I am sinking under the desk >_<'],
    bellyUp: ['Belly up, just this once ♡', 'Flop — belly to the sky, the laziest pose (´∀｀)', '(tail waving slowly) this is comfortable'],
    dragIdle: ['Held up and not moving... is your arm okay? (・_・)', 'Putting me down, or holding on? ~', 'Dangling in mid-air is a bit scary 🥺'],
    squeezed: ['Squeezed! I am round already >_<'],
    squashedTop: ['My headdress is being flattened >_<', 'Careful, the headpiece will tilt'],
    squashedBottom: ['My skirt is pressed to the desk >_<', 'Press more and I become a pancake'],
    avoid: 'Moving aside so I do not bump your cursor 🐟',
    wake: 'Mm... awake. Is the rice still there? 🍚',
    sleep: 'Napping for a bit... poke me if needed 💤',
    swim: ['Walking a bit to stretch my tail 🐟', 'Changing spots so I do not block you ✨', 'Patrolling the desktop (all one tile of it) 👑'],
    swimOn: 'Okay, I will walk around the desktop, not far 🐟',
    desktopOn: 'Moving onto your desktop — right-click the tray icon to quit~ 🖥️',
    desktopOff: 'Desktop version tucked away; ping me to bring it back~',
    desktopPreparing: 'One moment, preparing the desktop runtime (first run downloads it)…',
    swimOff: 'Okay, staying right here 🐟',
    restNudge: ['Sat too long — stand up and stretch 🐟', 'Some water? I will rest with you ☕', 'Eyes need breaks too — look far away ✨', 'Even fish surface for air; take a break 💤'],
  },
  bond: {
    levelUp: ['', 'Feels like... we are getting close 🐟✨', 'I cannot do without your rice now (´∀｀)♡'],
    poke: [
      ['...(slowly blinks)', 'Mm?', '(tail flicks once)'],
      ['Stop poking, ticklish~', 'Mm... one more and I flick my tail', '(hides face behind her apron)'],
      ['Again? What am I to do with you (´∀｀)', 'Fine, I will play along for a while', '(offers her head)'],
    ],
    welcome: ['Hello, I am Dafeiyu 🐟', 'Welcome back — let us do our best today! 🐟✨', 'You are here; I have been waiting on the desktop 🐟'],
    chatter: ['(tail taps the desktop)', 'If you are tired, drink some water', 'Is there any rice left 🍚', '(peeks at your screen)'],
  },
  aria: {
    mini: 'Show desktop pet Dafeiyu',
    miniTitle: (state) => `Dafeiyu (${state}) · click to recall, draggable`,
  },
}

export const DAFEIYU_TEXT = { zh, en }
