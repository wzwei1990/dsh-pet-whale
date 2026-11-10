# 桌宠 v2 设计（S2）

> 状态：草案（2026-11-06）。基座是 `wzwei1990/dsh-pet-whale`（改造，不另起项目）。
> 目标宿主：DSH 0.2.1-rc.x ~ 0.2.2-rc.1（双版本兼容，与四个自研插件同一套做法）。

## 0. 结论先行

- **基座**：复用 pet-whale 的纯 DOM client bundle（状态机、多宠物、音效、i18n、测试齐全）。
- **路线**：M1 DOM 立绘 + 状态机 + **语音口型** → M2 互动/成长 + QQ 消息驱动 → M3 Live2D 渲染器 → M4 ComfyUI 素材 DIY → M5（可选）桌面壳。
- **差异化**（生态里少见的三件事）：
  1. **语音驱动的口型/动作**：直接吃 `dsh-tts` 的 `durationMs` + `audioUrl`，说到哪动到哪；
  2. **消息驱动**：`dsh-napcat` 的 QQ 消息/语音 → 宠物表情动作；S3 之后接直播弹幕；
  3. **AI 生成立绘与动作**：用我们已有的 ComfyUI（H3/图像）管线产出「宠物包」，而不是只能用手绘/下载素材。

## 1. 生态调研（2026-11-06 数据）

| 仓库 | ★ | 形态 | 值得借鉴的点 |
|---|---|---|---|
| `PC2005-cloud/dsh-pet` | 5706 | Web DOM 帧动画 | 一行装好、多开、大小位置可配、**DIY 素材链（AI 视频造宠物）** |
| `MerZlin/dsh-pet-indesktop` | 3120 | 桌面壳移植 | 同一套宠物搬到 Windows/Linux/macOS（Tauri/Electron） |
| `petdex` | 4330 | 素材画廊 | 宠物素材的公共分发形态 |
| `vlln/whale-girl` | 403 | Web DOM + Tauri 桌面壳 | QQ 宠物式养成（喂食/玩耍/等级/记忆）＋桌面壳复用同一 client |
| `Sutera-Diffusus/dsh-whale-musume` | 204 | Web | 45 项成就、小游戏、跨端存档、**按工具类型切换工作姿态** |
| `ssamurias/dsh-fish` | 122 | Web | 从行为里「长」出人格 |
| `liyupi/dsh-kun-like-pet` | 113 | Web | 9 种动作随工作状态切换（最轻量的状态镜像） |
| `Loping151/dsh-nekowhale-stickers` | 155 | 素材包 | 表情贴纸知识包 |
| `Andersen216/dsh-whale-girl-live2d` | 89 | Web Live2D | 一键部署脚本、桌面版路径 |
| `A8Chann/dsh-pet-live2d` | 71 | Web Live2D（Cubism 5） | 8 组动作 + 44 表情/道具、右键换装、跟随鼠标 |
| `varians/ghost` | 52 | Web Live2D | 本地实时数字人 |
| `InariNGT-Ofiicial/jingyu-live2d-agent` | 49 | Live2D 编排 | 自然语言编排动作、导出 GIF/MP4 |
| `cyanfish-x/dsh-live2d-pets` | 33 | Web Live2D | **策展模型 + 自定义 http/本地模型路径**、SSE 状态推送、JSONC 自定义人设、HitArea 不足时包围盒回退、限帧/后台暂停/低配降级 |
| `IvenKooLab/desktop-pet` | 256 | 3D 毛绒 | 3D 形态参考 |

**技术共性（已从源码/README 核实）**

- 形态：`dsh.bundle.patch` + `package.json` 的 `dsh.client = { platform: 'web' }`；客户端在 Web GUI 里挂 **fixed overlay**，不占布局。
- 状态源：宿主 client 服务（`sessions` / `uiConversation` / `uiSession`）或 host 侧 SSE。
- Live2D：`pixi` + `live2d-display(cubism4)` + `live2dcubismcore`，三者作为 **vendor 资源内置**（cyanfish-x 就是这么做的）。
- 桌面壳：Tauri/Electron 复用同一份 client bundle 做透明窗口（vlln、MerZlin、HoppoChan0721）。
- 配置：`settings.yaml` 存标量，插件私有 JSONC 存复杂结构。
- 授权：内置 Live2D 模型多为 **CC BY-NC-SA**（不可商用），必须写 NOTICE。

## 2. 我们的定位

| 能力 | 生态常见 | 我们 |
|---|---|---|
| 会话状态镜像 | 普遍有 | 沿用 pet-whale 的 WhaleDriver |
| 口型 | 少数有，多为静态嘴型 | **按 dsh-tts 音频做口型**（时长包络 → 能量包络） |
| 说话内容 | 少见 | 气泡字幕 + 音频都由 dsh-tts 提供 |
| 消息驱动 | 少见 | QQ（napcat）语音/文字 → 动作表情；S3 直播弹幕 |
| 素材来源 | 手绘 / 下载 / AI 视频 | **ComfyUI 生成立绘与动作序列**（复用现有管线），可产出「宠物包」 |
| 多端 | 部分 | 存档跨端（localStorage + 可选 host 持久化） |

## 3. 架构

```
┌──────────────── Host（插件 index.ts）────────────────┐
│ 状态聚合：session events → PetStateSnapshot            │
│   { state, since, turnId?, toolName?, error?, ... }    │
│ 事件总线：GET /dsh-pet/events (SSE, 带 seq，可断线续传) │
│ 资产服务：GET /dsh-pet/assets/*（同源，规避 file://）   │
│ 配置：zod schema（全部字段 .volatile()，热重读）        │
│ 对外服务：ctx.provide('dshPet', { snapshot, speak })    │
└───────────────────────────────────────────────────────┘
                 ▲ SSE / fetch          │ dshTts.pending / speak
┌──────────────── Client（client/index.ts）─────────────┐
│ inject: sessions / locale / uiConversation / uiSession │
│ Renderer 抽象：DomRenderer | Live2DRenderer（可替换）   │
│ 驱动：状态机（沿用）+ 口型驱动（durationMs → 包络）      │
│ 交互：拖拽 / 点击 / 投喂 / 跟随鼠标                      │
│ 不打扰：尺寸 / 透明度 / 自动隐藏 / 后台暂停 / 限帧       │
└───────────────────────────────────────────────────────┘
```

**与语音的契约（已具备，不用再改 dsh-tts）**

```ts
dshTts.pending(since) → { items: [{ seq, text, audioUrl, durationMs }] }
dshTts.speak(text, { source }) → { audioUrl, durationMs, utterance }
window: 'dsh-tts:speak' 事件（现有 client 已派发）
```

## 4. 口型方案（三级，先做 1）

1. **时长线性（M1）**：拿 `durationMs`，按「音节数 ≈ 文本长度/2」估节奏，正弦包络驱动张嘴幅度。零延迟、零依赖、离线可用。
2. **能量包络（M2）**：`AudioContext.createAnalyser()` 实时 FFT → 张嘴幅度/音量映射；与 `<audio>` 同一时钟，最跟嘴。
3. **音素 viseme（M3+ 可选）**：Edge/火山都不返回音素，需要本地强制对齐，暂不做。

同步策略：宠物播放的 `<audio>` 与驱动共用 `AudioContext.currentTime`；多端时用服务端事件里的时间戳对齐（不做逐帧同步，允许 ±80ms）。

## 5. 与现有 pet-whale 的改造映射

| 现有文件 | 处理 |
|---|---|
| `src/client/index.ts`（96KB，DOM 渲染 + 交互 + 设置面板） | 保留交互/设置，抽出 `PetRenderer` 接口 |
| `src/client/state.ts`（`WhaleDriver` 状态机） | 保留，新增 `speaking` 状态与 `since` 时间戳 |
| `src/client/pets/` | 升级为「宠物包」（立绘 + 动作帧 + 口型图集 + manifest） |
| `src/client/sounds.ts` | 保留音效；说话改走 dsh-tts 合成（可关） |
| `src/client/swim.ts` / `palettes.ts` / `i18n.ts` | 保留（漫游、配色、多语言） |
| `package.json` 的 `dsh.compatibility` | 更新到 `0.2.1-rc.x`、`0.2.2-rc.1` |
| `tests/*` | 沿用；新增口型/语音事件用例、宿主兼容用例 |

## 6. 里程碑

| 阶段 | 内容 | 验收 |
|---|---|---|
| **M1** | `speaking` 状态 + 时长口型 + 设置（尺寸/开关/口型）+ 兼容 0.2.2 + 接 dsh-tts | Web 里让它说一句话，嘴巴跟着动，说完回 idle |
| **M2** | 互动（点击/投喂/成长存档）+ 能量口型 + QQ 消息驱动（napcat） | 群里发语音 → 宠物在浏览器里「跟着说」 |
| **M3** | Live2D 渲染器（pixi + live2d-display，vendor 内置；模型路径支持 http/本地） | 换 Live2D 模型后动作/表情仍跟状态走 |
| **M4** | ComfyUI 素材 DIY（H3 生成动作序列/立绘 → 宠物包格式）+ 多宠物 | 一句话生成一只新宠物并能装上 |
| **M5** | 桌面壳（Tauri，复用同一 client bundle） | 透明置顶窗口里跑同一只宠物 |

## 7. 风险与取舍

| 风险 | 应对 |
|---|---|
| Live2D 授权（NC-SA 不可商用） | M3 内置一个 MIT/自制模型；其余让用户自填路径并显示授权提示 |
| 性能（长语音/高帧率） | 限帧（默认 30fps）、后台标签页暂停、`prefers-reduced-motion` 降级 |
| 体积（pixi ≈ 1MB + cubism core） | Live2D 资源 **懒加载**，DOM 模式不加载 |
| 宿主 API 变动（0.1.x→0.2.x 踩过） | 只用公开 `inject` 服务；host 侧用 `ctx.on('session/event')`（已在 dsh-tts 验证可用） |
| 多实例（同一浏览器多标签） | 存档用 `localStorage` + 事件 seq，避免重复播报 |

## 8. 待确认（开工前）

1. **起步形象**：继续用 pet-whale 的鲸鱼，还是用 ComfyUI 生成一只新宠物（比如「小灯」形象）？
2. **Live2D 内置模型**：M3 要不要内置一个宽松授权模型（含 NOTICE），还是只支持用户自填模型路径？
3. **桌面壳（Tauri）**：排到 M5 之后再说，还是直接不做（只做 Web 内宠物）？

## 9. 你指定的两个仓库（技术细节）

| 仓库 | ★ | 技术栈 | 关键结论 |
|---|---|---|---|
| `zhu1090093659/dsh-pet` | 67 | React + pixi.js + **untitled-pixi-live2d-engine**；client inject 走 `dsh-client-ui-renderer` / `ui-settings` / `ui-slots` / `ui-conversation` / `api-session-controller`；engines 写死 **>=0.2.2-rc.1** | 最现代的写法（React 组件化 + Live2D 引擎封装），但**只支持 0.2.2+**，我们还要兼容 0.2.1-rc.x，不能照抄它的 engines 与 inject 面板 |
| `FujiwaraReisen/dsh-live2dwaifu` | 0 | 零运行时依赖；`dsh.bundle.patch` + `dsh.client.platform=web` | 极简形态可参考：不引框架也能做 overlay 宠物；适合验证「最小可运行」 |

**我们的取舍**

- **不引 React**：pet-whale 已是纯 DOM + tsdown 构建，体积小、加载快、无框架依赖；React 组件化收益主要在复杂设置面板，而我们已经有可用的设置 UI（client 通道）。
- **Live2D 引擎选型（M3 再定）**：`untitled-pixi-live2d-engine`（zhu 在用，与 pixi 8 配套）或 `live2d-display(cubism4)`（cyanfish-x/A8Chann 在用，生态更老更稳）。两者都要求把 cubism core 作为 vendor 资源内置，注意授权（Cubism SDK 有商用条款）。
- **宿主版本**：坚持双版本（`>=0.2.1-0 <0.3.0-0`），client 侧只用两个大版本都存在的公开 inject（sessions / locale / uiConversation / uiSession）；若要用 0.2.2 才有的 `ui-renderer` 面板能力，做成**运行时探测 + 降级**，不写进硬 inject。

## 10. 起步形象：素材流程与花费（2026-11-06 核价）

### 10.1 三条路线

| 路线 | 用到什么 | 出效果速度 | 成本 | 适合阶段 |
|---|---|---|---|---|
| **A. 2D 帧动画（DOM）** | ComfyUI 文生图（本地）/ `dsh-image-gen`（API）+ `dsh-short-video-studio`（H3 生动作视频→抽帧） | 最快（几十分钟） | **≈ 0 元**（全本地） | **M1 就用这条** |
| **B. Live2D** | 立绘（A 的产物）+ Live2D Cubism Editor 绑定 | 慢（绑定 1~3 小时/角色） | 软件免费，人力为主 | M3 |
| **C. 3D（GLB/VRM）** | `tripo-dsh` 生模型（$0.10~0.30/次）+ three.js 渲染（spike 已验证） | 中 | $0.2~0.9（含抽卡） | 可选扩展 |

### 10.2 路线 A 的具体流程（推荐起步）

1. **设定**：写形象描述（体型/配色/服饰/气质）→ 定 1 个主形象。
2. **立绘**：ComfyUI `image.text2image`（本地，免费）出「正面全身、纯底、无文字」1K 图；不满意就多抽几张。
3. **表情差分**：以立绘为参考，用同一模型出「开心 / 生气 / 困 / 惊讶」四张（图生图或强约束同 seed）。
4. **动作序列**：`dsh-short-video-studio` 用 H3 生成 3~5 秒动作视频（呼吸/挥手/跳跃，本地 ComfyUI，免费）→ ffmpeg 抽 8~12 帧，做成循环动画。
5. **口型图集**：嘴「闭 / 半开 / 全开」三态（可由立绘局部重绘得到）。
6. **打包**：`pet-pack/` = `manifest.json`（尺寸/锚点/状态映射/口型） + `base.png` + `faces/*.png` + `actions/*/frame-*.png` + `mouth/*.png`。
7. **接进 pet-whale**：`PetModule` 增加 `packUrl`，渲染器读 manifest。

### 10.3 花费明细（币种：美元）

| 项目 | 工具 | 单次花费 | 起步一套（估） |
|---|---|---|---|
| 立绘（本地） | ComfyUI（`image.text2image`） | 0 | 0 |
| 立绘（API 抽卡） | `dsh-image-gen`（gpt-image-2.6-sunburst，1K） | ≈ $0.03/张 | 抽 10 张 ≈ $0.3 |
| 表情差分 | 同上 | ≈ $0.03/张 | 4 张 ≈ $0.12 |
| 动作视频 3~5s | `dsh-short-video-studio`（H3 本地） | 0（GPU 时间） | 0 |
| 3D 模型 | `tripo-dsh`（10~30 credits/次） | $0.10~0.30/次 | 2~3 次 ≈ $0.2~0.9 |
| Live2D 绑定 | Cubism Editor | 0（人力 1~3h） | — |

> 计价依据：Tripo 官方文档 *1 credit = $0.01*，text-to-model 自 10 credits 起；gpt-image-2.6 按图像 token 计费（输出 $30/1M），1K 约 $0.03~/张。

### 10.4 结论

- **起步形象走 A（全本地，≈0 元）**：M1 就能验证「状态机 + 口型」这条主线，不被美术卡住。
- 想要更好看再上 `dsh-image-gen` 抽卡（预算 $1 以内足够一套）。
- 3D / Live2D 都是**后置**：3D 有 spike 结论可直接复用（+50KB gzip、1.6ms/帧），Live2D 卡在绑定人力。

### 10.5 3dpet-spike 可借鉴的结论（已实测，不必重做）

- 客户端包体：three.js 打进 bundle 只涨 **约 +50KB gzip**（477KB raw / 119KB gzip vs pet-whale 263KB / 70KB）
- 性能：轻场景 **0.57ms/帧**；重场景（43k 面 + 逐顶点形变）**1.6~1.9ms/帧**，60fps 实测 55fps
- 后台标签页 rAF 自动挂起 → 天然不耗电（再加 visibility 门控更稳）
- 资源投递：`ctx.webServer.register({ kind: 'prefix', path, handler(req, res) })` 可发任意二进制（GLB/VRM/图集），无需额外依赖
- 已设计好 `PetRenderer` 抽象（SvgRenderer / WebglRenderer）+ `Model3D`（clips / expressions / springBone / lookAtCursor）
- 真成本在**模型来源**：VRoid 免费捏 VRM（半天）或 Tripo 生成 GLB（$0.1~0.3/次）

## 11. 决策记录

- **2026-11-06 形象定为 C**（六头身御姐版，参考图 `E:\dsnworkspace\dsh-image-gen\image-402502e6.png`），一步到位走 Live2D。
- 出图统一走 `dsh-image-gen`（ComfyUI 连的是云端接口，不免费，不再假设本地免费）。
- `dsh-short-video-studio` 的 ComfyUI 设置卡片在 0.2.2-rc.1 下不显示：其客户端代码 1.13.0/1.14.1/1.15.0 逐字节相同（都注册 `settings.section`），`dsh.client.inject` 也一直含 `@deepseek-ai/dsh-client-runtime`；是宿主侧该包/服务变更导致，**不是作者删的**。需要上游适配或宿主回退。

## 12. Live2D 工具链调研（2026-11-06，GitHub star 数据）

### 12.1 渲染 / 运行时

| 项目 | ★ | 授权 | 语言 | 用途 |
|---|---|---|---|---|
| `guansss/pixi-live2d-display` | 1516 | MIT | TS | **PixiJS 的 Live2D 通用渲染层**（Cubism 2.1/4，全版本模型、命中测试、动作保留）→ 我们的首选渲染器 |
| `stevenjoezhang/live2d-widget` | 11025 | GPL-3.0 | TS | 网页看板娘小部件；交互/懒加载参考，GPL 不 vendor |
| `EasyLive2D/live2d-py` | 582 | MIT | C++/py | Python 侧 Live2D 运行库（服务端渲染/测试可用） |

> 注意：渲染必须配 **Live2D Cubism Core**（官方 SDK，授权独立，商用需许可）；pixi-live2d-display 只是 MIT 封装。

### 12.2 制作 / 绑定（关键）

| 项目 | ★ | 授权 | 语言 | 说明 |
|---|---|---|---|---|
| **`tsunehimatoi/psd2live`** | **851** | GPL-3.0 | Kotlin | **从分层 PSD 自动生成网格/变形器/参数/动作/物理，导出 Cubism `.moc3`/`.cmo3`、VTube Studio、网页运行时**；自带本地 MCP 服务，Agent 可直接读写工程 → **解决我们「不会绑 Live2D」的核心卡点** |
| `umamoorg/umamo` | 189 | GPL-3.0 | Kotlin | 开源跨平台 2D 绑定编辑器（备选） |
| `lvhaojie456/image-to-live2d` | 11 | MIT | Python | 单图/提示词 → 首版 Live2D（实验性，可试） |
| Live2D Cubism Editor | — | 免费版可用 | — | 手工绑定/微调的标准工具 |

### 12.3 完整项目参考（架构/交互）

| 项目 | ★ | 授权 | 语言 | 可借鉴 |
|---|---|---|---|---|
| `moeru-ai/airi` | **51155** | MIT | TS | 整套 AI 伴侣（Live2D 驱动、语音→表情/口型、记忆）；官方有 `unplugin-live2d-sdk` 处理 SDK 装载 |
| `Open-LLM-VTuber/Open-LLM-VTuber` | 14606 | 自定义 | Python | 语音对话 + Live2D 口型联动（TTS → 参数）的成熟链路 |
| `Project-N-E-K-O/N.E.K.O` | 3189 | Apache-2.0 | — | 伴侣 agent 交互设计 |
| `wan-h/awesome-digital-human-live2d` | 2437 | MIT | TS | 数字人清单/方案索引 |
| `zenghongtu/PPet` | 2034 | MIT | TS/Electron | 桌面壳（透明窗口 + 点击穿透）参考 |
| `vignetteapp/vignette` | 522 | 自定义 | — | 开源 VTuber 软件（跟踪/渲染架构） |
| `Eikanya/Live2d-model` | 3507 | 无统一授权 | — | 模型合集（**逐个模型看授权**，多数不可商用） |

### 12.4 我们 M3 的落地栈

```
C 立绘（已定）
  └─ 分层 PSD（脸/眼/口/刘海/双马尾/身体/裙摆/鲸尾；我出草案 + 你补接缝）
      └─ PSD2Live 自动绑定（GPL-3.0，仅作本地工具，不 vendor 代码）
          └─ 导出 .moc3 / .cmo3（可在 VTube Studio 先验收）
              └─ pet-whale 的 Live2DRenderer：pixi + pixi-live2d-display（MIT）
                  └─ 口型：dsh-tts 的 audioUrl + durationMs（先用时长包络，后接 AnalyserNode）
```

### 12.5 授权红线

- **Cubism Core SDK**：商用需 Live2D 许可；插件里只做「可选依赖 + 用户自备」或内置但注明
- **GPL-3.0 工具**（psd2live / umamo / live2d-widget）：只当本地工具用，不把代码拷进 MIT 插件
- **模型素材**：`Eikanya/Live2d-model` 等合集无统一授权，默认不可商用；自用/直播需逐个确认

## 13. 免费 Live2D 跑通记录（2026-11-06）

本地预览工程：`E:\dsnworkspace\dsh-live2d-preview`（静态服务 http://127.0.0.1:5199）

| 组成 | 来源 | 体积 |
|---|---|---|
| Cubism Core（web） | Live2D 官方 SDK 直链 | 202KB |
| PixiJS 6.5.10 | jsDelivr | 450KB |
| pixi-live2d-display 0.5.0-beta | jsDelivr（**用 cubism4 版，不是 index 版**） | 142KB |
| Haru 样例模型 | pixi-live2d-display 测试资源（Live2D 官方免费样例） | 9 个文件 ≈ 3MB |

**实测结果**：模型加载 ✅、待机动作播放 ✅、口型参数 `ParamMouthOpenY` 实时驱动 ✅（模拟说话 3 秒）。

**踩到的两个坑**
1. `dist/index.min.js` 在浏览器里 `PIXI.live2d` 为空 → 改用 `dist/cubism4.min.js`（Cubism 4 专用包）
2. UMD 包读 `process.env`，浏览器无 `process` → 加载前补 `window.process = { env: { NODE_ENV: 'production' } }`

## 14. 「图片 → Live2D」集成路线与安装清单

### 14.1 轻量路线（推荐）：PSD2Live 自动绑定

| 要装的 | 平台 | 获取 |
|---|---|---|
| **PSD2Live 3.6.7**（Windows x64 便携版 97MB，解压即用） | Windows/macOS/Linux | GitHub Releases `tsunehimatoi/psd2live` |
| Live2D Cubism Editor（免费版，可选，用于精修/验收） | Win/mac | live2d.com |
| VTube Studio（可选，验收 moc3） | Steam | — |

流程：C 立绘 → 分层 PSD（我出草案）→ PSD2Live 自动生成网格/参数/物理 → 导出 `.moc3` → 进插件渲染。

### 14.2 重路线（可选）：image-to-live2d（单图直出）

要求（官方 README）：

| 依赖 | 说明 |
|---|---|
| 制作主机 | **macOS 或 Windows**（Cubism Core 的 JNI 只随 Cubism Editor 提供这两个平台） |
| Python 3.11+ / JDK 21 | Gradle 由 psd2live 自带 |
| GPU 主机 | **Linux + 24GB NVIDIA（4090 实测）**，制作主机需能免密 SSH |
| Cubism Core | `Live2DCubismCore.jar` + JNI（从 Cubism Editor 的 res/ 取） |
| OpenAI 兼容接口 | 图像生成（最好透明背景）、带遮罩编辑、视觉模型返回 JSON |
| 权重 | `scripts/download_models.py` 下载并校验 |

→ 我们目前**不具备 24GB GPU 主机**，暂不采用；等有算力再评估。

### 14.3 授权提醒

- Cubism Core / Cubism Editor：商用需 Live2D 许可
- PSD2Live：GPL-3.0（本地工具，不 vendor 代码）
- 官方免费样例模型：仅按官方条款使用，不可商用再分发

## 15. 免费模型跑通的踩坑（实测）

1. **「两双手」= A/B 两套手臂同时可见**：Haru 等模型把两种手臂姿势做成两个 Part，正常由动作里的 `PartOpacity` 曲线隐藏另一套。实测 `pixi-live2d-display 0.5.0-beta` **没有把 PartOpacity 应用下来**（动作在跑、参数在变、`Part01ArmRB001` 的 opacity 恒为 1）。
   - 临时解法：渲染前显式 `setPartOpacityById('...B...', 0)`（样例模型专属）
   - 正式解法：接 PSD2Live 导出的模型时自带正确 part 透明度；集成时加「PartOpacity 兜底」自检
2. **库只在渲染时更新模型**：`Live2DModel.update(dt)` 只是累加时间，真正推理在 `_render()` 里。浏览器**后台标签页 rAF 被挂起** → 模型停在首帧（看起来像"动作不播"）。
   - 桌宠要加 visibility 门控，前台才跑；验证时窗口必须可见
3. 浏览器端 UMD 包要点：
   - 用 `dist/cubism4.min.js`（不是 `index.min.js`）
   - 需要 `process` shim
   - `PIXI.Ticker.shared` 与 `Application` 的 ticker 是两套，别混
