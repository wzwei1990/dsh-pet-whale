//#region src/client/pets/sprite/pick.ts
function createPoolPicker(valid = () => true) {
	const bags = {};
	const lastPicked = {};
	const pick = (ids, key) => {
		const pool = (ids ?? []).filter(valid);
		if (pool.length === 0) return void 0;
		if (pool.length === 1) return pool[0];
		let bag = bags[key];
		if (bag !== void 0) {
			const allowed = new Set(pool);
			bag = bag.filter((id) => allowed.has(id));
			bags[key] = bag;
		}
		if (bag === void 0 || bag.length === 0) {
			bag = [...pool];
			for (let i = bag.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				const t = bag[i];
				bag[i] = bag[j];
				bag[j] = t;
			}
			if (bag[0] === lastPicked[key]) {
				const t = bag[0];
				bag[0] = bag[1];
				bag[1] = t;
			}
			bags[key] = bag;
		}
		const picked = bag.shift();
		if (picked !== void 0) lastPicked[key] = picked;
		return picked;
	};
	return {
		pick,
		bagOf: (key) => bags[key] ?? []
	};
}
/**
* 待机轮换决策（纯函数，可单测）。
*
* 关键约束：**永远 reschedule**。
* 之前的实现遇到"当前不是待机状态"或"池子只有 1 个"就直接 return，
* 定时器从此不再重排 → 待机动作永久卡在同一个上（2026-11-19 用户反馈）。
*/
function decideIdleRotation(input, pick) {
	const { lastTarget, pool, activities, idleId } = input;
	let rotations = input.rotations;
	if (pool.length === 0) return {
		rotations,
		reschedule: true
	};
	if (!(lastTarget === idleId || pool.includes(lastTarget) || activities.includes(lastTarget))) return {
		rotations,
		reschedule: true
	};
	rotations += 1;
	if (activities.length > 0 && rotations % 3 === 0) {
		const picked = pick(activities, "activity");
		if (picked !== void 0) return {
			play: picked,
			rotations,
			reschedule: true
		};
	}
	return {
		play: (pool.length <= 1 ? pool[0] : pick(pool, "idle") ?? idleId) ?? idleId,
		rotations,
		reschedule: true
	};
}
/**
* 防止"同一个动作连续播好几轮"：
* 洗牌袋与"进入待机时抽一次"共用袋子，偶尔会出现 pick 回来正好等于当前动作，
* 调用方若直接跳过播放，就会让这个动作再显示一整轮（表现成连续重复 2–3 次）。
* 这里保证返回值与 lastTarget 不同（池子只有一个时除外）。
*/
function avoidSame(play, lastTarget, pool, pick) {
	if (play !== lastTarget) return play;
	if (pool.length <= 1) return pool[0];
	const others = pool.filter((id) => id !== lastTarget);
	return pick(others, "idle") ?? others[0];
}
function computeFit(bbox, idleBox, canvasW, canvasH, maxContentHeight) {
	const height = Math.max(maxContentHeight ?? (idleBox ?? bbox).h, 1);
	const scale = canvasH * .94 / height;
	let dy = canvasH - (bbox.y0 + bbox.h) * scale - canvasH * .02;
	const top = bbox.y0 * scale + dy;
	if (top < 0) dy -= top;
	return {
		scale,
		dx: canvasW / 2 - (bbox.x0 + bbox.w / 2) * scale,
		dy
	};
}
//#endregion
//#region src/client/pets/sprite/player.ts
async function createSpritePlayer(options) {
	const { canvas, pack, baseUrl } = options;
	canvas.width = pack.canvasWidth;
	canvas.height = pack.canvasHeight;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("canvas 2d 不可用");
	const images = /* @__PURE__ */ new Map();
	/** 等待图片加载的切换请求 */
	/** 整帧快照：任何"没有可画图像"的帧都贴它，保证不空帧 */
	const snapshot = document.createElement("canvas");
	let snapshotReady = false;
	let pendingPlay = null;
	/** 解码图缓存上限：显示只用到 1–2 张，没必要让几十张位图常驻（实测 44 张 ≈ 1.2GB 会卡死页面） */
	const CACHE_MAX = 3;
	const lru = [];
	const touchImage = (id) => {
		const i = lru.indexOf(id);
		if (i >= 0) lru.splice(i, 1);
		lru.push(id);
	};
	let prevAnimationId = "";
	const evictImages = (currentId, idleId) => {
		while (lru.length > CACHE_MAX) {
			const victim = lru.find((id) => id !== currentId && id !== idleId && id !== prevAnimationId && !protectedIds.has(id));
			if (victim === void 0) break;
			const i = lru.indexOf(victim);
			if (i >= 0) lru.splice(i, 1);
			const img = images.get(victim);
			if (img !== void 0 && !img.complete) continue;
			images.delete(victim);
			if (img !== void 0) {
				img.onload = null;
				img.onerror = null;
				img.src = "";
			}
		}
	};
	/** 正在加载中的动作（避免重复发起） */
	const loading = /* @__PURE__ */ new Set();
	let disposed = false;
	/** 解码失败/中断的保护集合：正在用、上一帧、待切换的图不参与淘汰 */
	const protectedIds = /* @__PURE__ */ new Set();
	const loadOne = (anim, attempt = 0) => {
		if (images.has(anim.id) || loading.has(anim.id)) return Promise.resolve();
		loading.add(anim.id);
		const url = baseUrl + anim.file.split("/").map(encodeURIComponent).join("/");
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				loading.delete(anim.id);
				img.onload = null;
				img.onerror = null;
				if (disposed) return resolve();
				images.set(anim.id, img);
				touchImage(anim.id);
				resolve();
			};
			img.onerror = () => {
				loading.delete(anim.id);
				if (attempt < 2 && !disposed) {
					window.setTimeout(() => {
						loadOne(anim, attempt + 1).then(resolve);
					}, 300 * (attempt + 1));
					return;
				}
				console.warn("[pet-whale][warn] 精灵帧图片加载失败（已重试 " + attempt + " 次）: " + url);
				resolve();
			};
			img.src = url;
		});
	};
	/**
	* 预加载策略（2026-11-19 卡死修复）：
	* 单张精灵表 5120×5400 解码约 110MB，之前把 states/talk/click/hover/activities
	* 全部塞进优先队列（20+ 张 ≈ 2GB+），每次更新重载就卡死页面。
	* 现在只预加载"马上会看到"的：基础待机 + 当前时段待机池 + 说话池。
	* 其余全部按需加载（play() 时补），配合播放器 LRU 上限，常驻解码内存可控。
	*/
	const priority = /* @__PURE__ */ new Set();
	const add = (id) => {
		if (id) priority.add(id);
	};
	add(pack.idleAnimationId);
	const priorityAnims = pack.animations.filter((a) => priority.has(a.id));
	await new Promise((resolve) => window.setTimeout(resolve, 0));
	await Promise.all(priorityAnims.map(loadOne));
	const idleAnim = pack.animations.find((a) => a.id === pack.idleAnimationId);
	if (idleAnim !== void 0) {
		let attempt = 0;
		while (!images.has(idleAnim.id) && attempt < 3 && !disposed) {
			attempt += 1;
			await new Promise((resolve) => window.setTimeout(resolve, 1200));
			await loadOne(idleAnim);
			if (!images.has(idleAnim.id)) console.warn("[pet-whale][warn] 待机帧加载失败，第 " + attempt + " 次重试");
		}
	}
	/**
	* 取景范围：不能只看 idle 帧。
	* 实测 idle 的内容在 y 63–329，但有些动作会画到头顶以外（举剑、头顶飘道具），
	* 只按 idle 包围盒映射 → 那些动作的顶部会被画布裁掉（2026-11-18 用户反馈）。
	* 这里扫描**所有动作的若干采样帧**，取并集包围盒，再按并集铺满画布。
	* 为了快，采样到 160×90 再扫（不逐像素全尺寸扫），误差 <4px。
	*/
	/** 每段动画自己的取景：不同来源的素材锚点不一样，共用并集框会"歪" */
	/**
	* 取景：**缩放固定**（按基础待机算一次），每段动画只按自己的包围盒居中/贴底。
	* 之前用"每段自己的缩放"→ 不同动作包围盒不同 → 切换时忽大忽小；
	* 更早用"所有动作并集框"→ 不同来源素材互相拉偏（打电话歪）。
	*/
	const bboxes = /* @__PURE__ */ new Map();
	const bboxOf = (anim) => {
		if (bboxes.has(anim.id)) return bboxes.get(anim.id) ?? null;
		const img = images.get(anim.id);
		if (img === void 0) return null;
		const SCALE = .25;
		const total = anim.frameCount || anim.columns * anim.rows;
		let x0 = anim.frameWidth;
		let y0 = anim.frameHeight;
		let x1 = -1;
		let y1 = -1;
		const c = document.createElement("canvas");
		c.width = Math.round(anim.frameWidth * SCALE);
		c.height = Math.round(anim.frameHeight * SCALE);
		const ctx2 = c.getContext("2d", { willReadFrequently: true });
		if (ctx2 === null) return null;
		for (let k = 0; k < 3; k++) {
			const frame = Math.min(total - 1, Math.floor((total - 1) * (k / 2)));
			const col = frame % anim.columns;
			const row = Math.floor(frame / anim.columns);
			ctx2.clearRect(0, 0, c.width, c.height);
			ctx2.drawImage(img, col * anim.frameWidth, row * anim.frameHeight, anim.frameWidth, anim.frameHeight, 0, 0, c.width, c.height);
			const data = ctx2.getImageData(0, 0, c.width, c.height).data;
			for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (data[(y * c.width + x) * 4 + 3] > 24) {
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
		}
		const result = x1 < 0 ? null : {
			x0: x0 / SCALE,
			y0: y0 / SCALE,
			w: (x1 - x0 + 1) / SCALE,
			h: (y1 - y0 + 1) / SCALE
		};
		bboxes.set(anim.id, result);
		return result;
	};
	const fitFor = (anim) => {
		const bbox = bboxOf(anim);
		const fallback = {
			scale: 1,
			dx: 0,
			dy: 0
		};
		if (bbox === null) return fallback;
		const idleAnim = pack.animations.find((a) => a.id === pack.idleAnimationId);
		return computeFit(bbox, idleAnim !== void 0 ? bboxOf(idleAnim) : null, pack.canvasWidth, pack.canvasHeight, pack.maxContentHeight);
	};
	/** 播放倍速（manifest.playbackRate，默认 1） */
	const rate = Math.max(.25, Math.min(4, pack.playbackRate ?? 1));
	const idleId = pack.idleAnimationId;
	let current = pack.animations.find((a) => a.id === idleId);
	let once = false;
	let hold = false;
	let startFrame = 0;
	let onEndCb = null;
	/** 循环动作每播完一圈的回调（用于"播完再换"的轮换） */
	let onLoopCb = null;
	/** 交叉淡入：切换动作时把上一帧叠在下面淡出，避免硬切（拖拽/状态切换的"闪一下"） */
	const FADE_MS = 240;
	let fadeStart = null;
	let prevImg;
	let prevFrame = 0;
	/** 最近一次成功绘制的帧（目标动作没加载时用它顶上，避免画布空白） */
	let lastGood = null;
	let startedAt = performance.now();
	let raf = 0;
	let lastFrameAt = performance.now();
	let frameErrorLogged = false;
	let stopped = false;
	const drawUnsafe = (now) => {
		if (stopped) return;
		if (pendingPlay !== null && images.has(pendingPlay.id)) {
			const p = pendingPlay;
			pendingPlay = null;
			const anim = pack.animations.find((a) => a.id === p.id);
			if (anim !== void 0) applyPlay(anim, p.once, p.hold, p.from, p.onEnd, p.onLoop);
		}
		if (typeof document !== "undefined" && document.hidden) return;
		const img = images.get(current.id);
		if (img === void 0) {
			if (lastGood === null && snapshotReady) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
				raf = requestAnimationFrame(draw);
				return;
			}
			if (lastGood !== null) {
				const lg = lastGood;
				const fit = fitFor(lg.anim);
				const lc = lg.frame % lg.anim.columns;
				const lr = Math.floor(lg.frame / lg.anim.columns);
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(lg.img, lc * lg.anim.frameWidth, lr * lg.anim.frameHeight, lg.anim.frameWidth, lg.anim.frameHeight, fit.dx, fit.dy, lg.anim.frameWidth * fit.scale, lg.anim.frameHeight * fit.scale);
			}
			return;
		}
		const fit = fitFor(current);
		const total = current.frameCount || current.columns * current.rows;
		const span = Math.max(1, total - startFrame);
		const elapsed = (now - startedAt) / 1e3 * current.fps * rate;
		if (once && elapsed >= span) {
			if (hold) {
				const last = total - 1;
				const lc = last % current.columns;
				const lr = Math.floor(last / current.columns);
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				if (img) ctx.drawImage(img, lc * current.frameWidth, lr * current.frameHeight, current.frameWidth, current.frameHeight, fit.dx, fit.dy, current.frameWidth * fit.scale, current.frameHeight * fit.scale);
				raf = requestAnimationFrame(draw);
				return;
			}
			const cb = onEndCb;
			onEndCb = null;
			if (cb) {
				cb();
				raf = requestAnimationFrame(draw);
				return;
			}
			const idle = pack.animations.find((a) => a.id === idleId);
			if (idle) {
				current = idle;
				once = false;
				startedAt = now;
			}
		} else if (elapsed >= span) {
			startedAt = now;
			const loopCb = onLoopCb;
			if (loopCb !== null) window.setTimeout(() => {
				if (!disposed) loopCb();
			}, 0);
		}
		const passed = Math.floor((now - startedAt) / 1e3 * current.fps * rate);
		const frame = startFrame + passed % span;
		const c = frame % current.columns;
		const r = Math.floor(frame / current.columns);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const rawFade = fadeStart === null ? 1 : Math.min(1, (now - fadeStart) / FADE_MS);
		const fade = rawFade * rawFade * (3 - 2 * rawFade);
		if (fade < 1 && prevImg) {
			const pc = prevFrame % current.columns;
			const pr = Math.floor(prevFrame / current.columns);
			ctx.drawImage(prevImg, pc * current.frameWidth, pr * current.frameHeight, current.frameWidth, current.frameHeight, fit.dx, fit.dy, current.frameWidth * fit.scale, current.frameHeight * fit.scale);
			ctx.globalAlpha = fade;
		}
		if (img) {
			lastGood = {
				img,
				anim: current,
				frame
			};
			ctx.drawImage(img, c * current.frameWidth, r * current.frameHeight, current.frameWidth, current.frameHeight, fit.dx, fit.dy, current.frameWidth * fit.scale, current.frameHeight * fit.scale);
		}
		ctx.globalAlpha = 1;
		if (fade >= 1) fadeStart = null;
		if (snapshot.width !== canvas.width || snapshot.height !== canvas.height) {
			snapshot.width = canvas.width;
			snapshot.height = canvas.height;
		}
		const sctx = snapshot.getContext("2d");
		if (sctx !== null) {
			sctx.clearRect(0, 0, snapshot.width, snapshot.height);
			sctx.drawImage(canvas, 0, 0);
			snapshotReady = true;
		}
		raf = requestAnimationFrame(draw);
	};
	/**
	* 安全包装：任何一帧抛异常都只丢这一帧，不让 requestAnimationFrame 链断掉。
	* 断链的表现就是"卡死"——画面停在某一帧再也不动（2026-11-18 用户反馈）。
	*/
	const draw = (now = performance.now()) => {
		if (stopped) return;
		raf = 0;
		lastFrameAt = performance.now();
		try {
			drawUnsafe(now);
		} catch (error) {
			if (!frameErrorLogged) {
				frameErrorLogged = true;
				console.warn("[pet-whale][warn] 精灵帧绘制异常（已降级为丢帧继续）:", error);
			}
		}
		if (!disposed && raf === 0) raf = requestAnimationFrame(draw);
	};
	raf = requestAnimationFrame(draw);
	const watchdog = window.setInterval(() => {
		if (disposed) return;
		if (performance.now() - lastFrameAt > 3e3 && raf === 0) {
			console.warn("[pet-whale][warn] 精灵帧渲染停滞，重启循环");
			raf = requestAnimationFrame(draw);
		}
	}, 2e3);
	/** 真正切换动画（play 的外部入口保证图片已加载） */
	const applyPlay = (next, playOnce, holdLast, from, onEnd, onLoop) => {
		touchImage(next.id);
		protectedIds.clear();
		protectedIds.add(next.id);
		protectedIds.add(pack.idleAnimationId);
		if (prevAnimationId !== "") protectedIds.add(prevAnimationId);
		if (pendingPlay !== null) protectedIds.add(pendingPlay.id);
		evictImages(next.id, pack.idleAnimationId);
		if (next.id !== current.id) {
			const elapsedNow = Math.floor((performance.now() - startedAt) / 1e3 * current.fps * rate);
			const spanNow = Math.max(1, (current.frameCount || current.columns * current.rows) - startFrame);
			prevImg = images.get(current.id);
			prevAnimationId = current.id;
			prevFrame = startFrame + elapsedNow % spanNow;
			fadeStart = performance.now();
		}
		current = next;
		once = playOnce;
		hold = holdLast;
		onEndCb = onEnd ?? null;
		onLoopCb = playOnce ? null : onLoop ?? null;
		startFrame = Math.max(0, from ?? next.startFrame ?? 0);
		startedAt = performance.now();
	};
	return {
		play: (id, playOnce = false, holdLast = false, from = 0, onEnd, onLoop) => {
			const next = pack.animations.find((a) => a.id === id);
			if (!next) return;
			if (!images.has(next.id)) {
				pendingPlay = {
					id,
					once: playOnce,
					hold: holdLast,
					from,
					onEnd,
					onLoop
				};
				loadOne(next);
				return;
			}
			pendingPlay = null;
			applyPlay(next, playOnce, holdLast, from, onEnd);
		},
		/** 提前加载接下来要播的动作（轮换开始时就调用，避免到点还在等下载） */
		preload: (ids) => {
			for (const id of ids) {
				const anim = pack.animations.find((a) => a.id === id);
				if (anim !== void 0) loadOne(anim);
			}
		},
		current: () => current.id,
		currentIsOnce: () => once,
		has: (id) => images.has(id),
		destroy: () => {
			stopped = true;
			cancelAnimationFrame(raf);
			disposed = true;
			window.clearInterval(watchdog);
			lastGood = null;
			for (const img of images.values()) {
				img.onload = null;
				img.onerror = null;
				img.src = "";
			}
			images.clear();
			bboxes.clear();
			pendingPlay = null;
		}
	};
}
//#endregion
//#region src/desktop/renderer.ts
/**
* 桌面端渲染入口：在 Electron 窗口里播精灵桌宠。
*
* 动作规则与网页端保持一致（同一份纯逻辑）：
* - 轮换："当前动画播完一圈"再换（onLoop），30 秒兜底
* - 每第 3 轮抽一次自娱池（activities）
* - 同池随洗牌袋 + avoidSame，不连续重复
* - 点击/悬停从各自池随机
* - 空闲 20 秒打瞌睡，1 分钟后自动醒；点一下唤醒
*
* 与 Web 端差异：没有 DSH Client 服务，会话状态（think/working/wait）暂由主进程桥接后推送。
*/
const canvas = document.getElementById("pet");
if (canvas === null) throw new Error("desktop renderer: missing #pet canvas");
const packId = new URLSearchParams(location.search).get("pack") ?? "dafeiyu-sprite";
const baseUrl = `/sprite/${encodeURIComponent(packId)}/`;
const SLEEP_MS = 2e4;
const NAP_WAKE_MS = 6e4;
const IDLE_FALLBACK_MS = 3e4;
const boot = async () => {
	const response = await fetch(`${baseUrl}manifest.json`, { cache: "no-store" });
	if (!response.ok) throw new Error(`manifest ${String(response.status)}`);
	const pack = await response.json();
	canvas.width = pack.canvasWidth;
	canvas.height = pack.canvasHeight;
	const fitCanvas = () => {
		const availW = Math.max(80, window.innerWidth - 72);
		const availH = Math.max(60, window.innerHeight - 72);
		const scale = Math.min(availW / pack.canvasWidth, availH / pack.canvasHeight);
		canvas.style.width = `${String(Math.round(pack.canvasWidth * scale))}px`;
		canvas.style.height = `${String(Math.round(pack.canvasHeight * scale))}px`;
	};
	fitCanvas();
	window.addEventListener("resize", fitCanvas);
	const player = await createSpritePlayer({
		canvas,
		pack,
		baseUrl
	});
	const idleId = pack.idleAnimationId;
	const pool = (pack.choreography?.periods?.day ?? pack.idleAnimationIds ?? [idleId]).filter((id) => id !== "");
	const activities = (pack.choreography?.activities ?? []).filter((id) => pack.animations.some((a) => a.id === id));
	const picker = createPoolPicker((id) => pack.animations.some((a) => a.id === id));
	const pickFresh = (ids, key) => picker.pick(ids, key);
	let rotations = 0;
	let lastTarget = "";
	/** 网页端推来的状态（idle 时本地自己轮换） */
	let remoteState = "idle";
	let sleeping = false;
	let sleepTimer = 0;
	let napTimer = 0;
	let idleFallback = 0;
	const clearSleepTimers = () => {
		window.clearTimeout(sleepTimer);
		window.clearTimeout(napTimer);
		window.clearTimeout(idleFallback);
		sleepTimer = 0;
		napTimer = 0;
		idleFallback = 0;
	};
	const playIdle = (id) => {
		lastTarget = id;
		player.play(id, false, false, 0, void 0, rotate);
	};
	const scheduleFallback = () => {
		window.clearTimeout(idleFallback);
		idleFallback = window.setTimeout(rotate, IDLE_FALLBACK_MS);
	};
	const rotate = () => {
		if (sleeping || remoteState !== "idle") return;
		const decision = decideIdleRotation({
			lastTarget,
			pool,
			activities,
			rotations,
			idleId
		}, pickFresh);
		rotations = decision.rotations;
		const chosen = avoidSame(decision.play, lastTarget, pool, pickFresh);
		if (chosen !== void 0 && chosen !== lastTarget) playIdle(chosen);
		scheduleFallback();
	};
	const wake = () => {
		if (!sleeping) return;
		sleeping = false;
		window.clearTimeout(napTimer);
		const wakeId = pack.states?.wake;
		if (wakeId !== void 0) player.play(wakeId, true, false, 0, () => {
			rotate();
		});
		else rotate();
	};
	const sleep = () => {
		if (sleeping || document.hidden) return;
		sleeping = true;
		window.clearTimeout(idleFallback);
		const sleepId = pack.states?.sleep;
		if (sleepId !== void 0) player.play(sleepId, false, false, 0, void 0, () => void 0);
		napTimer = window.setTimeout(() => {
			if (sleeping) wake();
		}, NAP_WAKE_MS);
	};
	/** 有任何交互都重置"打瞌睡"倒计时 */
	const markActive = () => {
		if (sleeping) wake();
		window.clearTimeout(sleepTimer);
		sleepTimer = window.setTimeout(sleep, SLEEP_MS);
	};
	const playOnce = (ids, key) => {
		const id = pickFresh(ids, key);
		if (id === void 0) return;
		sleeping = false;
		window.clearTimeout(sleepTimer);
		player.play(id, true, false, 0, () => {
			markActive();
			rotate();
		});
	};
	const playRemote = (state) => {
		remoteState = state;
		if (state === "idle") {
			rotate();
			return;
		}
		const pool = state === "working" ? pack.states?.workingPool : void 0;
		const id = pool !== void 0 && pool.length > 0 ? pickFresh(pool, "working") : pack.states?.[state];
		if (id !== void 0 && id !== "") {
			sleeping = false;
			window.clearTimeout(sleepTimer);
			player.play(id, false, false, 0);
		}
	};
	let lastInteractive = false;
	let lastHitAt = 0;
	window.addEventListener("mousemove", (event) => {
		const now = performance.now();
		if (now - lastHitAt < 80) return;
		lastHitAt = now;
		const rect = canvas.getBoundingClientRect();
		const x = Math.round((event.clientX - rect.left) / rect.width * canvas.width);
		const y = Math.round((event.clientY - rect.top) / rect.height * canvas.height);
		let inside = false;
		if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
			const ctx = canvas.getContext("2d");
			if (ctx !== null) inside = (ctx.getImageData(x, y, 1, 1).data[3] ?? 0) > 8;
		}
		if (inside !== lastInteractive) {
			lastInteractive = inside;
			window.petDesktop?.setInteractive?.(inside);
		}
	});
	window.addEventListener("mouseleave", () => {
		if (lastInteractive) {
			lastInteractive = false;
			window.petDesktop?.setInteractive?.(false);
		}
	});
	markActive();
	rotate();
	canvas.addEventListener("click", () => {
		markActive();
		playOnce(pack.click?.animationIds, "click");
	});
	canvas.addEventListener("mouseenter", () => {
		window.clearTimeout(sleepTimer);
		sleepTimer = window.setTimeout(sleep, SLEEP_MS);
		playOnce(pack.hover?.animationIds, "hover");
	});
	window.addEventListener("beforeunload", () => {
		clearSleepTimers();
		player.destroy();
	});
	window.petDesktop?.ready?.({ pack: packId });
	window.petDesktop?.onCommand?.((command) => {
		if (command.type === "play" && typeof command.payload === "string") player.play(command.payload, false, false, 0, rotate);
		if (command.type === "wake") wake();
		if (command.type === "state" && typeof command.payload === "object" && command.payload !== null) {
			const state = command.payload.state;
			if (typeof state === "string") playRemote(state);
		}
	});
};
boot().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	document.body.dataset.error = message;
	console.error("[pet-whale desktop]", message);
});
//#endregion
