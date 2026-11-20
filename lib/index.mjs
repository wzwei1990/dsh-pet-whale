import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { dirname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
//#region src/index.mjs
const here = dirname(fileURLToPath(import.meta.url));
/**
* 表情/动作事件队列：`pet_react` 工具写入，客户端轮询取走。
* 不在回复正文里写内联标签（会污染工作回复），改用工具 + 事件通道。
*/
const PKG_ROOT = resolve(here, "..");
const DESKTOP_STATE_DIR = join(process.env.DSH_HOME || join(homedir(), ".dsh"), "dsh-pet");
const DESKTOP_STATE_FILE = join(DESKTOP_STATE_DIR, "desktop.json");
const ELECTRON_STAMP = join(process.env.DSH_HOME || join(homedir(), ".dsh"), "pet-whale", "electron", "version.txt");
let desktopChild = null;
let desktopSince = 0;
let desktopError = null;
const readDesktopState = () => {
	try {
		return JSON.parse(readFileSync(DESKTOP_STATE_FILE, "utf8"));
	} catch {
		return {};
	}
};
const writeDesktopState = (value) => {
	try {
		mkdirSync(DESKTOP_STATE_DIR, { recursive: true });
		writeFileSync(DESKTOP_STATE_FILE, JSON.stringify(value));
	} catch {}
};
const desktopRunning = () => desktopChild !== null && desktopChild.exitCode === null;
const desktopStatus = () => ({
	running: desktopRunning(),
	pid: desktopChild?.pid ?? null,
	since: desktopSince,
	preparing: desktopRunning() && !existsSync(ELECTRON_STAMP),
	error: desktopError
});
const stopDesktop = () => {
	if (!desktopRunning()) {
		desktopChild = null;
		desktopSince = 0;
		writeDesktopState({ desired: false });
		return desktopStatus();
	}
	const pid = desktopChild.pid;
	try {
		if (process.platform === "win32") spawnSync("taskkill", [
			"/pid",
			String(pid),
			"/T",
			"/F"
		], {
			stdio: "ignore",
			windowsHide: true
		});
		else desktopChild.kill("SIGTERM");
	} catch (error) {
		desktopError = error instanceof Error ? error.message : String(error);
	}
	desktopChild = null;
	desktopSince = 0;
	writeDesktopState({ desired: false });
	return desktopStatus();
};
const startDesktop = (log) => {
	if (desktopRunning()) return desktopStatus();
	desktopError = null;
	try {
		const child = spawn(process.execPath, [join(PKG_ROOT, "scripts", "start-desktop.mjs")], {
			cwd: PKG_ROOT,
			env: {
				...process.env,
				PET_WHALE_ROOT: PKG_ROOT
			},
			stdio: "ignore",
			windowsHide: true
		});
		desktopChild = child;
		desktopSince = Date.now();
		writeDesktopState({ desired: true });
		log?.("info", "桌面端桌宠已启动 pid=" + String(child.pid));
		child.once("error", (error) => {
			desktopError = error instanceof Error ? error.message : String(error);
			desktopChild = null;
			desktopSince = 0;
			writeDesktopState({ desired: false });
			log?.("warn", "桌面端启动失败: " + desktopError);
		});
		child.once("exit", (code) => {
			if (desktopChild === child) {
				desktopChild = null;
				desktopSince = 0;
			}
			writeDesktopState({ desired: false });
			log?.("info", "桌面端已退出 code=" + String(code));
		});
	} catch (error) {
		desktopError = error instanceof Error ? error.message : String(error);
		log?.("warn", "桌面端启动失败: " + desktopError);
	}
	return desktopStatus();
};
const reactions = [];
let reactionSeq = 0;
const REACTION_LIMIT = 50;
/**
* 资产查找顺序（先包内、后用户目录）：
* 1. <包>/assets/live2d            —— 走本地 tgz/内置模型时用（仓库默认不含，见 .gitignore 说明）
* 2. $DSH_HOME/dsh-pet/live2d      —— 从 GitHub 安装时的推荐位置：用户自己把
*    {p2l.js, p2l_runtime.wasm, <name>.p2lrt} 丢进来即可，模型不必进仓库
*/
const DSH_DIR = process.env.DSH_HOME || join(homedir(), ".dsh");
const ASSET_ROOTS = [resolve(here, "../assets/live2d"), resolve(DSH_DIR, "dsh-pet", "live2d")];
/** 精灵帧素材根：包内 assets/sprite（默认 8 个动作）+ 用户目录 dsh-pet/sprite（可放全量 1040 个） */
const SPRITE_ROOTS = [resolve(here, "../assets/sprite"), resolve(DSH_DIR, "dsh-pet", "sprite")];
/** moc3 素材根：包内 assets/moc3（只放运行时，模型体量大不入库）+ 用户目录 dsh-pet/moc3（放模型） */
const MOC3_ROOTS = [resolve(here, "../assets/moc3"), resolve(DSH_DIR, "dsh-pet", "moc3")];
/**
* 打日志。
* 2026-11 实测：这个宿主的 `ctx.logger` 存在，但 info 级别不落 stdout（写去了别处），
* 所以"有 logger 就用 logger"等于静默——dsh-tts 那些能看到的 `[dsh-tts][info] …`
* 恰好是它的 console.log 兜底。这里改成**永远打 console.log**，
* 再把同一条转给宿主 logger（它要过滤就过滤，不影响可见性）。
*/
function log(ctx, level, message) {
	const line = "[pet-whale][" + level + "] " + message;
	console.log(line);
	try {
		if (typeof ctx?.logger === "function") ctx.logger(level, "[pet-whale] " + message);
	} catch {}
}
const MIME = {
	".js": "application/javascript; charset=utf-8",
	".mjs": "application/javascript; charset=utf-8",
	".wasm": "application/wasm",
	".p2lrt": "application/octet-stream",
	".json": "application/json; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".png": "image/png",
	".webp": "image/webp"
};
const name = "pet-whale";
/** webServer 用于给自制模型资产挂静态路由；没它时客户端仍可用（只是拿不到模型） */
const inject = ["webServer", "tools"];
/**
* 具名导出 apply + 保留 default：cordis 若把入口当**裸函数**（default）解析，
* 模块级的 `inject` 不会被采纳 → 访问 ctx.webServer 抛
* `cannot get property "webServer" without inject`，或（加了兜底后）静默跳过、路由不注册。
* 所以把 inject/name 同时挂到函数对象上，两种解析方式都能读到（2026-11 实测）。
*/
function apply(ctx) {
	let webServer;
	try {
		webServer = ctx?.webServer;
	} catch {
		webServer = void 0;
	}
	if (!webServer) try {
		webServer = ctx?.get?.("webServer");
	} catch {
		webServer = void 0;
	}
	try {
		const tools = ctx?.tools;
		if (tools?.register) {
			tools.register({
				name: "pet_react",
				description: "让桌面宠物做一个额外的表情/动作（agent 状态已有自动动画，这里用于补充情绪）：celebrate 庆祝、think 思考、working 忙碌、wait 等待、shy 害羞、error 出错。默认插播 6 秒后回待机；长任务用 hold:true 保持，任务结束后再调 idle（或新的情绪）解除。不要为此在回复正文里写标记。",
				parameters: {
					type: "object",
					properties: {
						emotion: {
							type: "string",
							enum: [
								"celebrate",
								"think",
								"working",
								"wait",
								"shy",
								"error",
								"sleep",
								"wake",
								"balance-rich",
								"balance-normal",
								"balance-empty",
								"idle"
							],
							description: "要做哪种表情/动作；idle = 回待机"
						},
						text: {
							type: "string",
							description: "可选：她头顶气泡里显示的一句话"
						},
						hold: {
							type: "boolean",
							description: "true = 一直保持这个动作，直到下次调用（长任务用）"
						},
						durationMs: {
							type: "number",
							description: "可选：保持多少毫秒（默认 6000；hold=true 时忽略）"
						}
					},
					required: ["emotion"],
					additionalProperties: false
				},
				output: {
					schema: { type: "string" },
					render: (_args, value) => [{
						type: "text",
						text: String(value)
					}]
				},
				async execute(args) {
					const emotion = String(args?.emotion ?? "");
					if (![
						"celebrate",
						"think",
						"working",
						"wait",
						"shy",
						"error",
						"idle"
					].includes(emotion)) throw new Error("未知表情：" + emotion);
					const hold = args?.hold === true;
					const durationMs = typeof args?.durationMs === "number" && Number.isFinite(args.durationMs) ? Math.max(300, Math.min(6e5, args.durationMs)) : 6e3;
					reactionSeq += 1;
					reactions.push({
						seq: reactionSeq,
						emotion,
						text: typeof args?.text === "string" ? args.text : "",
						hold,
						durationMs,
						at: Date.now()
					});
					while (reactions.length > REACTION_LIMIT) reactions.shift();
					return "宠物做出了「" + emotion + "」动作";
				}
			});
			log(ctx, "info", "已注册 pet_react 工具");
		}
	} catch (error) {
		log(ctx, "warn", "注册 pet_react 失败：" + (error instanceof Error ? error.message : String(error)));
	}
	let lastBalance = {
		level: "",
		text: "",
		at: 0
	};
	try {
		const costMeter = typeof ctx?.get === "function" ? ctx.get("costMeter") : void 0;
		if (costMeter?.getState !== void 0) {
			const pick = (state) => {
				const b = state?.balance ?? {};
				const total = typeof b.totalBalance === "number" ? b.totalBalance : void 0;
				if (b.status === "off" || total === void 0) return null;
				const budgetCfg = state?.config?.budget ?? {};
				const budgetCap = budgetCfg.enabled !== false && typeof budgetCfg.amount === "number" ? budgetCfg.amount : 0;
				const budgetUsed = typeof state?.budgetUsed === "number" ? state.budgetUsed : 0;
				const remaining = budgetCap > 0 ? Math.max(0, budgetCap - budgetUsed) : null;
				let ratio = null;
				if (remaining !== null) ratio = remaining / budgetCap;
				else if (typeof b.budgetCap === "number" && b.budgetCap > 0) ratio = total / b.budgetCap;
				const level = ratio === null ? total <= 0 ? "balance-empty" : "balance-normal" : ratio >= .6 ? "balance-rich" : ratio >= .2 ? "balance-normal" : "balance-empty";
				const unit = b.currency ?? "";
				return {
					level,
					text: remaining !== null ? unit + " " + total.toFixed(2) + "（预算剩 " + Math.round(ratio * 100) + "%：" + remaining.toFixed(2) + "/" + budgetCap + "）" : unit + " " + total.toFixed(2) + (ratio === null ? "" : "（" + Math.round(ratio * 100) + "%）")
				};
			};
			const check = async () => {
				try {
					const state = await costMeter.getState();
					const info = pick(state);
					if (info === null) return;
					if (info.level === lastBalance.level) return;
					lastBalance = {
						level: info.level,
						text: info.text,
						at: Date.now()
					};
					reactionSeq += 1;
					reactions.push({
						seq: reactionSeq,
						emotion: info.level,
						text: info.text,
						hold: false,
						durationMs: 8e3,
						at: Date.now()
					});
					while (reactions.length > REACTION_LIMIT) reactions.shift();
				} catch (error) {
					log(ctx, "debug", "余额查询失败：" + (error instanceof Error ? error.message : String(error)));
				}
			};
			setInterval(() => void check(), 5 * 6e4).unref?.();
			setTimeout(() => void check(), 15e3).unref?.();
			log(ctx, "info", "已接入余额联动（ctx.costMeter，5 分钟检查一次，档位变化才播动作）");
		} else log(ctx, "info", "未发现 dsh-cost-meter，余额联动关闭");
	} catch (error) {
		log(ctx, "debug", "余额联动不可用：" + (error instanceof Error ? error.message : String(error)));
	}
	if (!webServer?.register) {
		log(ctx, "warn", "宿主未提供 webServer，跳过 /pet-whale/live2d 路由（自制模型将 404）");
		return;
	}
	/**
	* 造一个静态文件 handler：只服务 roots 内的文件、只放行白名单扩展名、拒绝 ../ 穿越。
	* 形状对齐 dsh-tts 上验证过的 register({ path, handler })——之前多带 kind:'prefix' 会静默不生效。
	*/
	const staticHandler = (prefix, roots) => (req, res) => {
		const url = new URL(req.url ?? "/", "http://localhost");
		let rel;
		try {
			rel = decodeURIComponent(url.pathname.replace(new RegExp("^" + prefix), ""));
		} catch {
			res.writeHead(400);
			res.end("bad path");
			return;
		}
		const ext = rel.slice(rel.lastIndexOf(".")).toLowerCase();
		const type = MIME[ext];
		if (!type) {
			res.writeHead(403);
			res.end("forbidden type");
			return;
		}
		let target = null;
		let stat = null;
		for (const root of roots) {
			const candidate = normalize(join(root, rel));
			if (!candidate.startsWith(root + sep) && candidate !== root) continue;
			try {
				const s = statSync(candidate);
				if (!s.isFile()) continue;
				target = candidate;
				stat = s;
				break;
			} catch {}
		}
		if (!target || !stat) {
			res.writeHead(404);
			res.end("not found");
			return;
		}
		const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
		if (req.headers["if-none-match"] === etag) {
			res.writeHead(304, { ETag: etag });
			res.end();
			return;
		}
		res.writeHead(200, {
			"Content-Type": type,
			"Content-Length": stat.size,
			ETag: etag,
			"Cache-Control": "no-cache",
			"Cross-Origin-Resource-Policy": "same-origin"
		});
		createReadStream(target).pipe(res);
	};
	/**
	* 安装一个素材包 zip：解压 → 找含 manifest.json / pack.json 的目录 → 放到
	* $DSH_HOME/dsh-pet/{sprite|moc3}/<id>；重名自动加 -2/-3，绝不覆盖已有包。
	* 解压用系统 tar（Windows 10+ 自带 bsdtar，支持 zip）；失败再试 unzip。
	*/
	const installPackZip = (buffer) => {
		const work = mkdtempSync(join(tmpdir(), "pet-pack-"));
		try {
			const zipPath = join(work, "pack.zip");
			writeFileSync(zipPath, buffer);
			const outDir = join(work, "out");
			mkdirSync(outDir);
			let extracted = spawnSync("tar", [
				"-xf",
				zipPath,
				"-C",
				outDir
			], { windowsHide: true });
			if (extracted.status !== 0) extracted = spawnSync("unzip", [
				"-o",
				"-q",
				zipPath,
				"-d",
				outDir
			], { windowsHide: true });
			if (extracted.status !== 0) throw new Error("解压失败（需要系统 tar 或 unzip 可用）");
			const findPackDir = (dir) => {
				if (existsSync(join(dir, "manifest.json"))) return {
					dir,
					kind: "sprite"
				};
				if (existsSync(join(dir, "pack.json"))) return {
					dir,
					kind: "moc3"
				};
				for (const name of readdirSync(dir)) {
					const child = join(dir, name);
					try {
						if (!statSync(child).isDirectory()) continue;
					} catch {
						continue;
					}
					const found = findPackDir(child);
					if (found) return found;
				}
				return null;
			};
			const found = findPackDir(outDir);
			if (!found) throw new Error("zip 里没有找到 manifest.json 或 pack.json");
			const meta = found.kind === "sprite" ? JSON.parse(readFileSync(join(found.dir, "manifest.json"), "utf8")).meta ?? null : JSON.parse(readFileSync(join(found.dir, "pack.json"), "utf8")).meta ?? null;
			const root = found.kind === "sprite" ? SPRITE_ROOTS[1] : MOC3_ROOTS[1];
			mkdirSync(root, { recursive: true });
			const base = found.dir.split(/[\\/]/).pop() || "pack";
			let id = base;
			for (let n = 2; existsSync(join(root, id)); n++) id = base + "-" + n;
			const dest = join(root, id);
			try {
				renameSync(found.dir, dest);
			} catch {
				if (spawnSync("cp", [
					"-R",
					found.dir,
					dest
				], { windowsHide: true }).status !== 0) throw new Error("安装失败：无法移动目录（跨盘符且没有 cp）");
			}
			return {
				ok: true,
				kind: found.kind,
				id,
				meta
			};
		} finally {
			try {
				rmSync(work, {
					recursive: true,
					force: true
				});
			} catch {}
		}
	};
	/**
	* 包元数据清单：读取每个素材包的 meta（name/version/author/license/source）。
	* 精灵包读 manifest.json 的 meta；moc3 包读 pack.json 的 meta。
	* 用途：许可透明（禁止再分发的模型不会悄悄进包）、以后做导入时判断重名不覆盖。
	*/
	const listPacks = () => {
		const out = [];
		const readJson = (file) => {
			try {
				return JSON.parse(readFileSync(file, "utf8"));
			} catch {
				return null;
			}
		};
		for (const root of SPRITE_ROOTS) {
			let names = [];
			try {
				names = readdirSync(root);
			} catch {
				continue;
			}
			for (const name of names) {
				const manifest = readJson(join(join(root, name), "manifest.json"));
				if (!manifest) continue;
				out.push({
					kind: "sprite",
					id: name,
					root,
					meta: manifest.meta ?? null,
					animations: Array.isArray(manifest.animations) ? manifest.animations.length : 0
				});
			}
		}
		for (const root of MOC3_ROOTS) {
			let names = [];
			try {
				names = readdirSync(root);
			} catch {
				continue;
			}
			for (const name of names) {
				const pack = readJson(join(join(root, name), "pack.json"));
				if (!pack) continue;
				out.push({
					kind: "moc3",
					id: name,
					root,
					meta: pack.meta ?? null
				});
			}
		}
		return out;
	};
	webServer.register({
		path: "/pet-whale/api/desktop",
		handler: (req, res) => {
			if ((req.method ?? "GET") === "POST") {
				let body = "";
				req.on("data", (chunk) => {
					body += chunk;
					if (body.length > 2048) req.destroy();
				});
				req.on("end", () => {
					let action = "";
					try {
						action = String(JSON.parse(body).action ?? "");
					} catch {
						action = "";
					}
					if (action === "start") startDesktop((level, msg) => log(ctx, level, msg));
					else if (action === "stop") stopDesktop();
					res.writeHead(200, {
						"Content-Type": "application/json; charset=utf-8",
						"Cache-Control": "no-store"
					});
					res.end(JSON.stringify(desktopStatus()));
				});
				return;
			}
			res.writeHead(200, {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store"
			});
			res.end(JSON.stringify(desktopStatus()));
		}
	});
	try {
		if (readDesktopState().desired === true && existsSync(ELECTRON_STAMP)) setTimeout(() => startDesktop((level, msg) => log(ctx, level, msg)), 2500);
	} catch {}
	let presence = {
		state: "idle",
		sessions: 0,
		at: 0
	};
	webServer.register({
		path: "/pet-whale/api/presence",
		handler: (req, res) => {
			if ((req.method ?? "GET") === "POST") {
				let body = "";
				req.on("data", (chunk) => {
					body += chunk;
					if (body.length > 4096) req.destroy();
				});
				req.on("end", () => {
					try {
						const data = JSON.parse(body);
						if ((/* @__PURE__ */ new Set([
							"idle",
							"think",
							"working",
							"wait",
							"celebrate",
							"error"
						])).has(data.state)) presence = {
							state: data.state,
							sessions: Number.isFinite(data.sessions) ? Math.max(0, Math.trunc(data.sessions)) : 0,
							at: Date.now()
						};
					} catch {}
					res.writeHead(204).end();
				});
				return;
			}
			res.writeHead(200, {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store"
			});
			res.end(JSON.stringify(presence));
		}
	});
	webServer.register({
		path: "/pet-whale/api/packs",
		handler: (req, res) => {
			if (new URL(req.url ?? "/", "http://localhost").pathname.endsWith("/import")) {
				if ((req.method ?? "GET") !== "POST") {
					res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
					res.end("POST a zip body to install a pack");
					return;
				}
				const chunks = [];
				let size = 0;
				req.on("data", (chunk) => {
					size += chunk.length;
					if (size > 80 * 1024 * 1024) {
						req.destroy();
						return;
					}
					chunks.push(chunk);
				});
				req.on("end", () => {
					try {
						const result = installPackZip(Buffer.concat(chunks));
						res.writeHead(200, {
							"Content-Type": "application/json; charset=utf-8",
							"Cache-Control": "no-store"
						});
						res.end(JSON.stringify(result));
					} catch (error) {
						res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
						res.end(JSON.stringify({
							ok: false,
							error: error instanceof Error ? error.message : String(error)
						}));
					}
				});
				return;
			}
			res.writeHead(200, {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store"
			});
			res.end(JSON.stringify({ packs: listPacks() }));
		}
	});
	webServer.register({
		path: "/pet-whale/api/balance",
		handler: (req, res) => {
			res.writeHead(200, {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store"
			});
			res.end(JSON.stringify({ lastBalance }));
		}
	});
	webServer.register({
		path: "/pet-whale/api/reactions",
		handler: (req, res) => {
			const url = new URL(req.url ?? "/", "http://localhost");
			const since = Number(url.searchParams.get("since") ?? "0");
			const items = reactions.filter((r) => r.seq > (Number.isFinite(since) ? since : 0));
			const body = JSON.stringify({
				items,
				cursor: reactionSeq
			});
			res.writeHead(200, {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store"
			});
			res.end(body);
		}
	});
	webServer.register({
		path: "/pet-whale/live2d",
		handler: staticHandler("/pet-whale/live2d", ASSET_ROOTS)
	});
	webServer.register({
		path: "/pet-whale/sprite",
		handler: staticHandler("/pet-whale/sprite", SPRITE_ROOTS)
	});
	webServer.register({
		path: "/pet-whale/moc3",
		handler: staticHandler("/pet-whale/moc3", MOC3_ROOTS)
	});
	log(ctx, "info", "已挂载 /pet-whale/live2d/*、/pet-whale/sprite/*、/pet-whale/moc3/*（模型/精灵帧/Cubism 运行时）");
}
apply.inject = inject;
//#endregion
export { apply, apply as default, inject, name };
