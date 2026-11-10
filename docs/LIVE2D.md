# Live2D 桌宠（渲染器 + 联调页）

把桌宠从「内联 SVG + CSS 动画」扩到「真 Live2D 模型」的那一层。
现在是 **M3 的第一刀**：能渲染、能待机、点一下有反应；资产路由和状态映射还没接完。

## 结构

| 文件 | 作用 |
| --- | --- |
| `src/client/pets/live2d/runtime.ts` | 框架无关的 `mountLive2D(el, opts)`：加载 vendor、建 PIXI、装模型、发现动作组、销毁 |
| `src/client/pets/live2d/index.ts` | 宠物声明：盒子 220×340、资产根、点一下播 `Tap` |
| `src/client/pets/types.ts` | `PetModule.mount?: (el) => (() => void)` 挂载契约（返回卸载函数） |
| `src/client/index.ts` | `applyPet()` 里切宠物前调用上一只的卸载函数、切完调新的 mount |
| `scripts/live2d-check.html` | 不装 DSH 也能验证渲染链路的联调页 |

## 联调页怎么跑

资产（vendor + 模型）走一个带 CORS 的静态服务，页面本体走仓库根目录：

```powershell
# 1) 资产：把 dsh-live2d-preview 目录（vendor/ + models/haru/）挂到 5200，响应加 Access-Control-Allow-Origin: *
# 2) 仓库根挂到 5201
# 3) 打开
#    http://127.0.0.1:5201/scripts/live2d-check.html?zoom=1.15&offy=0.02
```

`?zoom=` / `?offy=` / `?base=` 都可以直接试，不用改代码。

看到的应该是：220×340 虚线盒里一个从头顶到脚的完整人物，点了会播 `Tap`，播完自动回待机。
页面右侧会打出 `groups`、`counts`、盒子尺寸、渲染器尺寸和当前动作 `Idle[i]` / `Tap[i]`。

## 资产路由（TODO）

宠物的 `base` 默认是 `/pet-whale/live2d/`，对应的 Node 路由**还没写**：

- `src/index.mjs` 要加 `inject: ['webServer']` + 前缀路由，把包内 `assets/live2d/` 静态吐出去
- `package.json` 的 `files` 要加 `assets`
- 没上线之前想在真 GUI 里看效果，临时把 localStorage 指到联调服务器：
  `localStorage['pet-whale:live2d-base'] = 'http://127.0.0.1:5200/'`

> 写 Node 路由必须重启 DSH 才能验证，所以这一步单独做。

## 从一张图生成自己的模型（已移植进本仓库）

`tools/live2d/` 是一套可复用管线：**立绘 PNG → 分层 → 自动绑骨 → moc3 / web 运行时**。
一次跑通、换角色只改 `part-spec.json` 里的 bbox。

- 生产端：`cut_sam.py`（MobileSAM 切件）→ `post_masks.py`（去碎块/膨胀/闭运算/补洞层/闭眼层）→ `build_model.mjs`（驱动 PSD2Live MCP）
- 运行时：`src/client/pets/live2d/p2l.ts` 封装 PSD2Live 导出的 web 运行时（`lipSync` / `lookAt` / `hitTest`）
- 打包：`package_assets.mjs` 把导出物收进 `assets/live2d/<name>/`
- **完整步骤见 [tools/live2d/README.md](../tools/live2d/README.md)**（含每一步的判据与常见故障）

宠物列表里对应 **「自定义模型」（`live2d-own`）**；旧的 `live2d`（Haru + pixi）保留作对照。

> ⚠️ 两点未完成（不要当成已完成）：
> 1. 插件还没有把 `assets/live2d/**` 通过 HTTP 暴露出去（Node 半需要加 `webServer` 静态路由），
>    没有它时运行时会 404——本地可用 `localStorage['pet-whale:p2l-base']` 指到临时静态服务联调。
> 2. **许可**：PSD2Live 仓库是 GPL-3.0，导出的 `p2l.js` 头虽自称 MIT 但仓库里没有独立 MIT 文件，
>    授权状态有歧义；`licenses/` 里还有 Cubism SDK 许可（导出物是 Live2D 格式）。
>    **自用没问题；凡是对外分发（npm 发布 / 公开仓库带资产），必须先向作者确认运行时可再分发，
>    并核实 Live2D Cubism SDK 的模型发布条款。**

## 三条实测结论（别「简化」掉）

1. **必须用 `dist/cubism4.min.js`**，不是 `index.min.js`（后者是 cubism2 路径，`window.PIXI.live2d` 会是空的）。
2. **加载前要塞 `window.process` shim**：UMD 包会读 `process.env`，浏览器里没有它，整个库注册失败。
3. **库只在 `_render()` 里推进模型时间**：`model.update(dt)` 只是把 dt 攒起来，真正应用在下一次渲染。
   所以后台标签页里 rAF 一停，动画就冻住——这和 `docs/DESIGN-v2.md` 里「桌宠要加 visibility 门控」是同一条。
   验证时也不要拿「调了 N 次 update」当证据，要么真渲染，要么看 `motionManager.state`。

## 其它踩过的坑

- **`fit()` 必须用未缩放尺寸**（`internalModel.originalWidth/Height`）。`model.width` 是 `localBounds × scale`，
  拿它当基准的话 `ResizeObserver` 第二次回调会越缩越小，最后模型飞出盒子（表现为一团灰色几何体）。
- **同一支动作会被 `reserve()` 拒掉**：`currentGroup/currentIndex` 相同就返回 false，点按钮看着就像没反应。
  所以点播要随机换一支、并跳过正在播的那支。
- **Haru 有 A/B 两套手臂**，靠 motion 的 `PartOpacity` 隐藏，0.5.0-beta 不应用它 →
  在 `prerender` 里显式 `setPartOpacityById('Part01ArmRB001'|'Part01ArmLB001', 0)`。
  自建模型没有这两个 id 时是空操作。
- **库不会自动播待机**：只有点播的 Tap 会被触发，不主动起一支 `Idle`，模型就是一张静止立绘。
