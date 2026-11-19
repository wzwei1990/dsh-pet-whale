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
//#endregion
export { avoidSame, createPoolPicker, decideIdleRotation };
