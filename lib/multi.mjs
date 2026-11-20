//#region src/client/multi.ts
/** 后台会话里最需要表达的那个相位：待确认 > 出错 > 在跑 */
function backgroundPhase(sessions) {
	let running = false;
	let failed = false;
	for (const s of sessions) {
		if (s.pending) return "wait";
		if (s.failed) failed = true;
		if (s.running) running = true;
	}
	if (failed) return "error";
	if (running) return "working";
}
/**
* 主视图会话空闲时，用后台会话的相位顶上；主视图自己在跑/等待时以它为准
* （主会话的信息更细，后台只知道"在跑/待确认/出错"）。
*/
function aggregateVisual(main, background, followAll) {
	if (!followAll) return main;
	const phase = backgroundPhase(background);
	if (phase === void 0) return main;
	if (main !== "idle" && main !== "celebrate") return main;
	return phase;
}
/** 角标数字：在跑 + 待确认（去重后按会话数），并给每类取标题做 tooltip。 */
function badgeSummary(sessions) {
	const titles = [];
	const waiting = [];
	for (const s of sessions) {
		if (s.pending) waiting.push(s.title);
		if (s.running) titles.push(s.title);
	}
	return {
		count: Math.max(titles.length, waiting.length),
		titles,
		waiting
	};
}
//#endregion
export { aggregateVisual, backgroundPhase, badgeSummary };
