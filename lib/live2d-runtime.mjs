//#region src/client/pets/live2d/runtime.ts
/** MotionPriority.FORCE：用 FORCE 才盖得掉正在跑的待机动作（NORMAL 会被 reserve() 挡掉） */
const PRIORITY_FORCE = 3;
/** 三件 vendor 的加载顺序不能变：core → pixi → cubism4 */
const VENDOR = [
	"vendor/live2dcubismcore.min.js",
	"vendor/pixi.min.js",
	"vendor/cubism4.min.js"
];
let vendorPromise = null;
function loadScript(src) {
	return new Promise((resolve, reject) => {
		const el = document.createElement("script");
		el.src = src;
		el.async = false;
		el.onload = () => resolve();
		el.onerror = () => reject(/* @__PURE__ */ new Error(`加载失败：${src}`));
		document.head.appendChild(el);
	});
}
/** 只加载一次；失败允许重试（换个 base 的场景） */
function loadVendor(base) {
	if (vendorPromise) return vendorPromise;
	vendorPromise = (async () => {
		const w = window;
		w.process = w.process ?? {
			env: { NODE_ENV: "production" },
			platform: "browser"
		};
		for (const path of VENDOR) await loadScript(`${base}${path}`);
		if (!w.PIXI?.live2d) throw new Error("PIXI.live2d 未注册（vendor 包不对？应为 dist/cubism4.min.js）");
	})().catch((error) => {
		vendorPromise = null;
		throw error;
	});
	return vendorPromise;
}
/**
* 把 Live2D 模型挂到 el 里（自己建 canvas）。
* 返回销毁函数：切换宠物/卸载时必须调用，否则 PIXI 的 ticker 会一直跑。
*/
function mountLive2D(el, options) {
	const { base, model: modelPath, zoom = 1, offsetY = 0, tapGroup = "Tap" } = options;
	let disposed = false;
	let app = null;
	let model = null;
	let observer = null;
	let rafId = 0;
	const canvas = document.createElement("canvas");
	canvas.className = "pwh-l2d-canvas";
	canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none";
	el.appendChild(canvas);
	/** 盒子尺寸（宠物是绝对定位的，某些时刻可能是 0 → 兜 1px 防止 PIXI 建 0 尺寸缓冲 */
	const box = () => ({
		w: Math.max(1, Math.round(el.clientWidth || 1)),
		h: Math.max(1, Math.round(el.clientHeight || 1))
	});
	const fit = () => {
		if (!app || !model) return;
		const { w, h } = box();
		app.renderer.resize(w, h);
		const ow = model.internalModel.originalWidth;
		const oh = model.internalModel.originalHeight;
		const scale = Math.min(w / ow, h / oh) * zoom;
		model.scale.set(scale);
		model.x = (w - ow * scale) / 2;
		model.y = (h - oh * scale) / 2 + h * offsetY;
	};
	const playTap = () => {
		if (!model || tapGroup === false) return;
		const groups = model.internalModel.motionManager.definitions;
		if (!groups[tapGroup]?.length) return;
		const state = model.internalModel.motionManager.state;
		const n = groups[tapGroup].length;
		let index = Math.floor(Math.random() * n);
		if (state.currentGroup === tapGroup && n > 1) index = ((state.currentIndex ?? 0) + 1 + Math.floor(Math.random() * (n - 1))) % n;
		model.motion(tapGroup, index, PRIORITY_FORCE);
	};
	const onClick = (event) => {
		if (event.button !== 0) return;
		playTap();
	};
	el.addEventListener("click", onClick);
	const boot = async () => {
		await loadVendor(base);
		if (disposed) return;
		const PIXI = window.PIXI;
		PIXI.Ticker.shared.autoStart = true;
		PIXI.Ticker.shared.start();
		app = new PIXI.Application({
			view: canvas,
			width: box().w,
			height: box().h,
			backgroundAlpha: 0,
			antialias: true,
			autoDensity: true,
			autoStart: true
		});
		if (disposed) return;
		const loaded = await PIXI.live2d.Live2DModel.from(`${base}${modelPath}`, {
			autoInteract: false,
			autoUpdate: false
		});
		if (disposed) {
			loaded.destroy();
			return;
		}
		model = loaded;
		app.stage.addChild(loaded);
		app.renderer.on("prerender", () => {
			const core = model?.internalModel.coreModel;
			core?.setPartOpacityById("Part01ArmRB001", 0);
			core?.setPartOpacityById("Part01ArmLB001", 0);
		});
		fit();
		const mm = loaded.internalModel.motionManager;
		const idleGroup = mm.groups?.idle ?? "Idle";
		if (mm.definitions[idleGroup]?.length) loaded.motion(idleGroup);
		if (options.debug) window.__petWhaleLive2D = {
			app,
			model
		};
		app.ticker.add(() => {
			if (!model) return;
			if (document.visibilityState === "hidden") return;
			model.update(app.ticker.deltaMS);
		});
		observer = new ResizeObserver(fit);
		observer.observe(el);
	};
	boot().catch((error) => {
		console.error("[pet-whale] Live2D 挂载失败：", error);
	});
	return () => {
		disposed = true;
		cancelAnimationFrame(rafId);
		observer?.disconnect();
		el.removeEventListener("click", onClick);
		try {
			model?.destroy();
		} catch {}
		try {
			app?.destroy({ removeView: true });
		} catch {}
		canvas.remove();
		model = null;
		app = null;
	};
}
//#endregion
export { mountLive2D };
