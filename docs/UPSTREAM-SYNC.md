# 跟上游同步（本地改造过之后，线上又更新了）

本仓库是 `nzl153/dsh-pet-whale` 的本地改造版：你的改动都在 `feat/multi-pet` 分支上，
`main` 保持与上游一致。上游更新时按下面的流程走一遍即可，全程约 2 分钟。

## 一句话方案

```powershell
cd E:\dsnworkspace\dsh-pet-whale
git fetch origin
git switch feat/multi-pet
git merge origin/main          # 上游更新并进来
pnpm install                   # 上游可能加了依赖
pnpm pet:doctor                # 体检：这次合并有没有把改造弄坏
pnpm typecheck; pnpm test; pnpm build
# 最后重启 dsh web
```

## 0. 先看清上游改了什么（只读，不动你的工作区）

```powershell
git fetch origin
git log --oneline main..origin/main      # 上游的新提交
git diff --stat main origin/main         # 都动了哪些文件
```

> 当前是**浅克隆**（`git rev-parse --is-shallow-repository` = true）。合并本身没问题
> （分叉点 `8ed73aa` 就在本地），但想完整看历史/blame 时补一次即可（仓库很小，几秒）：
> ```powershell
> git fetch --unshallow origin
> ```

## 1. 合并（推荐先备份、先试）

```powershell
git branch backup/pre-upstream-$(Get-Date -Format yyyyMMdd)   # 出事一键回滚
git switch feat/multi-pet
git merge origin/main
```

- **用 merge 而不是 rebase**：`feat/multi-pet` 是长期分支，且本机是 `link:` 安装、
  浏览器里正跑着这个工作区；merge 不改写历史，出问题 `git merge --abort` 就退回去了。
- 想先试再合：`git switch -c try-upstream && git merge origin/main`，试好了再切回来合。

## 2. 冲突对照表（按我改过的位置排列）

| 文件 | 概率 | 怎么处理 |
|---|---|---|
| `lib/client.js` | 高 | **别手合**（这是构建产物）。随便取一边，然后 `pnpm build` 重新生成 |
| `src/client/styles.ts` | 中 | 上游若往这里加宠物私有规则，要搬进 `src/client/pets/whale/styles.ts`。`pnpm pet:doctor` 会点名具体行号 |
| `src/client/index.ts` | 中 | 保留这 7 处改造：两张 `<style>` 注入、`applyPet`、`strings` 重算、宠物菜单、aria、导入、dispose 清理 |
| `src/client/i18n.ts` | 中 | 通常只是相邻插入：**两边都留**（我加的是 `PetTextOverrides` / `getStrings` 第二参数 / 新文案键） |
| `src/client/whale.ts` | 中 | 生成物。取上游版本更省事：`git checkout --theirs src/client/whale.ts` 后 `node scripts/extract-whale.mjs`，再 `git diff` 确认没把不该删的删掉 |
| `preview.html` | 中 | 我的注入都在 `<!-- pet-xxx:begin/end -->` 标记区里（pet2 之后、主 `<script>` 之前），标记外的手写部分按上游改；合完跑 `pnpm sync:preview` |
| `tests/smoke.mjs` | 低 | 我的断言在后面一段，通常两边都留；合完必须 `pnpm test` |
| `README.md` / `README.en.md` / `package.json` / `.gitignore` | 低 | 两边都留 |
| `src/client/pets/**`、`scripts/doctor.mjs`、`scripts/sync-preview-pets.mjs`、`docs/**` | 极低 | 上游没有这些文件，基本不会冲突 |

## 3. 体检：`pnpm pet:doctor`

合并之后跑这一条，它会只读地检查"改造最容易悄悄坏掉的 4 件事"：

```
OK    BASE_CSS 干净（styles.ts 里没有宠物私有选择器）
OK    宠物 cat：文件齐全、已注册、关键帧无冲突
WARN  pets/whale 没有 markup.ts（SVG 来自别处，例如生成物，属正常）
OK    宠物 whale：文件齐全、已注册、关键帧无冲突
OK    preview.html 注入标记齐全，数据脚本位置正确
OK    preview.html 注入区与 src 同步
OK    whale.ts 与 preview.html 的 V2 一致
OK    lib/client.js 比 src/ 新（构建产物不过期）
体检结果：0 项失败，1 项提示
```

| 检查 | 为什么需要 |
|---|---|
| BASE_CSS 里不能有宠物私有选择器 | 上游往 `styles.ts` 加状态动画是常态；那些规则必须搬进 `pets/whale/styles.ts`，否则换宠物时会串规则（比如猫被鲸鱼的 `pw-swim` 带着动） |
| 宠物文件/注册/keyframes 前缀 | 新宠物漏注册、或用了 `pw-` 前缀（会与 BASE_CSS 的关键帧撞名） |
| preview.html 注入区是否与 src 同步 | 上游改了预览页、或你改了宠物样式但忘了 `pnpm sync:preview` |
| `whale.ts` ↔ `preview.html` V2 是否一致 | 历史上这里就不一致过：V2 少了 `.angry-eyes`，跑 `pnpm extract` 会**悄悄删掉**闹脾气的吊眉眼 |
| `lib/client.js` 是否比 `src/` 旧 | 改了源码忘了构建，DSH 里看到的还是旧行为 |

失败项都带行号和修复命令；`pet:doctor` 只读，不会改任何文件。

## 4. 生效

- client 改动：`pnpm dev` 在跑的话会自动重建并被 DSH 热重载；否则 `pnpm build` 后重启 dsh web。
- 上游如果动了 `package.json` 的 `dsh.client` / `cordis.patch.yml` / profile bundles：
  **必须重启 dsh web**（README 的 Hot Reload 一节有说明）。

## 5. 三种"线上更新"分别是哪种

| 情况 | 你会收到吗 | 怎么办 |
|---|---|---|
| GitHub `main` 有新提交 | 不会自动收到 | 上面的 merge 流程 |
| 上游发了 npm 新版本 | 不会——本机是 `link:` 安装，不是 registry 副本 | 想拿就用 `git fetch --tags` 找到对应 tag 后 merge；或临时装回 registry 版（会丢你的改造，慎用）：`dsh plugin --profile web add pet-whale@latest --config.minimumReleaseAge=0` |
| 上游改了依赖 | `pnpm install` 时才知道 | 合并后先 `pnpm install` 再体检 |

> 顺带记一句：本机 web profile 有 `minimumReleaseAge` 白名单策略，profile 内的
> `dsh plugin add/update` 可能被供应链策略拦下；一次性绕过是给命令追加
> `--config.minimumReleaseAge=0`（不改策略文件）。

## 6. 回滚

```powershell
git merge --abort                              # 还在冲突里时
git reset --hard backup/pre-upstream-YYYYMMDD  # 已经合完但发现问题
pnpm install; pnpm build                       # 回到可用状态
```

## 7. 想装到别的机器 / 给别人用

`link:` 只在本机有效。要带走就复制整个仓库目录（含 `lib/client.js` 构建产物）或
`git archive` 打包，对方执行：

```powershell
dsh plugin --profile web add link:<仓库路径> --config.minimumReleaseAge=0
```

## 8. 推到自己的 fork（本仓库当前状态）

本仓库已经有一个 GitHub fork：`https://github.com/wzwei1990/dsh-pet-whale.git`
（本地克隆 `E:\mygit3\dsh-pet-whale`），工作副本里加了名为 `fork` 的 remote。

```powershell
# 日常：改动提交到 feat/multi-pet，然后推分支
git push fork feat/multi-pet

# 想让 fork 的默认分支 main 也是最新代码（本仓库的 main 与分支基线一致，属快进、无冲突）
git push fork feat/multi-pet:main

# 以后同步上游：把上游合并进分支，再推 fork
git fetch origin main; git merge origin/main; pnpm pet:doctor; pnpm test
git push fork feat/multi-pet; git push fork feat/multi-pet:main
```

> `fork` 的 main 与分支基线一致时才是快进。若哪天分叉了（例如上游重写了历史），
> 就别直接推 main，改成推分支、由自己在 GitHub 上决定怎么合。

## 9. 本 fork 的定位：独立维护，只进不出（2026-09-17 用户拍板）

- **只从上游同步**：定期 `git fetch origin && git merge origin/main`，按第 1~3 节的流程合进来
- **不向上游提 PR / 不向上游提交改动请求**：本仓库自己维护自己的功能（多宠物、灵儿、`pet:doctor`…），
  上游保持 maintenance-first，各走各的
- 版本号**与上游保持一致**（现在是 `1.1.2`）：上游发版就跟着改，这样"我这份落后多少"一眼能看出来
- 上游 README 里已经有一节 Community forks 推荐本仓库，属于互相引用，不是提交改动

需要发到 npm 的话，先改 `package.json` 的 `name` / `version`（别占用上游的包名）。
