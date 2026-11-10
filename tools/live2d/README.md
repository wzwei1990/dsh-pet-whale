# 图片 → Live2D 模型：可复用管线

把一张立绘做成可动的 Live2D 模型（`.moc3` + PSD2Live web 运行时），供桌宠加载。
这套脚本是 2026-11 实战跑通后提炼的，**换角色只需要改 `part-spec.json`**。

## 链路

```
① cut_sam.py      MobileSAM 按 spec 里的 bbox 逐件出掩膜 → out/mask-*.png
② post_masks.py  去碎块 / 膨胀（重叠）/ 头发闭运算+补孔 / 合成补洞层与闭眼层
                  → out/anchored/part-*.png（带四角锚点像素，防止导入时被居中）
③ build_model.mjs 走 PSD2Live MCP：建工程 → 导入 → 标 role → rig_generate
                  → 补眨眼关键形 → 导出 moc3 / web
④ 把 web 导出的 4 个文件放进插件 assets/live2d/<name>/
   → src/client/pets/live2d/p2l.ts 用 P2LPlayer 加载
```

## 为什么这么设计（都是踩过的坑）

| 坑 | 结论 |
| --- | --- |
| 拿生成图当"revealed"再做色差 peel | ❌ 生成模型会整幅重画，diff 全图铺开；只有色差大的小件（眼睛/嘴）偶尔能成 |
| 让模型一次出多格"少一件"的宫格 | ❌ 四格出来基本一样，模型不按格改 |
| PSD2Live `layer_import_images` | ⚠️ 会**裁掉透明边再居中**——多图层会全叠到画布中央。对策：给每张 PNG 四角加 `alpha=1` 的锚点像素，锁住画布尺寸 |
| 头发层也膨胀 4px | ❌ 细发丝边框会糊。对策：头发层 `dilate:0` + `close:2` + `fillHoles` |
| 只膨胀不补洞 | ❌ SAM 掩膜在发丝处有小孔，不膨胀时透出来。对策：闭运算 + 填充内部孔洞 |
| 脖子以下露白洞（裙前/腿间） | ✅ 用"未覆盖像素 − 轮廓 6px 边带"合成 residual 补洞层 |
| 眨眼做不出 | ❌ 压扁整眼只能"眯眼"；按颜色拆睫毛/眼白/虹膜再压扁会变白块；`keyform_apply` 设 opacity=0 它的渲染器不认。✅ **合成 `eye_close` 层**（肤色补片 + 眼睑弧线，肤色取眼睛下方脸颊带中位色），PSD2Live 的 `eye.lid-fade` 模块会自动接管显隐 |
| 眼睛左右标反 | PSD2Live / Cubism 约定：`ParamEyeLOpen` 管**角色左眼**（画面右）。需要左右独立眨眼时按这个约定命名 |
| pixi-live2d-display 渲染新 moc3 | ❌ 报 `_currentFrameNo` undefined（内置 Cubism Web Framework 太旧）。✅ 用 PSD2Live 导出的 **web 运行时**（`p2l.js` + `p2l_runtime.wasm` + `*.p2lrt`） |

## 运行时 API（桌宠侧）

```ts
import { createP2LPlayer } from '../live2d/p2l'
const player = await createP2LPlayer(canvas, {
  base: '/pet-whale/live2d/<name>/',
  model: '<name>.p2lrt',
})
player.play('Idle')          // clips: Idle / Blink / Nod / Shake / Talk
player.expression('smile')   // expressions: smile / sad / angry / surprised / shy / gloom
player.lipSync(0.8)          // 口型：接 dshTts 的 durationMs / visemes
player.lookAt(x, y)          // 视线：鼠标位置归一化到 -1..1
player.hitTest(cx, cy)       // 命中部位字符串（摸头/点击互动）
```

## 资产约定

```
assets/live2d/<name>/
├── p2l.js
├── p2l_runtime.wasm
└── <name>.p2lrt
```

> ⚠️ **许可证**：`p2l.js` / `p2l_runtime.wasm` 是 PSD2Live 的伴随产物，随模型一起分发。
> 正式发布前必须确认 PSD2Live 的许可证与本项目兼容（若不允许再分发运行时，就必须改用
> 其他运行时或让用户自备模型文件）。这一点在上线前要专门核实，不要默认可用。

## 前置依赖

- **MobileSAM**（CPU 可跑）：
  ```powershell
  conda create -y -n samcut python=3.10
  D:\miniconda3\envs\samcut\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
  D:\miniconda3\envs\samcut\python.exe -m pip install timm git+https://github.com/ChaoningZhang/MobileSAM.git
  # 权重：weights/mobile_sam.pt（约 40MB）
  ```
- **PSD2Live 3.7+** 桌面端在跑，MCP 默认 `http://127.0.0.1:23871/mcp`，token 从界面取（每次重启可能轮换）

## 命令

```powershell
# 1) 切件（改 part-spec.json 里的 bbox 后重跑）
D:\miniconda3\envs\samcut\python.exe tools\live2d\cut_sam.py tools\live2d\part-spec.json
# 2) 掩膜后处理 + 派生层
D:\miniconda3\envs\samcut\python.exe tools\live2d\post_masks.py tools\live2d\part-spec.json
# 3) 建模型并导出
$env:PSD2LIVE_TOKEN='<从 PSD2Live 界面复制>'
node tools\live2d\build_model.mjs tools\live2d\part-spec.json
```

`--dry` 只打印层计划不写；`--token=` 可直接传 token。

## 换角色时怎么调 bbox

1. 先用 `head-grid` 之类的坐标网格图量出各部件位置（本项目里做过：把头区裁出来叠 10px 网格并标 1024 坐标）
2. 眼睛/嘴这类小件 bbox 要留 8~12px 余量
3. 头发层记得 `dilate:0, close:2, fillHoles:true`；其它层 `dilate:4`
4. 跑 `--dry` 看层序，确认遮挡关系（后发→裙→腿→衣→脸→眉→眼→闭眼→嘴→前发→头饰）

---

# 具体使用步骤（从零到桌宠里能跑）

## 第 0 步：准备素材

- 一张**正面全身立绘**，透明底 PNG，建议 1024×1024（画布尺寸决定后面所有 bbox 的坐标系）
- 放到 `tools/live2d/character.png`（或改 `part-spec.json` 里的 `source`）

## 第 1 步：装 MobileSAM（一次性，约 5 分钟）

```powershell
conda create -y -n samcut python=3.10
D:\miniconda3\envs\samcut\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
D:\miniconda3\envs\samcut\python.exe -m pip install timm git+https://github.com/ChaoningZhang/MobileSAM.git
# 权重（约 40MB）放到 tools/live2d/mobile_sam.pt
Invoke-WebRequest https://github.com/ChaoningZhang/MobileSAM/raw/master/weights/mobile_sam.pt -OutFile tools\live2d\mobile_sam.pt
```

验证：`D:\miniconda3\envs\samcut\python.exe -c "from mobile_sam import sam_model_registry; print('ok')"`

## 第 2 步：改 `part-spec.json`

只有三处要动：
- `source` / `canvas`：素材路径与画布尺寸
- `parts[].box`：每个部件的 `[x0, y0, x1, y1]`（**这是全流程唯一需要人工量的东西**）
- `parts[].role`：喂给 PSD2Live 的语义（`front_hair` / `back_hair` / `face` / `eyewhite` / `mouth` / `topwear` / `bottomwear` / `legwear` / `headwear` / `eyebrow` …）

先跑一次计划确认层序：

```powershell
node tools\live2d\build_model.mjs tools\live2d\part-spec.json --dry
```

应打印 12 行层计划（10 个部件 + residual + eye_close），顺序 = 遮挡顺序（后→前）。

## 第 3 步：切件

```powershell
D:\miniconda3\envs\samcut\python.exe tools\live2d\cut_sam.py tools\live2d\part-spec.json
```

输出 `<outDir>/mask-*.png`，每行打印 `px`（不透明像素数）与 `score`（SAM 置信度）。
**判据**：`px` 明显小于原图不透明像素（约 26 万），`score > 0.5`；某件 `px` 接近整图说明框太松，回去收 bbox。

## 第 4 步：掩膜后处理 + 派生层

```powershell
D:\miniconda3\envs\samcut\python.exe tools\live2d\post_masks.py tools\live2d\part-spec.json
```

输出 `out/part-*.png` 与 `out/anchored/part-*.png`（后者四角有锚点，防导入被居中）。
会额外打印 `residual`（补洞层）和 `eye_close`（闭眼层，含采到的 `skin` 色值）。

**判据**：`skin` 应是浅肤色（如 `(253, 236, 233)`）；若是蓝紫色说明采到了头发，检查 `eyeClose` 的采样带。

## 第 5 步：建模型并导出

先确认 PSD2Live 桌面端在跑，从它界面复制 token：

```powershell
$env:PSD2LIVE_TOKEN='<界面里的 Bearer token>'
node tools\live2d\build_model.mjs tools\live2d\part-spec.json
```

依次打印 `[mcp]` → `[project]` → `[classify]` → `[rig]` → `[blink]` → `[export:moc3]` → `[export:web]`。
正常结束会看到 `[done]`；`losses` 里可能有一条 `DeformHairBackFollow ... 4-axis keyform grid`，属预期近似。

## 第 6 步：把 web 导出物收进插件

```powershell
node tools\live2d\package_assets.mjs E:\dsnworkspace\dsh-live2d-own\export-web own
```

产物：`assets/live2d/own/{index.html, p2l.js, p2l_runtime.wasm, own.p2lrt}`。
⚠️ `.p2lrt` 约 10MB，会显著增大插件包；如果不想进包，改成首次运行下载或放到用户目录。

## 第 7 步：在桌宠里选它

刷新 GUI → 右键桌宠 → 选 **「自定义模型」**（`live2d-own`）。

- 资产还没上线时（插件 Node 半还没有静态路由），用浏览器控制台临时指到本地服务：
  ```js
  localStorage['pet-whale:p2l-base'] = 'http://127.0.0.1:5203/'
  localStorage['pet-whale:p2l-model'] = 'Generated_artwork.p2lrt'
  ```
  起本地服务（把 export-web 目录挂出来，允许 CORS）：
  ```powershell
  # 任选一个静态服务器，例如
  npx --yes http-server E:\dsnworkspace\dsh-live2d-own\export-web -p 5203 --cors
  ```

## 第 8 步：验收（别只看默认姿态）

| 检查 | 做法 | 期望 |
| --- | --- | --- |
| 加载 | 选中宠物后看控制台 | 无 `p2l 模型加载失败` |
| 眨眼 | `window.__petWhaleP2L.player.play('Blink')` | 眼睛闭合（有眼睑线） |
| 转头/视线 | 鼠标在模型上移动 | 头部/视线跟随 |
| 点击 | 点头部 | 播 `Nod`；点其它部位播 `Shake` |
| 口型 | `window.__petWhaleP2L.setMouth(1)` | 张嘴（后续接 dsh-tts 的 durationMs） |
| 表情 | `window.__petWhaleP2L.expression('smile')` | 切换表情 |

## 常见故障

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 12 层全叠在画布中央 | 导入时被裁边居中 | 确认用的是 `out/anchored/part-*.png`（四角锚点像素） |
| 头发边缘锯齿/碎片 | 头发层被膨胀 / SAM 孔洞 | 头发 `dilate:0, close:2, fillHoles:true`；其它层才膨胀 |
| 裙前/腿间露白 | 未被任何层覆盖 | 保留 `residual` 派生层（且别把它膨胀到轮廓外） |
| 眨眼压成白块 | 按颜色拆眼睛后各自变形 | 眼睛保持**单层**，闭眼靠 `eye_close` 补片 |
| `ParamEyeLOpen=0` 无变化 | keyform 没写或被父 warp 覆盖 | 用 `spec.rig.blink` 同时写 warp + mesh；或直接靠 `eye_close` 的 lid-fade |
| `_currentFrameNo` undefined | pixi-live2d-display 0.5.0-beta 的 framework 太旧 | 改用 p2l 运行时（本目录） |
| 刷新后模型没了 | 静态服务是临时进程 | 把 `package_assets` 产物放进插件资产目录并起插件静态路由 |

