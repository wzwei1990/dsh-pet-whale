import { createReadStream, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
//#region src/index.mjs
/**
* 资产查找顺序（先包内、后用户目录）：
* 1. <包>/assets/live2d            —— 走本地 tgz/内置模型时用（仓库默认不含，见 .gitignore 说明）
* 2. $DSH_HOME/dsh-pet/live2d      —— 从 GitHub 安装时的推荐位置：用户自己把
*    {p2l.js, p2l_runtime.wasm, <name>.p2lrt} 丢进来即可，模型不必进仓库
*/
const ASSET_ROOTS = [resolve(dirname(fileURLToPath(import.meta.url)), "../assets/live2d"), resolve(process.env.DSH_HOME || join(homedir(), ".dsh"), "dsh-pet", "live2d")];
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
	".png": "image/png"
};
const name = "pet-whale";
/** webServer 用于给自制模型资产挂静态路由；没它时客户端仍可用（只是拿不到模型） */
const inject = ["webServer"];
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
	if (!webServer?.register) {
		log(ctx, "warn", "宿主未提供 webServer，跳过 /pet-whale/live2d 路由（自制模型将 404）");
		return;
	}
	webServer.register({
		path: "/pet-whale/live2d",
		handler: (req, res) => {
			const url = new URL(req.url ?? "/", "http://localhost");
			let rel;
			try {
				rel = decodeURIComponent(url.pathname.replace(/^\/pet-whale\/live2d/, ""));
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
			for (const root of ASSET_ROOTS) {
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
				"Cache-Control": "public, max-age=86400",
				"Cross-Origin-Resource-Policy": "same-origin"
			});
			createReadStream(target).pipe(res);
		}
	});
	log(ctx, "info", "已挂载 /pet-whale/live2d/*（自制 Live2D 模型资产）");
}
apply.inject = inject;
//#endregion
export { apply, apply as default, inject, name };
