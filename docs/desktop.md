# 桌面端桌宠（pet-whale desktop）

把大肥鱼从浏览器里搬到桌面上：透明、无边框、置顶、点击穿透、可拖拽。Electron 本体**不随 npm 包分发**，首次运行时按需下载到 `~/.dsh/pet-whale/electron`（默认走 npmmirror 镜像）。

## 怎么开、怎么关

| 入口 | 操作 |
| --- | --- |
| **网页桌宠右键 → 行为 → 🖥️ 住到桌面** | 一键开关；首次会提示"正在准备桌面运行时"（下载 Electron） |
| **托盘图标** | 左键显示/隐藏；右键菜单：显示/隐藏、重新载入、退出桌宠 |
| **桌面窗口右键** | 置顶开关、重新载入、退出 |
| 命令行 | `npm run desktop`（开发调试）；`npm run desktop:ensure` 只装运行时 |

状态是持久的：上次退出时桌面端是开着的，DSH 重启后会在 Electron 已就绪的前提下自动拉起来（`~/.dsh/dsh-pet/desktop.json`）。

## 和网页端一起开着会不会冲突

| 冲突点 | 处理方式 |
| --- | --- |
| 屏幕上叠两只 | 网页端每 4 秒查一次桌面端状态，**桌面端在跑时自动收起网页桌宠**（`desktop-hidden`），关掉后自动恢复 |
| 动画状态不一致 | 网页端把聚合状态 POST 到 `/pet-whale/api/presence`；桌面端轮询（1.2 秒）跟随 think/working/wait/celebrate/error；8 秒没有更新就回 idle（DSH 关了不会一直卡在 thinking） |
| 重复启动 | Electron `requestSingleInstanceLock()`：第二次启动直接退出，并把已有窗口唤到前面 |
| 设置不一致（大小/宠物/配色） | **暂未同步**：两端各自持久化，网页改设置不会影响桌面端。后续可加宿主设置 API |
| 互动反馈（摸头/投喂/pet_react） | 桌面端目前只跟随会话状态，表情插播还没桥接 |
| 资源占用 | 桌面端是独立进程、独立解码缓存；建议平时只开一边（网页端会自动收起，但浏览器标签仍占内存） |

## 结构

```
runtime/desktop/
├─ package.json      Electron 应用清单（main: main.mjs）
├─ main.mjs          透明置顶窗口 + 单实例锁 + 托盘 + 点击穿透 + 静态服务 + presence 轮询
├─ preload.cjs       最小 IPC：onCommand / ready / openMenu / quit / setInteractive
├─ index.html        透明页面：画布等比缩放居中，空白区域 -webkit-app-region: drag
└─ window-fit.mjs    纯函数：窗口尺寸/位置与工作区钳制（有单测）
src/desktop/renderer.ts   渲染入口：manifest → createSpritePlayer → 与网页同一套 pick/rotation
scripts/ensure-electron.mjs  按需下载 Electron（npm 禁用 postinstall 时自动手动跑 install.js）
scripts/start-desktop.mjs    确保 Electron → 启动 runtime/desktop
```

静态服务（只监听 127.0.0.1 随机端口）：

```
/sprite/*   → assets/sprite/*
/renderer/* → lib/*（desktop-renderer.js）
/app/*      → runtime/desktop/*
```

## 动画规则（与网页端一致）

- 待机："播完一圈"再换（onLoop），30 秒兜底
- 每第 3 轮抽一次自娱池；洗牌袋 + avoidSame 不连续重复
- 点击/悬停从各自池随机
- 空闲 20 秒打瞌睡，睡 1 分钟自动醒；点一下唤醒

## 冒烟

```bash
PET_WHALE_SMOKE_OUT=./smoke.png node scripts/start-desktop.mjs --smoke
```

窗口会在桌面出现约 3 秒，把渲染结果截图到指定路径后自动退出。

## 打包（绿色包）

```bash
npm i -D electron-builder
npm run desktop:pack     # 输出到 dist-desktop/
```

Electron 版本由 `electron-builder.yml` 读取 `electron` 依赖；npm 包里**不含** Electron 本体。

## 还没做

| 项 | 说明 |
| --- | --- |
| 两端设置同步 | 大小/宠物/配色目前各存各的 |
| 表情插播桥 | 摸头/投喂/pet_react 在桌面端还不播放 |
| 多显示器/DPI | 已按工作区钳制，DPI 线性化未做 |
| 图标 | 托盘是内置小图，安装包图标待补 |
