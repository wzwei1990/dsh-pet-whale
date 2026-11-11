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
* 具名导出 apply：cordis 只在具名 apply 上应用模块的 `inject`。
* 只导出 default 时 `ctx.webServer` 会抛 `cannot get property "webServer" without inject`
* （2026-11 实测，对照 dsh-tts 的写法）。文件末尾同时保留 default 导出，供构建校验脚本使用。
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
		try {
			ctx?.logger?.("warn", "[pet-whale] 宿主未提供 webServer，跳过 /pet-whale/live2d 路由（自制模型将 404）");
		} catch {}
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
	try {
		ctx?.logger?.("info", "[pet-whale] 已挂载 /pet-whale/live2d/*（自制 Live2D 模型资产）");
	} catch {}
}
//#endregion
export { apply, apply as default, inject, name };
