//#region src/client/state.ts
/**
* running=true 但长时间没有任何信号（无工具调用、无流式文本变化）时，
* 判定为"快照卡住"（典型：DSH 重启后会话快照仍显示 running）→ 回落 idle。
* 否则宠物会一直播 working，看起来像卡死（2026-11-19 用户反馈）。
*/
const STALE_RUNNING_MS = 3e4;
const ERROR_MS = 4e3;
const DISAPPOINTED_MS = 2600;
const CELEBRATE_MS = 2500;
/** working 粘滞时长：工具调用结束后继续保持"敲代码"的时间 */
const WORK_STICKY_MS = 2500;
/** 快照 → 持续状态。 */
function deriveContinuous(snap, stickyUntil, now) {
	if (!snap.running) return "idle";
	if (hasToolActivity(snap)) return "working";
	if (stickyUntil !== null && now < stickyUntil) return "working";
	return "think";
}
/** 有工具在飞：legacy.runningCalls 非空，或者流式消息里已经出现了 tool-call 块。 */
function hasToolActivity(snap) {
	return (snap.runningCalls?.length ?? 0) > 0 || snap.partialToolCall === true;
}
/** 状态驱动：吃快照序列，吐状态序列。 */
var WhaleDriver = class {
	prevRunning = null;
	prevTurnEnds = 0;
	prevError = null;
	transient = null;
	stickyUntil = null;
	/** 离开 working/think 后保持该动作的截止时间：工具间隙别闪回待机 */
	activeUntil = 0;
	current = "idle";
	/** 最近一次收到"回合内信号"（工具活动 / 流式文本长度变化）的时间 */
	lastSignalAt = 0;
	lastPartialLen = -1;
	/** 首帧初始化基线（不触发任何瞬态）。 */
	prime(snap) {
		this.prevRunning = snap.running;
		this.prevTurnEnds = snap.turnEnds?.size ?? 0;
		this.prevError = errorKey(snap);
		this.transient = null;
		this.stickyUntil = null;
		this.current = (snap.pending?.length ?? 0) > 0 ? "wait" : deriveContinuous(snap, this.stickyUntil, 0);
	}
	step(snap, now) {
		if (this.prevRunning === null) {
			this.prime(snap);
			return {
				state: this.current,
				changed: false,
				completed: false
			};
		}
		let completed = false;
		const err = errorKey(snap);
		if (snap.running && this.prevRunning === false) this.transient = null;
		if (err !== null && err !== this.prevError) this.transient = {
			state: "error",
			until: now + ERROR_MS
		};
		this.prevError = err;
		if (this.prevRunning === true && snap.running === false) {
			const ends = snap.turnEnds?.size;
			const turns = ends !== void 0 && ends > this.prevTurnEnds ? ends : this.prevTurnEnds + 1;
			if (turns > this.prevTurnEnds && err === null) {
				completed = true;
				this.transient = {
					state: "celebrate",
					until: now + CELEBRATE_MS
				};
			}
			this.prevTurnEnds = turns;
		} else if (snap.turnEnds !== void 0 && snap.turnEnds.size > this.prevTurnEnds) this.prevTurnEnds = snap.turnEnds.size;
		if (snap.running) {
			const partialLen = typeof snap.partial === "string" ? snap.partial.length : -1;
			if (hasToolActivity(snap) || partialLen !== this.lastPartialLen) {
				this.lastSignalAt = now;
				this.lastPartialLen = partialLen;
			}
		} else {
			this.lastSignalAt = now;
			this.lastPartialLen = -1;
		}
		this.prevRunning = snap.running;
		if (snap.running && hasToolActivity(snap)) this.stickyUntil = now + WORK_STICKY_MS;
		if (!snap.running) this.stickyUntil = null;
		if (this.stickyUntil !== null && now >= this.stickyUntil) this.stickyUntil = null;
		if (this.transient !== null && now >= this.transient.until) {
			this.transient = this.transient.state === "error" ? {
				state: "disappointed",
				until: this.transient.until + DISAPPOINTED_MS
			} : null;
			if (this.transient !== null && now >= this.transient.until) this.transient = null;
		}
		const waiting = (snap.pending?.length ?? 0) > 0;
		let next;
		if (waiting) next = "wait";
		else if (this.transient !== null) next = this.transient.state;
		else next = deriveContinuous(snap, this.stickyUntil, now);
		if (snap.running && (next === "working" || next === "think") && now - this.lastSignalAt > 3e4) {
			next = "idle";
			this.stickyUntil = null;
		}
		if (next === "working" || next === "think") this.activeUntil = now + 4e3;
		if (snap.running && next === "idle" && (this.current === "working" || this.current === "think") && now < this.activeUntil) next = this.current;
		const changed = next !== this.current;
		this.current = next;
		return {
			state: next,
			changed,
			completed
		};
	}
	/**
	* 安抚：失落时被戳，提前结束这段自愈。
	* 只对 disappointed 生效——error 正在报的时候不该被一戳抹掉，
	* celebrate 也没有提前结束的道理。返回是否真的安抚到了。
	*/
	soothe() {
		if (this.transient === null || this.transient.state !== "disappointed") return false;
		this.transient = null;
		return true;
	}
	/**
	* 换了当前会话：下一帧当首帧重新起算基线。
	* 不重置的话，旧会话 running=true、新会话 running=false 会被 step 当成"回合跑完"误庆祝。
	*/
	reset() {
		this.prevRunning = null;
		this.stickyUntil = null;
		this.transient = null;
		this.current = "idle";
		this.lastSignalAt = 0;
		this.lastPartialLen = -1;
		this.activeUntil = 0;
		this.prevError = null;
		this.prevTurnEnds = 0;
	}
	/**
	* 别的会话跑完了：当前会话的快照里看不到这个边沿，由调用方直接递进来。
	* 正在报错 / 失落时不抢戏。下一次 step() 才会把状态真正切过去。
	*/
	celebrateOther(now) {
		if (this.transient !== null && this.transient.state !== "celebrate" && now < this.transient.until) return;
		this.transient = {
			state: "celebrate",
			until: now + CELEBRATE_MS
		};
	}
	get state() {
		return this.current;
	}
	/**
	* 下一个「不需要新快照、时间到了状态自己就该变」的时刻（ms，与 step 的 now 同基准）。
	* null = 没有待到期的东西。
	*
	* 为什么需要它：step() 只在快照更新时被调用，而 celebrate / error / disappointed 是
	* 到点回落的瞬态、working 粘滞也是到点回落。回合结束后快照往往就不再更新了，
	* 没人再调 step ⇒ 瞬态永远不结束。实测：celebrate 卡住 18.5 秒，直到下一条消息
	* 把它顶掉（用户看到的就是"庆祝停不下来"）。调用方拿这个时刻挂一个定时器即可。
	*/
	nextDeadline(now) {
		const candidates = [];
		if (this.transient !== null) candidates.push(Math.max(now, this.transient.until));
		if (this.stickyUntil !== null) candidates.push(Math.max(now, this.stickyUntil));
		if (candidates.length === 0) return null;
		return Math.min(...candidates);
	}
};
function errorKey(snap) {
	if (snap.lastAgentError != null) return snap.lastAgentError;
	if (snap.openError != null) return "open-error";
	return null;
}
//#endregion
export { CELEBRATE_MS, DISAPPOINTED_MS, ERROR_MS, STALE_RUNNING_MS, WORK_STICKY_MS, WhaleDriver, deriveContinuous };
