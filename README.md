# pet-whale · 桌宠小鲸鱼 🐳

[English](README.en.md) | 中文

DeepSeek Harness（DSH）Web 界面的桌宠插件：右下角一只**官方轮廓版小鲸鱼**，随 agent 状态实时切换动画。纯 DOM 实现、零 React 依赖、零运行时第三方依赖，WebAudio 合成音效无音频文件。

<p align="center">
  <img src="docs/demo.gif" alt="桌宠小鲸鱼：连戳到闹脾气 → 甩晕 → 翻肚皮 → 贴边挤扁 → 思考 → 敲代码 → 完成庆祝" width="440">
</p>

<p align="center"><sub>空闲 → 思考·深潜 → 工作·敲代码 → 完成·冒泡 → 报错，对话气泡随状态变化</sub></p>

## 在线预览

无需安装，点开即玩（全部状态与交互，官方轮廓版）：

👉 **<https://nzl153.github.io/dsh-pet-whale/preview.html>**

仓库内的 [preview.html](preview.html) 即预览页源码，本地直接打开同样可以体验。

## 特性

| 能力 | 说明 |
|---|---|
| 状态机 | idle / think（深潜）/ working（游动 + 敲键盘 + 代码粒子）/ celebrate（跃起冒泡）/ error（发抖 + 尴尬黑线）/ disappointed（报错后短暂失落）/ wait（等待你的输入）；优先级 error > celebrate > think > working > idle |
| 回合语义 | 回合进行中永不发呆：有工具 = working，无工具（文字流或内部推理）= think 深潜；工具密集期键盘动画粘滞 2.5s |
| 交互 | 单击戳戳、双击 360° 翻滚、拖拽时眼睛变成动漫勾勾眼（>_<）、右键菜单（投喂 / 摸摸头 / 换颜色 / 假装工作 / 思考链 / 隐藏 / 定时 / 关闭 / 音效）、鼠标追光、20s 无操作打瞌睡、拖拽移动并记忆位置 |
| 假装工作 | 右键菜单「💼 假装工作」开关：开启后始终显示敲代码动画，偏好持久化 |
| 思考流 | 真实状态为 think 时，模型最近 200 字思考内容悬在桌宠正上方缓慢滚动（可右键开关），同时鲸鱼保持深潜思考动画 |
| 智能避让 | idle 时若光标在身侧停留 0.9s，鲸鱼会自己让开；抓取/拖拽/右键立即取消避让并冷却 8s，绝不抢交互 |
| 主题联动 | 跟随 DSH 亮/暗主题自动切换气泡、对话框和阴影的明暗样式 |
| 后台省电 | 页面切到后台自动暂停所有动画、音效和思考流，回来即恢复 |
| idle 小动作 | idle 久了会随机游动、左右张望、吐泡泡，不再只是打瞌睡 |
| 错误关怀 | error 状态下点击鲸鱼或右键「📋 复制错误信息」，直接把错误文本复制到剪贴板 |
| 换肤 | 7 套预设色板（默认**主题蓝**）：主题蓝 / 陶土 / 深海蓝 / 抹茶绿 / 樱粉 / 墨灰 / 夜黑；夜黑为深色皮肤示例（眼睛自动反白）。扩展只需在 `src/client/palettes.ts` 加一行 |
| 多宠物 | 右键 →「外观 → 🐾 宠物」在**小鲸鱼 / 小猫 / 灵儿**之间切换，选择持久化。每只宠物自带 SVG、独立动画样式表和**自己的台词**（猫不会说"深潜"），互不干扰；色板与大小对任何宠物通用，人物型可以用 `size` 声明竖版盒子（灵儿 104×140）。加一只新宠物 = 新建 `src/client/pets/<id>/` 一个目录 + 注册一行，详见 [docs/MULTI-PET.md](docs/MULTI-PET.md) |
| 隐藏/召回 | 右键菜单「🙈 隐藏到右下角」收起桌宠，右下角出现 🐳 小按钮，点击召回；隐藏状态跨刷新记忆，隐藏期间自动静音、不说话 |
| 小按钮状态 | 隐藏时小按钮随 agent 状态变色呼吸：idle 蓝 / think 深蓝 / working 橙 / celebrate 绿 / error 红 |
| 小按钮拖拽 | 小按钮可拖拽移动，位置用 localStorage 记忆 |
| 定时隐藏 | 右键菜单「🕐 定时隐藏 ▸」：1 小时后 / 每晚 22:00 自动隐藏，可取消 |
| 关闭 | 右键菜单「⏹ 关闭桌宠」完全退出，刷新页面后回来 |
| 自主游动 | 右键菜单「🏊 游泳」开关：鲸鱼沿三次贝塞尔曲线在页面里自主巡游，带俯仰角、水平自适应翻转、下潜、航迹水圈和破浪水花；忙碌时自动让位，偏好持久化 |
| 多语言 | 中文 / English 两套完整文案，接入 DSH 官方 locale 服务自动跟随；独立预览页按浏览器语言判定并可手动覆盖 |
| 二级菜单 | 右键「⋯ 更多设置」展开面板，分为外观 / 行为 / 统计三类；统计页显示累计完成、互动、报错次数和陪伴天数 |
| 连戳升级 | 戳 1~2 下照常撒娇，3~5 下开始不耐烦侧身躲开，6 下以上扭头吊眉闹脾气；停手 2.6s 计数衰减，agent 一开工立刻收脾气 |
| 失落安抚 | 报错后的失落状态下戳它算安慰：开心动画 + 暖心台词，并提前结束自愈 |
| 完成提醒 | 你切到别的标签页时回合完成，标签页标题变成「✅ 完成了 · 原标题」，回来自动还原；另有可选系统通知（默认关，开启时才申请权限） |
| 久坐提醒 | 可设 45 / 60 / 90 分钟，坐满后鲸鱼浮上来喷个水提醒你歇会儿；默认关，离开页面超过 10 分钟视为已休息并重新计时 |
| 熟悉度 | 互动次数、完成回合、共处天数一起攒分，关系分三档：初识 / 熟络 / 形影不离。档位会改戳戳台词和回来时的问候，到形影不离还会偶尔主动冒泡搭话；升档时它自己会说出来，当前档位和进度在「陪伴记录」里看 |
| 甩晕 | 抓住它左右猛甩，一秒内掉头四次就会被甩晕：眼睛翻成 @@，喊你别甩了，松手后身体还要摇一会儿；手抖或慢慢来回挪不算。晕完还有后遗症——接下来十几秒游不直，航迹明显歪 |
| 贴边挤扁 | 拖到屏幕边缘按上去会被压扁，像贴在玻璃上；离开边缘自己弹回来 |
| 拖着不动 | 抓起来悬在半空超过 2 秒，它开始扭腰问你还在不在；你一动它就不问了 |
| 翻肚皮 | 双击的反应跟着关系走：平时翻个 360° 跟头，处到「形影不离」才肯翻肚皮给你看 |
| 自定义大小 | 右键 →「外观 → 大小」在小 / 标准 / 大 / 特大之间循环，0.8 ~ 1.6 倍。缩放会同步影响碰撞边界、水花位置和贴边判定，不只是看着变大 |
| 音效 | WebAudio 合成六种音效，右键可关，偏好持久化 |
| 无障碍 | `prefers-reduced-motion` 下自动降级为静态显示 |

## 安装

要求 DSH `>=0.1.5-alpha.2 <0.2.0`（web profile），Node.js `^22.19.0 || >=24.0.0`。

| DSH 版本 | 状态 | 依据 |
|---|---|---|
| `0.1.5-rc.2` | compatible | 真机跑过：新建会话 / 工具调用 / 纯文字回合，控制台 0 报错，鲸鱼 `idle→think→working→celebrate→idle` 全部触发，且 celebrate 2.5 秒后自己回落到 idle（不需要下一条消息来顶） |
| `0.1.5-rc.1` | compatible | 未实跑。npm 包逐文件比对：本插件用到的 `dsh-api-session-controller` / `dsh-client-ui-conversation` / `dsh-client-locale` / `dsh-client-modules` / `dsh-cordis-client-runner` 与 rc.2 **逐字节相同**；`dsh-client-ui-chat` 只差一段 15 字符的 CSS（与本插件读的 `legacy` 投影无关） |
| `0.1.5-alpha.2` | compatible | 未实跑。同上，唯一差异是 `dsh-cordis-client-runner` 里一个文档字符串的行号（`contract.ts:23` → `:24`） |

这台机器上原本跑的 1.1.0 在 0.1.5 下会在会话快照更新时抛
`TypeError: Cannot read properties of undefined (reading 'length')`，成因与改法见 `src/client/state.ts` 开头的字段对照。

```sh
# 本地目录安装（仓库已包含构建产物 lib/，无需先构建）
dsh plugin --profile web add link:/path/to/pet-whale

# 或 git 直装
dsh plugin --profile web add "github:<user>/pet-whale#main"
```

装完**重启 dsh web**（host 半在启动时合成；只有 host 半的改动需要重启）。
Client 半的开发改动不需要重启、不需要硬刷新：见下方「开发 / Hot Reload」。

## 构建与测试

```sh
pnpm install
pnpm typecheck   # tsc 类型检查
pnpm dev           # 开发态 watch：改 src/client 自动重建 lib/client.js，DSH HMR 自动生效
pnpm build       # tsdown → lib/index.mjs + lib/client.js
pnpm test        # jsdom 冒烟测试（状态机 / 交互 / 换肤 / 清理）
pnpm verify:hmr    # 校验当前仓库 ↔ 运行中 DSH 的 HMR 链路一致
```

## 多宠物 / 自定义宠物

外形是可插拔的：每只宠物 = `src/client/pets/<id>/` 里的一个 `PetModule`（内联 SVG + 独立样式表），
在 `src/client/pets/index.ts` 注册一行就出现在右键菜单的「外观 → 🐾 宠物」里。
运行时挂两张样式表——公共的 `BASE_CSS` 常驻，**当前宠物那张整段替换**——所以两只宠物的
选择器与 keyframes 永不共存，互不干扰。行为逻辑（状态机、拖拽、游动、粒子、菜单、统计）与宠物无关。

完整的接入步骤、状态 class 契约表、五条约定（上色只用 CSS 变量 / keyframes 用自己的前缀 /
容器比例 / 第三方 IP 声明 / **原地动作声明式**）和调试截图方法见 **[docs/MULTI-PET.md](docs/MULTI-PET.md)**。

idle 时的小动作是**声明式**的：宠物用 `micro: ['spin', 'spell', …]` 声明自己会演哪些原地动作，
插件按洗牌袋轮播并可配一句碎语（`i18n.micro[id]`）—— 灵儿关了御剑就靠这套（原地转圈/放法术/扇扇子/远眺），
新宠物加动作 = 声明 id + 写一段 keyframes，插件逻辑不用改。

```sh
pnpm preview      # 生成 pet-preview.html：所有宠物 × 多状态铺成一张网格，浏览器直接打开
                  #   node scripts/preview-pets.mjs --only=linger --states=micro-gaze --scale=4  挑单个动作
pnpm sync:preview # 把宠物资源同步进手写的 preview.html（它现在也能切宠物：?pet=cat / ?pet=linger，
                  #   并会按 micro 清单生成「原地动作」试演按钮）
pnpm pet:doctor   # 体检：样式切分、宠物注册、动作声明与样式是否配对、预览页同步、构建新鲜度（只读）
```

改造过之后，**上游更新了怎么合进来**（merge 流程、冲突对照表、回滚）见
**[docs/UPSTREAM-SYNC.md](docs/UPSTREAM-SYNC.md)**。

## 开发

- `src/client/palettes.ts` — 色板扩展点。加一行就是一个新皮肤；`eye`/`pupil` 字段用于深色皮肤的"眼睛反白"
- `src/client/pets/` — 宠物扩展点。加一只宠物 = 一个目录 + `pets/index.ts` 一行；`pets/cat/` 是可照抄的最小范例
- `src/client/i18n.ts` + `pets/<id>/text.ts` — 文案扩展点。基准文案是鲸鱼口吻，宠物用 `PetModule.text` 覆盖要改的条目
- `preview.html` — 手写交互预览台（切宠物/状态、投喂、翻滚、追光、巡游）；V1/V2 是鲸鱼的设计稿，也是 `extract-whale.mjs` 的抽取源，其余宠物由 `pnpm sync:preview` 注入
- `scripts/preview-pets.mjs` — 自动生成的检查台（`pnpm preview`）：所有宠物 × 全部状态铺成网格
- `scripts/extract-whale.mjs` — 从 `preview.html` 同步 V2 SVG（含 CSS 变量替换），改完模板重跑 `pnpm extract`（跑完用 `git diff src/client/whale.ts` 确认没有意外变化）
- `scripts/doctor.mjs` — 改造体检（`pnpm pet:doctor`）：BASE_CSS 是否混进宠物规则、宠物是否注册、预览页与 `whale.ts` 是否同步、产物是否过期；合并上游后跑它
- `scripts/verify-live.mjs` — 重启后的一键线上验证（boot 清单 / bundle 下载 / 注册格式）
- 状态来源（dsh 0.1.5）：会话生命周期取自 `ctx.sessions` 的会话快照（`running` / `lastAgentError` / `openError`）；
  `partial` / `runningCalls` / `turnEnds` 取自 `ctx.uiConversation` 的 chat 投影（`ChatSnapshot.legacy`）。
  两处的字段对照和 0.1.5 的变更说明写在 `src/client/state.ts` 文件头。

### Hot Reload

前提：DSH web profile 用 `link:` 方式安装本仓库（不是 GitHub/npm 的静态副本），且 DSH `>=0.1.5-alpha.2`。

```sh
pnpm dev
```

`pnpm dev` 会 watch 整个 `src/` 并自动重建 `lib/client.js`（以及 host 半 `lib/index.mjs`）。
DSH 内置的 `@deepseek-ai/dsh-client-hmr` 会轮询到重建结果，通过 `/plugins/events` 广播，
浏览器自动 invalide 并 reload 该插件——**client-only 改动不需要重启 DSH，也不需要刷新页面**。

- 可热更新的范围：`src/client/**` 的 UI、样式、状态机、交互等 client 实现。
- 仍然必须重启 DSH 的范围：
  - `package.json` 的 `dsh.client` / `dsh.bundle` / `exports` 结构变化
  - `cordis.patch.yml` 或 host 半 `src/index.mjs` 的插件组合变化
  - 安装 / 卸载依赖、升级 DSH、改动 profile bundles 列表
- 验证链路是否就绪：先确保 DSH 在跑，然后执行 `pnpm verify:hmr`。
- 常用脚本：
  - `pnpm dev` / `pnpm dev:client` — 开发 watch（两者当前等价，`dev:client` 语义上只指 client 热更新目标）
  - `pnpm build` — 提交前的一次性完整构建
  - `pnpm typecheck` / `pnpm test` — 类型检查与冒烟测试

## 附：自用 UI 美化补丁（仅供参考）

[patches/](patches/) 目录包含个人自用的 DSH 界面定制补丁，随仓库开源供参考，**不是本插件的组成部分**：

- **暖色纸感主题**：类 Claude 风格暖调配色（陶土 `#A3502C` + 米白 `#F7F2E6` + 暖墨 `#2E2A24`），亮暗两套，正文对比度 ≥4.5（WCAG AA）
- **鲸鱼发送 / 取消键**：发送键 = 蓝色小鲸鱼，取消键 = 黑色小鲸鱼（与 favicon 一致），按钮 48px
- 针对 DSH rc.6 的特定构建产物编写，升级 DSH 后若锚点失效需人工核对更新

```sh
node patches/apply-patches.cjs <dsh 安装根目录>
```

## 社区 fork

小鲸鱼本体以维护为主（见 [CONTRIBUTING.md](CONTRIBUTING.md)），想要更多玩法可以看看这些 fork：

- [wzwei1990/dsh-pet-whale](https://github.com/wzwei1990/dsh-pet-whale) —— 多宠物架构（可在鲸鱼 / 小猫 / 灵儿之间切换，每只有独立的 SVG、动画与台词），附带 `pnpm pet:doctor` 体检脚本

这些 fork 独立维护，与本仓库无关，使用前请阅读各自仓库的说明。

## 声明

- 鲸鱼轮廓使用 DeepSeek 官方 FishLogo 路径（品牌素材，使用请注明出处）
- 交互设计思路参考 [whale-girl](https://github.com/vlln/whale-girl)（MIT）
- 主题配色灵感来自 Anthropic Claude 的暖色纸感风格
- **灵儿（Ling'er）是非商业同人角色**：原型为《仙剑奇侠传》赵灵儿（软星 / 大宇资讯 IP），
  造型是按参考图**重画的手写 SVG**、未使用任何原作素材，**不可商用**；
  本仓库与上游作者、DSH 官方及权利人无关联。详见 [NOTICE.md](NOTICE.md)

## License

[MIT](LICENSE)
