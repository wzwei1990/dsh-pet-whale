// pet-whale 文案字典：zh / en。
// 接入 DSH 官方 locale 服务；preview 独立页用浏览器语言 + localStorage 覆盖。

import type { WhaleState } from './state'

export type PetLocale = 'zh' | 'en'

export interface PetStrings {
  status: Record<WhaleState, string[]>
  /**
   * 熟悉度：三档下标 0/1/2 = 初识 / 熟络 / 形影不离。
   * 分档只换语气，不换语义——同一件事，生的时候说得短，熟了说得黏。
   */
  bond: {
    tierName: [string, string, string]
    /** 升档时说的话，下标 0 用不到（没人从更低的地方升上来） */
    levelUp: [string, string, string]
    /** 分档的戳戳反馈，取代顶层 poke */
    poke: [string[], string[], string[]]
    /** 分档的回来问候 */
    welcome: [string, string, string]
    /** 只有形影不离档才会主动冒的搭话 */
    chatter: string[]
  }
  menu: {
    feed: string
    headpat: string
    soundOn: string
    soundOff: string
    hide: string
    more: string
    copyError: string
  }
  panel: {
    title: string
    appearance: string
    /** 外观面板里的「宠物」分组标题 */
    pet: string
    /** 外观面板里的「配色」分组标题 */
    colors: string
    behavior: string
    stats: string
    statsCompleted: (n: number) => string
    statsInteractions: (n: number) => string
    statsErrors: (n: number) => string
    statsDays: (n: number) => string
    /** 关系档位 + 距下一档的进度，满档时 pct 传 -1 */
    statsBond: (name: string, pct: number) => string
    /** 大小档位入口，参数是当前档的名字 */
    size: (name: string) => string
    /** 四个档位的名字 */
    sizeNames: [string, string, string, string]
    rest: string
    pretend: string
    thinkTicker: string
    swim: string
    /** 音量入口，参数是当前档的名字 */
    volume: (name: string) => string
    volumeOff: string
    /** 小 / 中 / 大，与 sounds.ts 的 VOLUME_LEVELS 同序 */
    volumeNames: [string, string, string]
    /** 跟随所有会话 */
    followAll: string
    /** 完成提醒（标签页标题） */
    notify: string
    /** 系统通知（需授权） */
    sysNotify: string
    /** 久坐提醒，参数是分钟数，0 表示关 */
    sedentary: (min: number) => string
    schedule: string
    in1h: string
    daily: string
    cancelSchedule: string
    hide: string
    close: string
    back: string
  }
  /** 宠物名字：id → 该语言下的名字；缺失时回落到 PetModule.name（与 palette 同样的回退策略） */
  pet: Record<string, string>
  palette: Record<string, string>
  /**
   * 原地动作的碎语池：动作 id → 台词。
   * 动作 id 由 `PetModule.micro` 声明，插件调度器按"洗牌袋"挑动作、按概率配一句话。
   * 缺这个 id（或空数组）＝做这个动作时闭嘴。基准（鲸鱼）是空表 —— 鲸鱼不做原地动作。
   */
  micro: Record<string, string[]>
  feedback: {
    squish: string
    roll: string
    feed: string
    /** 被摸头：鼠标蹭头顶 / 长按 / 菜单三个入口共用 */
    patted: string[]
    /** 蹭得太快：生气游开 */
    patTooFast: string[]
    paletteApplied: (name: string) => string
    petApplied: (name: string) => string
    pretendOn: string
    pretendOff: string
    tickerOn: string
    tickerOff: string
    hidden: string
    shown: string
    schedule1h: string
    scheduleDaily: string
    scheduleCancel: string
    errorCopied: string
    errorCopyFailed: string
    wake: string
    sleep: string
    avoid: string
    swim: string[]
    swimOn: string
    swimOff: string
    followAllOn: string
    followAllOff: string
    joy: string[]
    pokeDizzy: string[]
    /** 连戳中段：开始不耐烦 */
    pokeAnnoyed: string[]
    /** 连戳过头：闹脾气 */
    pokeSulk: string[]
    /** 失落时被戳：被安慰 */
    comfort: string[]
    /** 抓着左右猛甩：甩晕了 */
    shaken: string[]
    /** 双击：翻肚皮 */
    bellyUp: string[]
    /** 拖着不放又不动：不耐烦 */
    dragIdle: string[]
    /** 被按在屏幕边上：挤扁了 */
    squeezed: string[]
    /** 被按在顶边 / 底边：上下压扁了 */
    squashedTop: string[]
    squashedBottom: string[]
    sizeSet: (name: string) => string
    notifyOn: string
    notifyOff: string
    sysNotifyOn: string
    sysNotifyOff: string
    sysNotifyDenied: string
    sedentarySet: (min: number) => string
    sedentaryOff: string
    /** 久坐提醒时鲸鱼说的话 */
    restNudge: string[]
  }
  /** 跟随所有会话：别的会话的动静 */
  multi: {
    /** 角标的悬停提示，参数是别的会话里正在跑的个数 */
    badge: (n: number) => string
    doneOther: (title: string) => string
    waitingOther: (title: string) => string
    /** 同时在跑的会话（含当前）到 2 个，参数是个数 */
    parallel: (n: number) => string[]
    /** 到 OVERTIME_AT 个及以上 */
    overtime: (n: number) => string[]
    /** 这一批并发过的会话全部跑完 */
    allDone: string[]
  }
  /** 页面标题闪烁与系统通知用的文案 */
  notify: {
    titleDone: string
    bodyDone: string
  }
  aria: {
    /** 桌宠的 aria-label，参数是当前宠物的名字 */
    petName: (name: string) => string
    mini: string
    miniTitle: (state: string) => string
  }
}

const zh: PetStrings = {
  status: {
    idle: [
      '小鲸鱼待命中~ 点击我可以戳戳哦 🐳',
      '今天有什么新的代码任务呢？✨',
      '摇摇尾巴，随时准备出发！',
    ],
    think: ['正在深潜检索知识库... 🌊', '认真思考架构逻辑中...', '咕噜噜... 正在探索深海答案'],
    working: ['认真敲代码中！⚡', '噼里啪啦码字中，很快就好~ ⌨️', '正在调用 Agent 工具执行任务！'],
    celebrate: ['太棒啦！任务圆满搞定~ 🎉', '代码测试全绿，完美交付！✨', '冒泡庆祝中，请主人查收~'],
    error: ['哎呀出错了，正在发抖求救 🥺', '捕获到一个异常，正在尝试自愈...', '呜呜呜，遇到阻碍了 >_<'],
    wait: ['主人，这里需要你确认一下 🙋', '等你拍板呢，我先把进度停在这里~', '需要你看一眼再继续哦 ✋'],
    disappointed: ['呜呜... 刚刚没发挥好，有点小失落 🥺', '失败是成功之母，我再缓缓~', '下次一定会更好的...'],
  },
  bond: {
    tierName: ['初识', '熟络', '形影不离'],
    levelUp: [
      '',
      '好像... 跟你熟起来了呢 🐋✨',
      '已经离不开你啦，别丢下我哦 (´∀｀)♡',
    ],
    poke: [
      [
        '咕噜。',
        '……（歪着头看你）',
        '唔，痒。',
        '（往旁边挪了挪）',
      ],
      [
        '咕噜咕噜~ 戳到软软的肚皮啦！',
        '好痒呀~ 哈哈哈 (≧▽≦)',
        '鲸鱼活力 +10！继续加油~',
        '小尾巴拍拍水，心情超棒 ✨',
      ],
      [
        '又戳我~ 就知道你闲不住 (´∀｀)',
        '嘿嘿，今天也来找我玩啦 ♡',
        '再多戳一会儿嘛，我不介意的 🐳',
        '（主动把肚皮翻过来给你）',
      ],
    ],
    welcome: [
      '你好，我是这儿的鲸鱼 🐋',
      '欢迎回来，今天也一起加油吧！🐳✨',
      '你来啦！我一直在等你 🐳✨',
    ],
    chatter: [
      '欸嘿，我在这儿哦 🐳',
      '（悄悄看了你一眼）',
      '今天也一起呢，真好 ✨',
      '（用尾巴轻轻戳了戳你）',
      '不打扰你，就是想冒个泡 🫧',
    ],
  },
  menu: {
    feed: '🐟 投喂小鱼干',
    headpat: '✨ 摸摸头',
    soundOn: '🔊 音效: 开',
    soundOff: '🔇 音效: 关',
    hide: '🙈 隐藏到右下角',
    more: '⚙ 更多设置…',
    copyError: '📋 复制错误信息',
  },
  panel: {
    title: '更多设置',
    appearance: '外观',
    pet: '🐾 宠物',
    colors: '🎨 配色',
    behavior: '行为',
    stats: '陪伴记录',
    statsCompleted: (n) => `🏆 已完成回合：${n}`,
    statsInteractions: (n) => `💬 亲密互动：${n} 次`,
    statsErrors: (n) => `🛠 遇到异常：${n} 次`,
    statsDays: (n) => `📅 共同陪伴：${n} 天`,
    statsBond: (name, pct) => (pct < 0 ? `💞 关系：${name}（满）` : `💞 关系：${name}（下一档 ${pct}%）`),
    size: (name) => `📐 大小：${name}`,
    sizeNames: ['小', '标准', '大', '特大'],
    rest: '休息',
    pretend: '💼 假装工作',
    thinkTicker: '🧠 思考链',
    swim: '🏊 游泳',
    volume: (name) => `🔊 音量：${name}`,
    volumeOff: '静音',
    volumeNames: ['小', '中', '大'],
    followAll: '🫧 跟随所有会话',
    notify: '🔔 完成提醒',
    sysNotify: '📢 系统通知',
    sedentary: (min) => (min === 0 ? '⏰ 久坐提醒：关' : `⏰ 久坐提醒：${min} 分钟`),
    schedule: '🕐 定时隐藏',
    in1h: '1 小时后隐藏',
    daily: '每晚 22:00 隐藏',
    cancelSchedule: '取消定时隐藏',
    hide: '🙈 隐藏到右下角',
    close: '⏹ 关闭桌宠',
    back: '← 返回',
  },
  pet: {
    whale: '小鲸鱼',
    cat: '小猫',
    linger: '灵儿',
  },
  palette: {
    terracotta: '陶土',
    ocean: '深海蓝',
    matcha: '抹茶绿',
    sakura: '樱粉',
    ink: '墨灰',
    night: '夜黑',
    'theme-blue': '主题蓝',
    qinglian: '青莲',
  },
  // 鲸鱼不做原地动作（它有游泳/看四周/吐泡泡那一套），所以基准是空表
  micro: {},
  feedback: {
    squish: '戳一戳，心情 +1 ✨',
    roll: '翻个 360° 跟头给你看！(≧∇≦)ﾉ ✨',
    feed: '嚼嚼嚼... 获得小鱼干能量！美味~ 🐟',
    patted: [
      '被摸摸头啦~ 暖洋洋的超开心 🥰',
      '呼噜呼噜... 再摸一下嘛 (´▽`)',
      '头顶暖暖的，眼睛都睁不开了~ 💤',
      '嘿嘿，被摸得好舒服 💖',
    ],
    patTooFast: [
      '再摸就秃头了！😤',
      '头顶都要搓冒烟了，不给摸了！🔥',
      '哼，手这么重，我游远点 😤',
    ],
    paletteApplied: (name) => `换上新皮肤「${name}」~ 🎨`,
    petApplied: (name) => `换成${name}啦~ 🐾`,
    pretendOn: '进入假装工作模式，开始表演敲代码 ⌨️💼',
    pretendOff: '下班！恢复真实状态~',
    tickerOn: '思考链已开启：思考时会在我头顶滚动 🧠',
    tickerOff: '思考链已关闭~',
    hidden: '我先藏到右下角啦，想我随时点 🐳',
    shown: '回来啦！想我了没~ 🐳',
    schedule1h: '好~ 1 小时后我会自己藏到右下角 🐳',
    scheduleDaily: '记下啦：每天 22:00 自动藏到右下角 🌙',
    scheduleCancel: '定时隐藏已取消~',
    errorCopied: '错误信息已复制到剪贴板，快去找主人帮忙 📋',
    errorCopyFailed: '复制失败，请检查浏览器的剪贴板权限',
    wake: '醒啦！随时准备开工~ ✨',
    sleep: '呼噜噜... 正在做深海美梦 (Zzz) 💤',
    avoid: '让一让~ 这里交给你啦 ✨',
    swim: [
      '游一游，活动一下~ 🐳',
      '换个角度看主人 ✨',
      '咕噜噜... 巡视领地中 🌊',
      '深潜探索一下海底世界~ 🫧',
      '摇摇尾巴，优雅地划水中 🐋',
    ],
    swimOn: '游泳模式已开启，我会自己到处游啦 🐳🌊',
    swimOff: '游泳模式已关闭，我乖乖待命~',
    followAllOn: '别的会话有动静我也会告诉你~',
    followAllOff: '好，我只盯着眼前这个会话~',
    joy: [
      '嘻嘻，最喜欢主人啦~ 🥰',
      '好开心！能量充满啦~ ✨',
      '冒个爱心泡泡送给你 💖',
      '摇摇尾巴，心情极佳 🐋',
    ],
    pokeDizzy: [
      '哎呀，轻轻戳嘛，有点小晕乎 @-@',
      '晕头转向了... 别戳太用力呀 🥺',
      '晃晃脑袋，差点被戳倒啦 ~',
    ],
    pokeAnnoyed: [
      '喂喂喂，戳上瘾啦？(￣▽￣)"',
      '再戳我就要游走咯 ~',
      '好啦好啦，知道你在了 🐳',
      '肚皮都要被戳凹了啦 >_<',
    ],
    pokeSulk: [
      '哼，不理你了 (￣ε(#￣)',
      '鲸鱼罢工中，请稍后再试 💤',
      '生气了！要哄哄才理你 (｀へ´)',
    ],
    comfort: [
      '呜... 谢谢你还在 (´;ω;`)',
      '被摸了摸头，好像又有力气了 ✨',
      '有你在就没关系啦，再来一次！🐋',
    ],
    shaken: [
      '呜哇——太晕了！别甩啦 @_@',
      '天旋地转... 我要吐泡泡了 🫧',
      '停停停！海水都被你搅浑啦 >_<',
      '眼冒金星... 让我缓缓 (@_@;)',
    ],
    bellyUp: [
      '翻个肚皮给你看~ 只对你哦 ♡',
      '哗啦——肚皮朝天，最舒服的姿势 (´∀｀)',
      '晒肚皮时间！别戳痒痒肉 🐳',
      '完全放松状态，可以随便摸 ✨',
    ],
    dragIdle: [
      '举着不动... 手不酸吗 (・_・)',
      '要放我下来了吗，还是继续举着 ~',
      '悬在半空有点没安全感呀 🥺',
      '喂——还在吗？我还挂着呢 🐋',
    ],
    squeezed: [
      '挤挤挤... 贴在墙上啦 >_<',
      '这边到头咯，再推就扁了 🫠',
      '呜，脸被压平了 (＞﹏＜)',
    ],
    squashedTop: [
      '咚！撞到天花板了 >_<',
      '头顶被压扁啦，再按就成饼了 🫠',
    ],
    squashedBottom: [
      '被按在海底了... 扁扁的 (＞﹏＜)',
      '压、压成鲸鱼饼了 🫓',
    ],
    sizeSet: (name) => `变成${name}号啦~ 合适吗 🐳`,
    notifyOn: '好耶！你不在的时候我会在标签页上喊你 🔔',
    notifyOff: '不喊你了，安安静静的 🤫',
    sysNotifyOn: '系统通知已开启，跑到别的窗口也能收到 📢',
    sysNotifyOff: '系统通知已关闭 🔕',
    sysNotifyDenied: '浏览器不让我发通知，去地址栏左边的锁里放行一下 🥺',
    sedentarySet: (min) => `好，坐满 ${min} 分钟我就浮上来提醒你 ⏰`,
    sedentaryOff: '久坐提醒关掉啦，你随意 ~',
    restNudge: [
      '坐好久啦，起来动动肩膀吧 🐳',
      '喝口水？我陪你歇一会儿 ☕',
      '眼睛也要休息的，看看远处吧 ✨',
      '深海也需要浮上来换气呀，你也是 🫧',
    ],
  },
  multi: {
    badge: (n) => `另外 ${n} 个会话正在跑`,
    doneOther: (title) => (title === '' ? '另一个会话跑完啦 ✅' : `「${title}」那边跑完啦 ✅`),
    waitingOther: (title) => (title === '' ? '另一个会话在等你确认 👀' : `「${title}」在等你确认 👀`),
    parallel: (n) => [`${n} 个会话一起跑，全速并发推进中！🌊`, `左鳍一个右鳍一个，${n} 路并发开工~ 💨`],
    overtime: (n) => [`${n} 个会话同时开工……这就是加班吗 😵`, `${n} 路并发？！以后再也不想加班了 😭`],
    allDone: ['好累啊……终于全部搞定了 🫠', '呼——全部收工！让我瘫一会儿 💦'],
  },
  notify: {
    titleDone: '完成了',
    bodyDone: '这一轮跑完啦，回来看看吧',
  },
  aria: {
    petName: (name) => `桌宠${name}`,
    mini: '显示桌宠小鲸鱼',
    miniTitle: (state) => `桌宠小鲸鱼（${state}）· 点我召回，可拖拽移动`,
  },
}

const en: PetStrings = {
  status: {
    idle: [
      'Whale on standby~ Click me for a poke! 🐳',
      'Any new code tasks today? ✨',
      'Wagging my tail, ready to go!',
    ],
    think: ['Diving deep into the knowledge base... 🌊', 'Thinking through the architecture...', 'Blub blub... exploring the deep sea of answers'],
    working: ['Typing code seriously! ⚡', 'Clack clack, almost done~ ⌨️', 'Calling agent tools to get things done!'],
    celebrate: ['Yay! Task completed~ 🎉', 'All tests green, perfect delivery! ✨', 'Bubbling with joy, check it out~'],
    error: ['Oops, something went wrong 🥺', 'Caught an exception, trying to self-heal...', 'Wahh, I hit a snag >_<'],
    wait: ['Hey, I need your confirmation here 🙋', 'Waiting for your call—I will hold right here~', 'Please take a look before I continue ✋'],
    disappointed: ['Aww... that did not go well, feeling a bit down 🥺', 'Failure is the mother of success, give me a moment~', 'I will do better next time...'],
  },
  bond: {
    tierName: ['Acquainted', 'Close', 'Inseparable'],
    levelUp: [
      '',
      'I think... we are getting close 🐋✨',
      'I cannot do without you now. Do not leave me (´∀｀)♡',
    ],
    poke: [
      [
        'Bloop.',
        '...(tilts head at you)',
        'Mm. That tickles.',
        '(shuffles aside a little)',
      ],
      [
        'Glub glub~ You poked my soft belly!',
        'That tickles~ haha (≧▽≦)',
        'Whale energy +10! Keep it up~',
        'Splashing my tail, feeling great ✨',
      ],
      [
        'Poking me again~ I knew you could not sit still (´∀｀)',
        'Hehe, you came to play with me today too ♡',
        'Keep going, I really do not mind 🐳',
        '(rolls over to offer you the belly)',
      ],
    ],
    welcome: [
      'Hello. I am the whale who lives here 🐋',
      'Welcome back! Let us do our best today! 🐳✨',
      'You are here! I have been waiting 🐳✨',
    ],
    chatter: [
      'Heh, I am right here 🐳',
      '(sneaks a glance at you)',
      'Together again today. Nice ✨',
      '(pokes you gently with the tail)',
      'Not interrupting, just saying hi 🫧',
    ],
  },
  menu: {
    feed: '🐟 Feed fish snack',
    headpat: '✨ Headpat',
    soundOn: '🔊 Sound: On',
    soundOff: '🔇 Sound: Off',
    hide: '🙈 Hide to corner',
    more: '⚙ More settings…',
    copyError: '📋 Copy error',
  },
  panel: {
    title: 'More Settings',
    appearance: 'Appearance',
    pet: '🐾 Pet',
    colors: '🎨 Colors',
    behavior: 'Behavior',
    stats: 'Companion Stats',
    statsCompleted: (n) => `🏆 Completed Turns: ${n}`,
    statsInteractions: (n) => `💬 Interactions: ${n}`,
    statsErrors: (n) => `🛠 Errors Encountered: ${n}`,
    statsDays: (n) => `📅 Days Together: ${n} d`,
    statsBond: (name, pct) => (pct < 0 ? `💞 Bond: ${name} (max)` : `💞 Bond: ${name} (next ${pct}%)`),
    size: (name) => `📐 Size: ${name}`,
    sizeNames: ['Small', 'Standard', 'Large', 'Huge'],
    rest: 'Rest',
    pretend: '💼 Pretend to work',
    thinkTicker: '🧠 Think ticker',
    swim: '🏊 Swimming',
    volume: (name) => `🔊 Volume: ${name}`,
    volumeOff: 'Muted',
    volumeNames: ['Low', 'Medium', 'High'],
    followAll: '🫧 Follow all sessions',
    notify: '🔔 Finish alert',
    sysNotify: '📢 System notification',
    sedentary: (min) => (min === 0 ? '⏰ Break reminder: off' : `⏰ Break reminder: ${min} min`),
    schedule: '🕐 Auto-hide',
    in1h: 'Hide in 1 hour',
    daily: 'Hide every day at 22:00',
    cancelSchedule: 'Cancel auto-hide',
    hide: '🙈 Hide to corner',
    close: '⏹ Close pet',
    back: '← Back',
  },
  pet: {
    whale: 'Whale',
    cat: 'Cat',
    linger: "Ling'er",
  },
  palette: {
    terracotta: 'Terracotta',
    ocean: 'Ocean Blue',
    matcha: 'Matcha Green',
    sakura: 'Sakura Pink',
    ink: 'Ink Gray',
    night: 'Night Black',
    'theme-blue': 'Theme Blue',
    qinglian: 'Lotus Green',
  },
  micro: {},
  feedback: {
    squish: 'Poke! Mood +1 ✨',
    roll: 'A 360° flip just for you! (≧∇≦)ﾉ ✨',
    feed: 'Munch munch... fish snack energy! Yummy~ 🐟',
    patted: [
      'Headpat received~ warm and happy 🥰',
      'Mmm... one more pat, please (´▽`)',
      'So cozy up here, my eyes are closing~ 💤',
      'Hehe, that feels so nice 💖',
    ],
    patTooFast: [
      'Any more and I go bald! 😤',
      'My head is about to smoke. No more pats! 🔥',
      'Hmph, too rough. I am swimming away 😤',
    ],
    paletteApplied: (name) => `New skin applied: ${name}~ 🎨`,
    petApplied: (name) => `Now playing as ${name}~ 🐾`,
    pretendOn: 'Entering pretend-work mode, time to type ⌨️💼',
    pretendOff: 'Off duty! Back to real state~',
    tickerOn: 'Think ticker enabled: thoughts will scroll above me 🧠',
    tickerOff: 'Think ticker disabled~',
    hidden: 'I will hide in the corner. Call me anytime 🐳',
    shown: 'Back again! Missed me~ 🐳',
    schedule1h: 'Okay~ I will hide in the corner in 1 hour 🐳',
    scheduleDaily: 'Got it: I will auto-hide at 22:00 every day 🌙',
    scheduleCancel: 'Auto-hide cancelled~',
    errorCopied: 'Error copied to clipboard, go ask for help 📋',
    errorCopyFailed: 'Copy failed. Please check clipboard permission in your browser.',
    wake: 'Awake! Ready to work~ ✨',
    sleep: 'Zzz... dreaming in the deep sea (Zzz) 💤',
    avoid: 'Let me make room for you~ ✨',
    swim: [
      'Swimming around a bit~ 🐳',
      'Looking at you from another angle ✨',
      'Blub blub... patrolling my territory 🌊',
      'Diving deep to explore the seabed~ 🫧',
      'Wagging my tail, gliding smoothly 🐋',
    ],
    swimOn: 'Swimming mode on: I will roam around by myself 🐳🌊',
    swimOff: 'Swimming mode off: I will stay put~',
    followAllOn: 'I will keep an eye on your other sessions too~',
    followAllOff: 'Got it, just this session~',
    joy: [
      'Hehe, love you the most! 🥰',
      'So happy! Energy fully restored~ ✨',
      'A heart bubble just for you 💖',
      'Wagging my tail with joy 🐋',
    ],
    pokeDizzy: [
      'Woah, gentle please! Feeling a bit dizzy @-@',
      'Spinning around... don\'t poke too hard 🥺',
      'Shaking my head, almost fell over~',
    ],
    pokeAnnoyed: [
      'Hey, hooked on poking me? (￣▽￣)"',
      'Poke again and I am swimming away~',
      'Alright alright, I know you are there 🐳',
      'My belly is getting dented >_<',
    ],
    pokeSulk: [
      'Hmph. Not talking to you (￣ε(#￣)',
      'Whale on strike. Try again later 💤',
      'Now I am upset! Cheer me up first (｀へ´)',
    ],
    comfort: [
      'Sniff... thanks for staying (´;ω;`)',
      'That head pat helped. I feel better ✨',
      'With you here it is fine. Let us try again! 🐋',
    ],
    shaken: [
      'Whoaa - too dizzy! Stop shaking me @_@',
      'The room is spinning... I might blow bubbles 🫧',
      'Stop stop stop! You stirred up the whole sea >_<',
      'Seeing stars... give me a second (@_@;)',
    ],
    bellyUp: [
      'Belly up, just for you ♡',
      'Whoosh - belly to the sky, the comfiest pose (´∀｀)',
      'Belly sunbathing time! Mind the ticklish spot 🐳',
      'Fully relaxed. Pet away ✨',
    ],
    dragIdle: [
      'Still holding me up... arm not tired? (・_・)',
      'Are you putting me down, or is this the new normal~',
      'Dangling in midair feels a bit unsafe 🥺',
      'Helloo - still there? I am still hanging here 🐋',
    ],
    squeezed: [
      'Squish... pressed against the wall >_<',
      'That is the edge. Push more and I go flat 🫠',
      'Ow, my face is flattened (＞﹏＜)',
    ],
    squashedTop: [
      'Bonk! Hit the ceiling >_<',
      'My head got flattened. Any more and I am a pancake 🫠',
    ],
    squashedBottom: [
      'Pinned to the seabed... so flat (＞﹏＜)',
      'Squashed into a whale pancake 🫓',
    ],
    sizeSet: (name) => `Now I am ${name} size~ Does it fit? 🐳`,
    notifyOn: 'Got it! I will shout from the tab title while you are away 🔔',
    notifyOff: 'Staying quiet now 🤫',
    sysNotifyOn: 'System notifications on — you will hear me from any window 📢',
    sysNotifyOff: 'System notifications off 🔕',
    sysNotifyDenied: 'The browser blocked notifications. Allow them from the lock icon 🥺',
    sedentarySet: (min) => `Alright, I will surface after ${min} minutes of sitting ⏰`,
    sedentaryOff: 'Break reminder off. Do your thing~',
    restNudge: [
      'You have been sitting a while. Roll those shoulders 🐳',
      'Water break? I will rest with you ☕',
      'Eyes need rest too — look at something far away ✨',
      'Even the deep sea surfaces to breathe. So should you 🫧',
    ],
  },
  multi: {
    badge: (n) => `${n} other session${n === 1 ? '' : 's'} running`,
    doneOther: (title) => (title === '' ? 'Another session just finished ✅' : `"${title}" just finished ✅`),
    waitingOther: (title) => (title === '' ? 'Another session needs your confirmation 👀' : `"${title}" needs your confirmation 👀`),
    parallel: (n) => [`${n} sessions at once — full-speed parallel push! 🌊`, `One per fin: ${n} running in parallel~ 💨`],
    overtime: (n) => [`${n} sessions at once... is this what overtime feels like 😵`, `${n} in parallel?! No more overtime, ever 😭`],
    allDone: ['So tired... finally got every last one done 🫠', 'Phew — all wrapped up! Let me flop for a bit 💦'],
  },
  notify: {
    titleDone: 'Done',
    bodyDone: 'This round finished. Come take a look',
  },
  aria: {
    petName: (name) => `Desktop pet ${name}`,
    mini: 'Show desktop pet whale',
    miniTitle: (state) => `Desktop whale (${state}) · Click to recall, draggable`,
  },
}

export const PET_LOCALES: readonly PetLocale[] = ['zh', 'en']

/**
 * 宠物文案覆盖的深偏类型：对象逐层可选，**函数与数组整体替换**。
 * 台词池（string[]）必须整组换掉而不是逐条合并，否则猫会混进鲸鱼的句子。
 */
export type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T

/** 一只宠物可以只覆盖它想改的文案（见 pets/cat/text.ts） */
export type PetTextOverrides = DeepPartial<PetStrings>

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** 把宠物覆盖合并到基准文案上：对象递归，其余（数组/函数/字符串）整体替换。 */
function mergeStrings<T>(base: T, overrides: DeepPartial<T> | undefined): T {
  if (!overrides) return base
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    if (value === undefined) continue
    const current = (base as Record<string, unknown>)[key]
    out[key] = isPlainObject(current) && isPlainObject(value) ? mergeStrings(current, value as never) : value
  }
  return out as T
}

/** 根据浏览器语言返回支持的语言，未命中默认 zh。 */
export function detectBrowserLocale(): PetLocale {
  if (typeof navigator === 'undefined') return 'zh'
  for (const tag of [...(navigator.languages ?? []), navigator.language]) {
    const primary = String(tag ?? '').toLowerCase().split('-')[0]
    if (primary === 'en') return 'en'
    if (primary === 'zh') return 'zh'
  }
  return 'zh'
}

/**
 * 取当前语言的文案。
 * `overrides` 是当前宠物的文案覆盖（PetModule.text[locale]）：只写要改的条目，
 * 其余回落到 i18n.ts 里的通用文案（以鲸鱼口吻为基准）。
 */
export function getStrings(locale: PetLocale, overrides?: PetTextOverrides): PetStrings {
  const base: PetStrings = locale === 'en' ? en : zh
  return mergeStrings<PetStrings>(base, overrides)
}

export function paletteName(locale: PetLocale, id: string, fallback: string): string {
  return getStrings(locale).palette[id] ?? fallback
}

/** 宠物名字：i18n 里没写就回落到 PetModule 自带的名字，加新宠物不必立刻补文案。 */
export function petName(locale: PetLocale, id: string, fallback: string): string {
  return getStrings(locale).pet[id] ?? fallback
}
