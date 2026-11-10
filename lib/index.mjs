import { createReadStream, statSync } from "node:fs";
import { dirname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
//#region src/index.mjs
const ASSET_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../assets/live2d");
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
function apply(ctx) {
	const webServer = ctx?.webServer;
	if (!webServer?.register) {
		ctx?.logger?.("debug", "[pet-whale] 宿主未提供 webServer，跳过 /pet-whale/live2d 路由（自制模型将 404）");
		return;
	}
	webServer.register({
		kind: "prefix",
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
			const target = normalize(join(ASSET_ROOT, rel));
			if (!target.startsWith(ASSET_ROOT + sep) && target !== ASSET_ROOT) {
				res.writeHead(403);
				res.end("forbidden");
				return;
			}
			const ext = target.slice(target.lastIndexOf(".")).toLowerCase();
			const type = MIME[ext];
			if (!type) {
				res.writeHead(403);
				res.end("forbidden type");
				return;
			}
			let stat;
			try {
				stat = statSync(target);
				if (!stat.isFile()) throw new Error("not a file");
			} catch {
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
	ctx?.logger?.("info", "[pet-whale] 已挂载 /pet-whale/live2d/*（自制 Live2D 模型资产）");
}
//#endregion
export { apply as default, inject, name };
