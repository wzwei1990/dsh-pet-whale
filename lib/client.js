window.__ModuleLoader__.load({
	id: "pet-whale",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/styles.ts
		const BASE_CSS = `
[data-dsh-whale] {
  --pw-ink: #2E2A24;
  --pw-body-light: #8FB5FF;
  --pw-body: #4D6BFE;
  --pw-body-dark: #3550C9;
  --pw-blush: #F0A0A0;
  --pw-eye: #2E2A24;
  --pw-pupil: #FBF8F0;
  /* 尺寸总闸：只改这一个变量，下面所有几何都跟着走 */
  --pw-scale: 1;
  position: fixed;
  z-index: 900;
  /* 每只宠物可以有自己的容器尺寸（PetModule.size），默认 137×101 即鲸鱼的盒子 */
  width: calc(var(--pw-pet-w, 137px) * var(--pw-scale));
  height: calc(var(--pw-pet-h, 101px) * var(--pw-scale));
  pointer-events: none;
  user-select: none;
  font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* 隐藏模式：整只收起来，只留右下角小按钮 */
[data-dsh-whale].hidden { display: none !important; }

/* 右下角召回小按钮（挂在 body 上，独立于鲸鱼本体） */
[data-dsh-whale-mini] {
  position: fixed;
  right: 14px;
  bottom: 14px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.22);
  background: linear-gradient(160deg, #4D6BFE, #2E3F9E);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0,0,0,.28);
  z-index: 901;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  transition: transform .18s ease, box-shadow .18s ease;
}
[data-dsh-whale-mini]:hover {
  transform: translateY(-2px) scale(1.07);
  box-shadow: 0 10px 24px rgba(0,0,0,.36);
}
[data-dsh-whale-mini]:active { transform: scale(.94); }

/* 小按钮随 agent 状态变色呼吸：idle 蓝 / think 深蓝 / working 橙 / celebrate 绿 / error 红 */
[data-dsh-whale-mini] { animation: pw-mini-breathe 3.2s ease-in-out infinite; }
[data-dsh-whale-mini][data-state="think"] { background: linear-gradient(160deg, #6E8BFF, #3D55D6); animation: pw-mini-think 1.6s ease-in-out infinite; }
[data-dsh-whale-mini][data-state="working"] { background: linear-gradient(160deg, #F5A623, #C97B0B); animation: pw-mini-work 0.8s ease-in-out infinite; }
[data-dsh-whale-mini][data-state="celebrate"] { background: linear-gradient(160deg, #3BC46D, #1E8A4A); animation: pw-mini-celebrate 0.9s ease-in-out infinite; }
[data-dsh-whale-mini][data-state="error"] { background: linear-gradient(160deg, #E5484D, #A61B20); animation: pw-mini-error 0.5s ease-in-out infinite; }
[data-dsh-whale-mini].dragging { cursor: move; animation: none !important; transition: none; }

/* 思考内容滚动条：think 时悬在桌宠正上方，内容向左缓慢滚动 */
[data-dsh-whale-think] {
  position: fixed;
  left: 50%;
  top: 0;
  transform: translate(-50%, -100%);
  display: none;
  align-items: center;
  gap: 8px;
  width: auto;
  max-width: 360px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(30, 34, 46, .82);
  color: #CFE0FF;
  font: 12px/1.4 ui-monospace, Consolas, "Courier New", monospace;
  border: 1px solid rgba(139,160,255,.25);
  box-shadow: 0 6px 20px rgba(0,0,0,.25);
  pointer-events: none;
  z-index: 899;
  white-space: nowrap;
  overflow: hidden;
}
[data-dsh-whale-think].show { display: flex; }
[data-dsh-whale-think] .dsh-whale-think-label { flex: none; opacity: .85; }
[data-dsh-whale-think] .dsh-whale-think-scroll { flex: 1; overflow: hidden; }
[data-dsh-whale-think] .dsh-whale-think-text {
  display: inline-block;
  will-change: transform;
  max-width: none;
}

[data-dsh-whale] .pet-official {
  /* 跟随根容器：尺寸由 --pw-pet-w/--pw-pet-h 决定，宠物切换时同步 */
  width: 100%;
  height: 100%;
  position: relative;
  cursor: grab;
  pointer-events: auto;
}
[data-dsh-whale] .pet-official:active { cursor: grabbing; }
[data-dsh-whale] .pet-official svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  transform-origin: 50% 85%;
}

/* 地面阴影：独立兄弟元素，钉在地面，鲸鱼的任何动画（翻滚/跃起/深潜）都不带动它 */
[data-dsh-whale] .dsh-whale-shadow {
  position: absolute;
  left: 50%;
  bottom: calc(-12px * var(--pw-scale));
  width: calc(79px * var(--pw-scale));
  height: calc(12px * var(--pw-scale));
  margin-left: calc(-40px * var(--pw-scale));
  background: radial-gradient(ellipse, rgba(46,42,36,.24), transparent 65%);
  border-radius: 50%;
  animation: pw-shadowBob 3.2s ease-in-out infinite;
  pointer-events: none;
}

/* 游动时的水流尾波光晕 */
[data-dsh-whale] .dsh-whale-wake {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(146px * var(--pw-scale));
  height: calc(96px * var(--pw-scale));
  margin-left: calc(-73px * var(--pw-scale));
  margin-top: calc(-48px * var(--pw-scale));
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(143, 181, 255, 0.28) 0%, rgba(77, 107, 254, 0.08) 50%, transparent 72%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
  filter: blur(4px);
  z-index: 1;
}
[data-dsh-whale].swimming .dsh-whale-wake {
  opacity: 1;
  animation: pw-wakePulse 1.6s ease-in-out infinite alternate;
}

/* ===== 台词气泡 ===== */
[data-dsh-whale] .dsh-whale-dialog {
  position: absolute;
  top: -34px;
  left: 50%;
  transform: translateX(-50%);
  background: #FFFFFF;
  color: var(--pw-ink);
  border: 1px solid rgba(46,42,36,.15);
  border-radius: 12px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 4px 14px rgba(46,42,36,.08);
  pointer-events: none;
  opacity: 0;
  transform-origin: 50% 100%;
  transition: opacity .25s ease, transform .25s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 20;
}
[data-dsh-whale] .dsh-whale-dialog.show { opacity: 1; transform: translateX(-50%) scale(1); }
[data-dsh-whale] .dsh-whale-dialog::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 50%;
  margin-left: -5px;
  border-width: 5px 5px 0;
  border-style: solid;
  border-color: #FFFFFF transparent transparent;
}

/* ===== 投喂小鱼干 ===== */
[data-dsh-whale] .dsh-whale-snack {
  position: absolute;
  top: -7px;
  left: 14px;
  font-size: 14px;
  opacity: 0;
  pointer-events: none;
  z-index: 15;
}
[data-dsh-whale] .dsh-whale-snack.drop { animation: pw-dropSnack 0.7s ease-in forwards; }
[data-dsh-whale][data-facing="right"] .dsh-whale-snack { left: auto; right: 14px; }


/* ===== 打瞌睡 ===== */
[data-dsh-whale] .dsh-whale-zzz {
  position: absolute;
  left: 58%;
  top: 19px;
  font-size: 10px;
  font-weight: bold;
  color: #8F4427;
  opacity: 0;
  pointer-events: none;
}
[data-dsh-whale].sleeping .dsh-whale-zzz { animation: pw-zzzFloat 2.8s ease-in-out infinite; }

/* ===== 右键菜单 ===== */
[data-dsh-whale] .dsh-whale-menu {
  position: absolute;
  min-width: 132px;
  padding: 4px;
  border-radius: 10px;
  background: var(--dsw-hovercard-bg, #2C2C2E);
  color: var(--dsw-alias-text-1, #eee);
  box-shadow: var(--dsw-shadow-lv3, 0 8px 24px rgba(0,0,0,.25));
  pointer-events: auto;
  z-index: 30;
  display: none;
  font-size: 13px;
}
[data-dsh-whale] .dsh-whale-menu.open { display: block; }
[data-dsh-whale] .dsh-whale-menu button {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  padding: 6px 10px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
}
[data-dsh-whale] .dsh-whale-menu button:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,.1)); }
[data-dsh-whale] .dsh-whale-menu .pw-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: -2px;
  border: 1px solid rgba(255,255,255,.35);
}

  [data-dsh-whale] .dsh-whale-menu {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    min-width: 168px;
  }
  [data-dsh-whale] .dsh-whale-menu .pw-panel-title {
    padding: 8px 10px 4px;
    font-weight: 600;
    font-size: 13px;
    opacity: .92;
    border-bottom: 1px solid rgba(255,255,255,.08);
    margin-bottom: 4px;
  }
  [data-dsh-whale] .dsh-whale-menu .pw-panel-section {
    padding: 4px 6px;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  [data-dsh-whale] .dsh-whale-menu .pw-panel-section:last-of-type {
    border-bottom: none;
  }
  [data-dsh-whale] .dsh-whale-menu .pw-panel-section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .4px;
    opacity: .65;
    padding: 6px 4px 2px;
  }
  [data-dsh-whale] .dsh-whale-menu .pw-palette-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: auto;
    min-width: 86px;
    margin: 2px;
    padding: 5px 8px;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 8px;
    background: rgba(255,255,255,.04);
  }
  [data-dsh-whale] .dsh-whale-menu .pw-palette-btn:hover {
    background: rgba(255,255,255,.12);
  }
  [data-dsh-whale] .dsh-whale-menu .pw-back {
    margin-top: 4px;
    opacity: .75;
  }



/* ===== keyframes（pw- 前缀） ===== */
@keyframes pw-qbob {
  0%,100% { transform: translateY(0) scale(1, 1); }
  22%     { transform: translateY(-7px) scale(.985, 1.035); }
  50%     { transform: translateY(2px) scale(1.02, .965); }
  72%     { transform: translateY(-3px) scale(.995, 1.012); }
}
@keyframes pw-dive2 {
  0%, 10%  { transform: translateY(0) rotate(0) scale(1, 1); opacity: 1; }
  24%      { transform: translateY(9px) rotate(-7deg) scale(1.03, .95); opacity: .78; }
  38%, 70% { transform: translateY(33px) rotate(3deg) scale(.95, 1.05); opacity: .42; }
  84%      { transform: translateY(6px) rotate(-5deg) scale(1.03, .96); opacity: .85; }
  94%,100% { transform: translateY(0) rotate(0) scale(1, 1); opacity: 1; }
}
@keyframes pw-leap2 {
  0%, 100%  { transform: translateY(0) rotate(0) scale(1, 1); }
  14%       { transform: translateY(-27px) rotate(-10deg) scale(.97, 1.06); }
  36%       { transform: translateY(2px) rotate(5deg) scale(1.09, .88); }
  52%       { transform: translateY(-13px) rotate(-4deg) scale(.98, 1.04); }
  72%       { transform: translateY(-3px) rotate(2deg) scale(1.03, .94); }
}
@keyframes pw-shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-3.5px); }
  50%      { transform: translateX(2.5px); }
  75%      { transform: translateX(-2px); }
}
@keyframes pw-wait {
  0%, 100% { transform: translateY(0) rotate(0) scale(1, 1); }
  30%      { transform: translateY(-4px) rotate(-2deg) scale(1.01, .99); }
  60%      { transform: translateY(2px) rotate(2deg) scale(.99, 1.01); }
}
@keyframes pw-disappointed {
  0%, 100% { transform: translateY(0) rotate(0) scale(1, 1); opacity: 1; }
  40%      { transform: translateY(1px) rotate(-1.5deg) scale(0.99, 1.01); opacity: .88; }
  70%      { transform: translateY(0) rotate(1deg) scale(1, 0.99); opacity: .94; }
}


@keyframes pw-swim {
  0%,100% { transform: translateX(-3.5px) translateY(0) rotate(-1.5deg); }
  50%     { transform: translateX(3.5px) translateY(-2px) rotate(1.5deg); }
}
@keyframes pw-swimBody {
  0%   { transform: translateY(0) rotate(-1.2deg) scale(1, 1); }
  100% { transform: translateY(-1.8px) rotate(1.2deg) scale(0.99, 1.015); }
}
@keyframes pw-blink {
  0%, 91%, 100% { transform: scaleY(1); }
  94%           { transform: scaleY(0.08); }
  97%           { transform: scaleY(1); }
}
@keyframes pw-rise {
  0%   { transform: translateY(0) scale(.6); opacity: 0; }
  20%  { opacity: .9; }
  100% { transform: translateY(-50px) scale(1.1); opacity: 0; }
}
@keyframes pw-riseBlue {
  0%   { transform: translate(5px, 22px) scale(.5); opacity: 0; }
  25%  { opacity: .85; }
  100% { transform: translate(-7px, -33px) scale(1.15); opacity: 0; }
}
@keyframes pw-squish {
  0%   { transform: scale(1, 1); }
  25%  { transform: scale(1.15, 0.82); }
  55%  { transform: scale(0.93, 1.09); }
  78%  { transform: scale(1.03, 0.98); }
  100% { transform: scale(1, 1); }
}
@keyframes pw-rollTrick {
  0%   { transform: translateY(0) rotate(0deg) scale(1, 1); }
  30%  { transform: translateY(-22px) rotate(-120deg) scale(1.08, 0.92); }
  70%  { transform: translateY(-14px) rotate(-260deg) scale(0.95, 1.05); }
  100% { transform: translateY(0) rotate(-360deg) scale(1, 1); }
}
@keyframes pw-shadowBob {
  0%,100% { transform: scale(1); opacity: .9; }
  50%     { transform: scale(.78); opacity: .5; }
}
@keyframes pw-keyTap1 {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(0.4px); }
}
@keyframes pw-keyTap2 {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(0.4px); }
}
@keyframes pw-codeFloat1 {
  0%   { transform: translateY(0) scale(0.5); opacity: 0; }
  30%  { opacity: 0.95; }
  100% { transform: translateY(-16px) translateX(-5px) scale(1); opacity: 0; }
}
@keyframes pw-codeFloat2 {
  0%   { transform: translateY(0) scale(0.5); opacity: 0; }
  30%  { opacity: 0.95; }
  100% { transform: translateY(-17px) translateX(4px) scale(1.05); opacity: 0; }
}
@keyframes pw-starSpin {
  0%,100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50%     { transform: scale(1.3) rotate(22deg); opacity: .65; }
}
@keyframes pw-angryJitter {
  0%,100% { transform: translateX(0); }
  50%     { transform: translateX(-1.2px); }
}
@keyframes pw-sleepBob {
  0%,100% { transform: translateY(0) scale(1, 1); }
  50%     { transform: translateY(3px) scale(1.02, 0.97); }
}
@keyframes pw-zzzFloat {
  0%   { transform: translate(0, 0) scale(0.6); opacity: 0; }
  30%  { opacity: 0.9; }
  100% { transform: translate(10px, -17px) scale(1.15); opacity: 0; }
}
@keyframes pw-dropSnack {
  0%   { transform: translateY(0) rotate(0); opacity: 1; }
  80%  { transform: translateY(79px) rotate(45deg); opacity: 1; }
  100% { transform: translateY(90px) scale(0.5); opacity: 0; }
}

@keyframes pw-mini-breathe {
  0%,100% { box-shadow: 0 8px 20px rgba(0,0,0,.28); }
  50%     { box-shadow: 0 8px 24px rgba(77,107,254,.55); }
}
@keyframes pw-mini-think {
  0%,100% { box-shadow: 0 8px 20px rgba(61,85,214,.35); }
  50%     { box-shadow: 0 8px 26px rgba(110,139,255,.75); }
}
@keyframes pw-mini-work {
  0%,100% { opacity: 1; }
  50%     { opacity: .62; }
}
@keyframes pw-mini-celebrate {
  0%,100% { box-shadow: 0 8px 20px rgba(27,138,74,.35); }
  50%     { box-shadow: 0 10px 28px rgba(59,196,109,.85); }
}
@keyframes pw-mini-error {
  0%,100% { box-shadow: 0 8px 20px rgba(166,27,32,.35); }
  50%     { box-shadow: 0 8px 26px rgba(229,72,77,.85); }
}

/* ===== 全屏独立固定粒子层 ===== */
.pw-particle-layer {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 898;
  overflow: hidden;
}

/* ===== 水纹与水泡特效 ===== */
.pw-water-ripple {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  border: 1.5px solid rgba(143, 181, 255, 0.65);
  background: radial-gradient(ellipse at center, rgba(143, 181, 255, 0.22) 0%, rgba(77, 107, 254, 0.05) 55%, transparent 75%);
  transform: translate(-50%, -50%) scale(0.2);
  animation: pw-rippleFade 1s cubic-bezier(0.12, 0.8, 0.32, 1) forwards;
  z-index: 898;
  box-shadow: 0 0 8px rgba(143, 181, 255, 0.35);
}
@keyframes pw-rippleFade {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0.85;
  }
  60% {
    opacity: 0.45;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.65);
    opacity: 0;
  }
}

.pw-stream-bubble {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FFFFFF 0%, rgba(180, 215, 255, 0.85) 55%, rgba(77, 107, 254, 0.45) 100%);
  border: 0.8px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 4px rgba(143, 181, 255, 0.5), inset -1px -1px 2px rgba(53, 80, 201, 0.3);
  animation: pw-bubbleFloat var(--pw-b-dur, 1.1s) cubic-bezier(0.2, 0.7, 0.4, 1) forwards;
  z-index: 899;
}
@keyframes pw-bubbleFloat {
  0% {
    transform: translate(0, 0) scale(0.3);
    opacity: 0;
  }
  20% {
    opacity: 0.95;
  }
  80% {
    opacity: 0.75;
    transform: translate(var(--pw-b-dx, -10px), var(--pw-b-dy, -20px)) scale(1.05);
  }
  100% {
    transform: translate(calc(var(--pw-b-dx, -10px) * 1.3), calc(var(--pw-b-dy, -20px) - 16px)) scale(0.2);
    opacity: 0;
  }
}

@keyframes pw-wakePulse {
  0%   { transform: scale(0.9, 0.82) rotate(-2.5deg); opacity: 0.45; }
  100% { transform: scale(1.18, 1.08) rotate(2.5deg); opacity: 0.85; }
}

@keyframes pw-spoutSpray {
  0%   { transform: scale(0.2) translateY(2px); opacity: 0; }
  25%  { transform: scale(1) translateY(0); opacity: 0.95; }
  70%  { transform: scale(1.08) translateY(-1.5px); opacity: 0.75; }
  100% { transform: scale(1.15) translateY(-3px); opacity: 0; }
}

@keyframes pw-pupilGaze {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(0.35px, -0.42px); }
}

@keyframes pw-annoyedDodge {
  0%   { transform: translateX(0) rotate(0deg); }
  35%  { transform: translateX(-9px) rotate(-7deg); }
  65%  { transform: translateX(4px) rotate(3deg); }
  100% { transform: translateX(0) rotate(0deg); }
}
/* 背过身：横向翻面到一半停住，读作"扭头不看你" */
@keyframes pw-sulkTurn {
  0%   { transform: rotate(0deg) scale(1, 1); }
  45%  { transform: rotate(-10deg) scale(0.94, 1.05); }
  100% { transform: rotate(-6deg) scale(0.97, 1.02); }
}
@keyframes pw-dizzyShake {
  0%   { transform: rotate(-12deg) scale(0.95); }
  100% { transform: rotate(12deg) scale(1.05); }
}

@keyframes pw-dizzyWobble {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25%      { transform: rotate(-7deg) scale(0.96); }
  75%      { transform: rotate(7deg) scale(0.96); }
}

@keyframes pw-bellyUp {
  0%   { transform: rotate(0deg) translateY(0); }
  20%  { transform: rotate(160deg) translateY(-18px); }
  35%  { transform: rotate(180deg) translateY(-6px); }
  75%  { transform: rotate(180deg) translateY(-6px); }
  100% { transform: rotate(360deg) translateY(0); }
}

@keyframes pw-squeeze {
  0%   { transform: scaleX(1) scaleY(1); }
  100% { transform: scaleX(0.82) scaleY(1.1); }
}

@keyframes pw-impatientSway {
  0%, 100% { transform: rotate(0deg); }
  30%      { transform: rotate(-5deg); }
  70%      { transform: rotate(5deg); }
}

@keyframes pw-joyHop {
  0%, 100% { transform: translateY(0) scale(1); }
  35%      { transform: translateY(-16px) scale(1.08, 0.94); }
  65%      { transform: translateY(-4px) scale(0.96, 1.04); }
}

@keyframes pw-causticDrift {
  0%   { transform: translate(-0.6px, 0.3px); opacity: 0.12; stroke-width: 0.9; }
  50%  { opacity: 0.28; stroke-width: 1.25; }
  100% { transform: translate(0.6px, -0.3px); opacity: 0.14; stroke-width: 1.0; }
}

/* 破浪跃水与着陆飞溅水滴 */
.pw-splash-drop {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FFFFFF 0%, rgba(180, 215, 255, 0.9) 60%, rgba(77, 107, 254, 0.5) 100%);
  box-shadow: 0 0 3px rgba(143, 181, 255, 0.6);
  animation: pw-splashFall var(--pw-sp-dur, 0.65s) cubic-bezier(0.25, 0.9, 0.4, 1) forwards;
  z-index: 899;
}
@keyframes pw-splashFall {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.95;
  }
  60% {
    opacity: 0.85;
  }
  100% {
    transform: translate(var(--pw-sp-dx, 12px), var(--pw-sp-dy, 35px)) scale(0.2);
    opacity: 0;
  }
}

/* 悬空拖拽滴水 */
.pw-drag-drip {
  position: absolute;
  pointer-events: none;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, rgba(160, 205, 255, 0.85) 60%, rgba(77, 107, 254, 0.4) 100%);
  box-shadow: 0 0 3px rgba(143, 181, 255, 0.4);
  animation: pw-dripFall 0.52s cubic-bezier(0.45, 0.05, 0.85, 0.6) forwards;
  z-index: 897;
}
@keyframes pw-dripFall {
  0% {
    transform: translate(0, 0) scale(0.6);
    opacity: 0.9;
  }
  50% {
    transform: translate(0, 14px) scale(0.9, 1.25);
    opacity: 0.85;
  }
  100% {
    transform: translate(0, 46px) scale(0.3, 0.1);
    opacity: 0;
  }
}

/* 庆祝彩屑粒子 */
.pw-confetti {
  position: absolute;
  pointer-events: none;
  width: var(--pw-cf-w, 7px);
  height: var(--pw-cf-h, 10px);
  background: var(--pw-cf-bg, #4D6BFE);
  border-radius: var(--pw-cf-r, 2px);
  opacity: 0.95;
  animation: pw-confettiFall var(--pw-cf-dur, 1.1s) cubic-bezier(0.22, 0.8, 0.36, 1) forwards;
  z-index: 899;
}
@keyframes pw-confettiFall {
  0% {
    transform: translate(0, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    opacity: 1;
  }
  60% {
    opacity: 0.85;
  }
  100% {
    transform: translate(var(--pw-cf-dx, 35px), var(--pw-cf-dy, 100px)) rotateX(540deg) rotateY(360deg) rotateZ(270deg);
    opacity: 0;
  }
}

/* 陪伴统计项目 */
[data-dsh-whale] .dsh-whale-menu .pw-stats-item {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 12px;
  padding: 6px 10px;
  margin-bottom: 4px;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0.95;
}
[data-dsh-whale][data-theme="dark"] .dsh-whale-menu .pw-stats-item {
  background: rgba(255, 255, 255, 0.08);
  color: #F2F2F0;
}

/* 后台省电：页面不可见时暂停一切动画 */
[data-dsh-whale].paused,
[data-dsh-whale].paused * { animation-play-state: paused !important; transition: none !important; }
[data-dsh-whale-mini].paused { animation: none !important; }

/* 主题联动：DSH 暗色主题下的 UI 皮肤 */
[data-dsh-whale][data-theme="dark"] .dsh-whale-dialog {
  background: #2C2C2E;
  color: #F2F2F0;
  border-color: rgba(255,255,255,.12);
}
[data-dsh-whale][data-theme="dark"] .dsh-whale-dialog::after {
  border-color: #2C2C2E transparent transparent;
}
[data-dsh-whale][data-theme="dark"] .dsh-whale-shadow {
  background: radial-gradient(ellipse, rgba(0,0,0,.5), transparent 65%);
}
[data-dsh-whale][data-theme="dark"] .dsh-whale-wake {
  background: radial-gradient(ellipse at center, rgba(110, 145, 255, 0.22) 0%, rgba(53, 80, 201, 0.06) 50%, transparent 72%);
}

/* 减少动态效果：全关动画 */
@media (prefers-reduced-motion: reduce) {
  [data-dsh-whale] *,
  [data-dsh-whale] { animation: none !important; transition: none !important; }
  .pw-water-ripple, .pw-stream-bubble, .pw-splash-drop, .pw-drag-drip, .pw-confetti { display: none !important; }
}

/* ===== fork 扩展：上游 1.2.x 新功能里"与宠物无关"的部件 =====
   上游把角标气泡与摸头的按压/爱心写在鲸鱼自己的表里；这里给出通用版，
   每只宠物只需用 CSS 变量调位置（默认值 = 鲸鱼原来的数值，所以鲸鱼观感不变）。 */

/* 摸头时的光标（一只小手，热点在掌心） */
[data-dsh-whale].patting .pet-official,
[data-dsh-whale].patting .pet-official * { cursor: var(--pw-pat-cursor, inherit); }

/* 被摸时的按压反馈（.body 是三只宠物都有的挂点） */
[data-dsh-whale] .pet-official.pat-press .body {
  transform-origin: 50% 100%;
  animation: pw-patPress 0.3s ease-out !important;
}

/* 摸头爱心（每只宠物在自己的 markup 里放 <span class="pat-heart">♥</span>，
   位置用 --pw-pat-heart-x / --pw-pat-heart-top 调） */
[data-dsh-whale] .pat-heart {
  position: absolute;
  left: var(--pw-pat-heart-x, 26%);
  top: var(--pw-pat-heart-top, 0);
  color: var(--pw-pat-heart-color, #F07A8E);
  font-size: calc(13px * var(--pw-scale, 1));
  line-height: 1;
  opacity: 0;
  pointer-events: none;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
}
[data-dsh-whale] .pat-heart.show { animation: pw-heartFloat 1.1s ease-out forwards; }

/* 角标气泡（元素由行为层生成，三只宠物都可用；位置用变量调） */
[data-dsh-whale] .dsh-whale-badge {
  position: absolute;
  top: var(--pw-badge-top, calc(4px * var(--pw-scale, 1)));
  left: var(--pw-badge-left, calc(-6px * var(--pw-scale, 1)));
  min-width: 24px;
}
[data-dsh-whale][data-facing="right"] .dsh-whale-badge {
  left: auto;
  right: var(--pw-badge-right, calc(-6px * var(--pw-scale, 1)));
}
[data-dsh-whale] .dsh-whale-badge[hidden] { display: none !important; }
[data-dsh-whale] .dsh-whale-badge.pop {
  animation: pw-badgeSway 2.8s ease-in-out infinite, pw-badgePop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
}

@keyframes pw-patPress {
  0%   { transform: scale(1, 1); }
  35%  { transform: scale(1.05, 0.9); }
  100% { transform: scale(1, 1); }
}
@keyframes pw-heartFloat {
  0%   { transform: translateY(4px) scale(0.5); opacity: 0; }
  25%  { transform: translateY(0) scale(1.1); opacity: 1; }
  100% { transform: translateY(-22px) scale(0.9); opacity: 0; }
}
@keyframes pw-badgeSway {
  0%, 100% { rotate: -6deg; }
  50%      { rotate: 6deg; }
}
@keyframes pw-badgePop {
  0%   { transform: scale(0.6); }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* ===== fork 扩展：贴边压扁 + 摸头闭眼（上游 1.2.x 的鲸鱼专属规则，这里泛化给三只宠物）=====
   行为层把 edge-top/edge-bottom 加在根上、把 petting 加在 .pet-official 上；
   .body / .eye-group / .eye / .sleep-eyes 三只宠物都有，所以同一套规则通用。 */
[data-dsh-whale].edge-top .pet-official .body,
[data-dsh-whale].dragging.edge-top .pet-official .body {
  transform-origin: 50% 0%;
  animation: pw-squash 0.35s ease-out forwards !important;
}
[data-dsh-whale].edge-bottom .pet-official .body,
[data-dsh-whale].dragging.edge-bottom .pet-official .body {
  transform-origin: 50% 100%;
  animation: pw-squash 0.35s ease-out forwards !important;
}

[data-dsh-whale] .pet-official.petting .eye-group { animation: none; }
[data-dsh-whale] .pet-official.petting .eye-group .eye,
[data-dsh-whale] .pet-official.petting .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.petting .eye-group .sleep-eyes { display: inline !important; }

@keyframes pw-squash {
  0%   { transform: scaleX(1) scaleY(1); }
  100% { transform: scaleX(1.12) scaleY(0.8); }
}
`;
		//#endregion
		//#region src/client/sounds.ts
		const VOLUME_LEVELS = [
			"low",
			"mid",
			"high"
		];
		const VOLUME_GAIN = {
			low: .4,
			mid: 1,
			high: 1.6
		};
		const MUTE_KEY = "pet-whale:muted";
		const VOLUME_KEY = "pet-whale:volume";
		var WhaleSounds = class {
			ctx = null;
			/** 所有音效都接到这个总音量上，换档只改它的 gain */
			master = null;
			muted;
			level;
			disposed = false;
			resuming = false;
			constructor() {
				let muted = false;
				let level = "mid";
				try {
					muted = localStorage.getItem(MUTE_KEY) === "1";
					const raw = localStorage.getItem(VOLUME_KEY);
					if (VOLUME_LEVELS.includes(raw ?? "")) level = raw;
				} catch {}
				this.muted = muted;
				this.level = level;
			}
			get isMuted() {
				return this.muted;
			}
			get volume() {
				return this.level;
			}
			setVolume(level) {
				this.level = level;
				if (this.master !== null) this.master.gain.value = VOLUME_GAIN[level];
				try {
					localStorage.setItem(VOLUME_KEY, level);
				} catch {}
			}
			setMuted(muted) {
				this.muted = muted;
				try {
					localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
				} catch {}
			}
			/** 浏览器自动播放策略：AudioContext 需在用户手势后 resume，挂一次全局 pointerdown 解锁。 */
			installGestureUnlock() {
				if (this.disposed) return;
				document.addEventListener("pointerdown", this.unlock, {
					capture: true,
					passive: true
				});
			}
			unlock = () => {
				if (this.muted || this.disposed) return;
				try {
					this.acquire();
				} catch {}
			};
			/** 卸载时收干净：热重载一次留一个 AudioContext 和一个全局监听，攒多了会出怪事 */
			dispose() {
				if (this.disposed) return;
				this.disposed = true;
				document.removeEventListener("pointerdown", this.unlock, { capture: true });
				if (this.ctx !== null) this.ctx.close().catch(() => {});
				this.ctx = null;
				this.master = null;
			}
			acquire() {
				if (this.disposed) return null;
				if (this.ctx === null) {
					const Ctor = window.AudioContext ?? window.webkitAudioContext;
					if (Ctor === void 0) return null;
					this.ctx = new Ctor();
					this.master = this.ctx.createGain();
					this.master.gain.value = VOLUME_GAIN[this.level];
					this.master.connect(this.ctx.destination);
				}
				if (this.ctx.state === "suspended" && !this.resuming) {
					this.resuming = true;
					try {
						this.ctx.resume().catch(() => {}).finally(() => {
							this.resuming = false;
						});
					} catch {
						this.resuming = false;
					}
				}
				return this.ctx;
			}
			play(type) {
				if (this.muted) return;
				try {
					const ctx = this.acquire();
					if (ctx === null) return;
					const out = this.master ?? ctx.destination;
					const now = ctx.currentTime;
					if (type === "bubble") {
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "sine";
						osc.frequency.setValueAtTime(420, now);
						osc.frequency.exponentialRampToValueAtTime(840, now + .12);
						gain.gain.setValueAtTime(.3, now);
						gain.gain.exponentialRampToValueAtTime(.01, now + .14);
						osc.connect(gain);
						gain.connect(out);
						osc.start(now);
						osc.stop(now + .15);
					} else if (type === "work") {
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "triangle";
						osc.frequency.setValueAtTime(720, now);
						gain.gain.setValueAtTime(.18, now);
						gain.gain.exponentialRampToValueAtTime(.01, now + .06);
						osc.connect(gain);
						gain.connect(out);
						osc.start(now);
						osc.stop(now + .07);
					} else if (type === "celebrate") [
						523.25,
						659.25,
						783.99,
						1046.5
					].forEach((freq, i) => {
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "sine";
						osc.frequency.setValueAtTime(freq, now + i * .08);
						gain.gain.setValueAtTime(.2, now + i * .08);
						gain.gain.exponentialRampToValueAtTime(.01, now + i * .08 + .22);
						osc.connect(gain);
						gain.connect(out);
						osc.start(now + i * .08);
						osc.stop(now + i * .08 + .23);
					});
					else if (type === "error") {
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "sawtooth";
						osc.frequency.setValueAtTime(320, now);
						osc.frequency.exponentialRampToValueAtTime(140, now + .25);
						gain.gain.setValueAtTime(.15, now);
						gain.gain.exponentialRampToValueAtTime(.01, now + .26);
						osc.connect(gain);
						gain.connect(out);
						osc.start(now);
						osc.stop(now + .27);
					} else if (type === "snack") {
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "sine";
						osc.frequency.setValueAtTime(880, now);
						osc.frequency.exponentialRampToValueAtTime(580, now + .1);
						gain.gain.setValueAtTime(.25, now);
						gain.gain.exponentialRampToValueAtTime(.01, now + .12);
						osc.connect(gain);
						gain.connect(out);
						osc.start(now);
						osc.stop(now + .13);
					} else if (type === "trick") {
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "sine";
						osc.frequency.setValueAtTime(350, now);
						osc.frequency.exponentialRampToValueAtTime(1050, now + .35);
						gain.gain.setValueAtTime(.28, now);
						gain.gain.exponentialRampToValueAtTime(.01, now + .4);
						osc.connect(gain);
						gain.connect(out);
						osc.start(now);
						osc.stop(now + .42);
					}
				} catch {}
			}
		};
		//#endregion
		//#region src/client/state.ts
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
			current = "idle";
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
						changed: false
					};
				}
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
					if (turns > this.prevTurnEnds && err === null) this.transient = {
						state: "celebrate",
						until: now + CELEBRATE_MS
					};
					this.prevTurnEnds = turns;
				} else if (snap.turnEnds !== void 0 && snap.turnEnds.size > this.prevTurnEnds) this.prevTurnEnds = snap.turnEnds.size;
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
				const changed = next !== this.current;
				this.current = next;
				return {
					state: next,
					changed
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
		//#region src/client/palettes.ts
		const PALETTES = [
			{
				id: "terracotta",
				name: "陶土",
				light: "#BC6238",
				main: "#A3502C",
				dark: "#88431F",
				blush: "#D98E6A"
			},
			{
				id: "ocean",
				name: "深海蓝",
				light: "#7FA8DC",
				main: "#4A7FBE",
				dark: "#2E5A8C",
				blush: "#E8A2B0"
			},
			{
				id: "matcha",
				name: "抹茶绿",
				light: "#A8CC8F",
				main: "#6F9E5E",
				dark: "#43683A",
				blush: "#E8B08A"
			},
			{
				id: "sakura",
				name: "樱粉",
				light: "#F2A7C0",
				main: "#E0779B",
				dark: "#B04E72",
				blush: "#F5B9CD"
			},
			{
				id: "ink",
				name: "墨灰",
				light: "#B8B8B8",
				main: "#787878",
				dark: "#4C4C4C",
				blush: "#C89B9B"
			},
			{
				id: "night",
				name: "夜黑",
				light: "#4A4A4A",
				main: "#262626",
				dark: "#121212",
				blush: "#7A5C5C",
				eye: "#F7F2E6",
				pupil: "#2E2A24"
			},
			{
				id: "theme-blue",
				name: "主题蓝",
				light: "#8FB5FF",
				main: "#4D6BFE",
				dark: "#3550C9",
				blush: "#F0A0A0"
			},
			{
				id: "qinglian",
				name: "青莲",
				light: "#B4DED4",
				main: "#5E9E93",
				dark: "#3D6F68",
				blush: "#E79AA6"
			}
		];
		const DEFAULT_PALETTE = PALETTES.find((p) => p.id === "theme-blue") ?? PALETTES[0];
		const PALETTE_KEY = "pet-whale:palette";
		function loadPaletteId() {
			try {
				const raw = localStorage.getItem(PALETTE_KEY);
				if (raw !== null && PALETTES.some((p) => p.id === raw)) return raw;
			} catch {}
			return DEFAULT_PALETTE.id;
		}
		function savePaletteId(id) {
			try {
				localStorage.setItem(PALETTE_KEY, id);
			} catch {}
		}
		function paletteOf(id) {
			return PALETTES.find((p) => p.id === id) ?? DEFAULT_PALETTE;
		}
		/** 把色板写到根元素 CSS 变量上（SVG 里的 fill/stop-color 引这些变量）。 */
		function applyPalette(root, palette) {
			root.style.setProperty("--pw-body-light", palette.light);
			root.style.setProperty("--pw-body", palette.main);
			root.style.setProperty("--pw-body-dark", palette.dark);
			root.style.setProperty("--pw-blush", palette.blush);
			root.style.setProperty("--pw-eye", palette.eye ?? "#2E2A24");
			root.style.setProperty("--pw-pupil", palette.pupil ?? "#FBF8F0");
		}
		//#endregion
		//#region src/client/pets/index.ts
		/** 可切换的宠物列表，顺序即右键菜单里的顺序；第一只只作兜底，默认看 DEFAULT_PET_ID */
		const PETS = [
			{
				id: "whale",
				name: {
					zh: "小鲸鱼",
					en: "Whale"
				},
				icon: "🐳",
				html: `<svg viewBox="-2 -1 26 19" aria-hidden="true">
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color:var(--pw-body-light,#8FB5FF)"/>
              <stop offset="0.55" style="stop-color:var(--pw-body,#4D6BFE)"/>
              <stop offset="1" style="stop-color:var(--pw-body-dark,#3550C9)"/>
            </linearGradient>
            <clipPath id="whaleClip">
              <path d="M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z"/>
            </clipPath>
          </defs>

          <g class="body">
            <!-- 官方单一路径身体，去掉了原版的小眼睛孔 -->
            <path d="M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z" fill="url(#bodyGrad)" stroke="#3550C9" stroke-width="0.3" stroke-linejoin="round"/>

            <!-- 肚皮 -->
            <ellipse cx="11.2" cy="12.6" rx="8" ry="3.3" fill="#F7F2E6" clip-path="url(#whaleClip)"/>
            <!-- 背部高光 -->
            <ellipse cx="9.6" cy="3.5" rx="6.8" ry="1.55" fill="#FBF8F0" opacity=".3" clip-path="url(#whaleClip)" transform="rotate(-8 9.6 3.5)"/>
            <!-- 背部水面焦散折射波光 -->
            <path class="caustic-shimmer" d="M4 2.8 Q9.5 1.5 15 3.8 T21.5 2" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" opacity="0.18" clip-path="url(#whaleClip)"/>

            <!-- 纯正官方经典大眼：整组协调眨眼与闭眼，眼白绝不分离残留 -->
            <g class="eye-group">
              <circle class="eye" cx="5.55" cy="5.7" r="1.25" style="fill:var(--pw-eye,#2E2A24)"/>
              <circle class="pupil-highlight" cx="5.92" cy="5.35" r="0.42" style="fill:var(--pw-pupil,#FBF8F0)"/>
              <!-- 被抓/拖拽时的动漫勾勾眼（>_< 侧面单眼紧闭） -->
              <g class="caught-eyes" style="display:none" fill="none" stroke="var(--pw-eye,#2E2A24)" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6.3 4.6 L4.8 5.7 L6.3 6.8"/>
              </g>
              <!-- 睡着时的安详弯月眼（⌒ ⌒） -->
              <g class="sleep-eyes" style="display:none" fill="none" stroke="var(--pw-eye,#2E2A24)" stroke-width="0.8" stroke-linecap="round">
                <path d="M4.6 6.1 Q5.6 4.9 6.6 6.1"/>
              </g>
              <!-- 闹脾气：不闭眼，靠一道吊眉表达怒气。眉朝鼻尖（左）压低。
                   这么小的尺寸里闭眼画什么都糊成一团，睁眼 + 眉才读得出来。 -->
              <g class="angry-eyes" style="display:none" fill="none" stroke="var(--pw-eye,#2E2A24)" stroke-linecap="round">
                <path d="M4.15 4.35 L6.75 3.35" stroke-width="0.42"/>
              </g>
              <!-- 报错晕眩叉叉眼（×_×） -->
              <g class="dizzy-eyes" style="display:none" fill="none" stroke="var(--pw-eye,#2E2A24)" stroke-width="0.75" stroke-linecap="round">
                <path d="M4.7 4.8 L6.4 6.5 M6.4 4.8 L4.7 6.5"/>
              </g>
              <!-- 庆祝：笑成 ^ 的眼睛，跟睡觉、翻肚皮的弯月眼区分开 -->
              <g class="happy-eyes" style="display:none" fill="none" stroke="var(--pw-eye,#2E2A24)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4.5 6.3 L5.55 5.05 L6.6 6.3"/>
              </g>
              <!-- 失落：眼睛照常睁着，靠一道八字眉（朝鼻尖那头抬高）和一滴眼泪 -->
              <g class="sad-eyes" style="display:none" fill="none" stroke="var(--pw-eye,#2E2A24)" stroke-linecap="round">
                <path d="M4.1 3.45 Q5.3 3.55 6.6 4.3" stroke-width="0.4"/>
              </g>
            </g>
            <path class="tear" style="display:none" d="M6.35 6.75 Q6.85 7.55 6.85 7.85 A0.5 0.5 0 0 1 5.85 7.85 Q5.85 7.55 6.35 6.75 Z" fill="#9FD3FF" stroke="#6FB6F2" stroke-width="0.12"/>

            <!-- 气孔微喷泉（胜利/翻滚/觉醒时喷出） -->
            <g class="spout-group" style="display:none">
              <path class="spout-stream" d="M8.2 1.2 Q7.0 -2.0 5.2 -3.2" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="0.38" stroke-linecap="round"/>
              <path class="spout-stream" d="M8.6 1.1 Q8.7 -2.6 8.8 -3.8" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="0.45" stroke-linecap="round"/>
              <path class="spout-stream" d="M9.0 1.2 Q10.2 -2.0 12.0 -3.2" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="0.38" stroke-linecap="round"/>
              <circle class="spout-drop" cx="5.2" cy="-3.2" r="0.28" fill="#FFFFFF"/>
              <circle class="spout-drop" cx="8.8" cy="-3.8" r="0.32" fill="#FFFFFF"/>
              <circle class="spout-drop" cx="12.0" cy="-3.2" r="0.28" fill="#FFFFFF"/>
            </g>

            <!-- 软萌自然腮红 -->
            <ellipse class="blush" cx="6.6" cy="7.2" rx="0.75" ry="0.48" style="fill:var(--pw-blush,#F0A0A0)" opacity="0.5"/>

            <!-- 尴尬黑线 -->
            <g class="angry" style="display:none" stroke="var(--pw-eye,#2E2A24)" stroke-width="0.3" stroke-linecap="round">
              <line x1="5.7" y1="2.6" x2="5.15" y2="1.0"/>
              <line x1="7.0" y1="2.9" x2="7.0" y2="0.9"/>
              <line x1="8.3" y1="2.6" x2="8.85" y2="1.0"/>
            </g>
            <!-- 星星 -->
            <g class="stars" style="display:none">
              <path class="starL" d="M2.9 2.1 L 3.25 2.85 L 4.05 2.95 L 3.5 3.5 L 3.62 4.3 L 2.9 3.92 L 2.18 4.3 L 2.3 3.5 L 1.75 2.95 L 2.55 2.85 Z" fill="#E8C56B" style="transform-origin: 2.9px 3.2px"/>
              <path class="starR" d="M9.9 1.4 L 10.25 2.15 L 11.05 2.25 L 10.5 2.8 L 10.62 3.6 L 9.9 3.22 L 9.18 3.6 L 9.3 2.8 L 8.75 2.25 L 9.55 2.15 Z" fill="#E8C56B" style="transform-origin: 9.9px 2.5px"/>
            </g>
          </g>

          <!-- ⌨️ 代码粒子 -->
          <g class="code-particle" style="display:none">
            <text x="0.8" y="13.0" font-size="1.6" style="fill:var(--pw-body,#4D6BFE)" font-weight="bold" font-family="monospace" class="code-fx1">&lt;/&gt;</text>
            <text x="3.2" y="12.4" font-size="1.4" fill="#4D88FF" font-weight="bold" font-family="monospace" class="code-fx2">{;}</text>
          </g>

          <!-- ⌨️ 机械小键盘 -->
          <g class="keyboard-unit" style="display:none">
            <ellipse cx="3.8" cy="16.7" rx="4.8" ry="1.2" fill="rgba(46,42,36,0.18)"/>
            <path d="M-0.6 14.6 L7.4 13.8 L8.8 16.4 L0.2 17.0 Z" fill="#2E2A24" stroke="#5F2E15" stroke-width="0.22" stroke-linejoin="round"/>
            <path d="M-0.4 14.5 L7.2 13.7 L8.5 16.1 L0.4 16.7 Z" fill="#484139"/>
            <g class="tap-k1">
              <rect x="0.2" y="14.2" width="0.95" height="0.65" rx="0.15" fill="#F7F2E6"/>
              <rect x="1.4" y="14.1" width="0.95" height="0.65" rx="0.15" fill="#F7F2E6"/>
              <rect x="2.6" y="14.0" width="0.95" height="0.65" rx="0.15" fill="#F7F2E6"/>
              <rect x="3.8" y="13.9" width="0.95" height="0.65" rx="0.15" fill="#F7F2E6"/>
              <rect x="5.0" y="13.8" width="0.95" height="0.65" rx="0.15" fill="#F7F2E6"/>
              <rect x="6.2" y="13.7" width="1.1" height="0.65" rx="0.15" style="fill:var(--pw-body-light,#8FB5FF)"/>
            </g>
            <g class="tap-k2">
              <rect x="0.5" y="15.0" width="1.0" height="0.7" rx="0.15" fill="#F7F2E6"/>
              <rect x="1.75" y="14.9" width="1.0" height="0.7" rx="0.15" fill="#E8D9BC"/>
              <rect x="3.0" y="14.8" width="1.0" height="0.7" rx="0.15" fill="#F7F2E6"/>
              <rect x="4.25" y="14.7" width="1.0" height="0.7" rx="0.15" fill="#F7F2E6"/>
              <rect x="5.5" y="14.6" width="1.0" height="0.7" rx="0.15" fill="#E8D9BC"/>
              <rect x="6.75" y="14.5" width="1.2" height="0.7" rx="0.15" style="fill:var(--pw-blush,#F0A0A0)"/>
            </g>
            <g class="tap-k1">
              <rect x="0.8" y="15.85" width="1.4" height="0.75" rx="0.18" style="fill:var(--pw-body-light,#8FB5FF)"/>
              <rect x="2.5" y="15.75" width="3.4" height="0.75" rx="0.18" fill="#FBF8F0"/>
              <rect x="6.2" y="15.6" width="1.8" height="0.75" rx="0.18" style="fill:var(--pw-body,#4D6BFE)"/>
            </g>
          </g>
        </svg>
        <span class="bubble"></span>
        <span class="bubble b2"></span>
        <span class="bubble b3"></span>
        <span class="bubble-blue"></span>
        <span class="bubble-blue bb2"></span>
        <span class="bubble-blue bb3"></span>
        <span class="pat-heart">♥</span>`,
				css: `
[data-dsh-whale] .pet-official,
[data-dsh-whale-mini] {
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}
[data-dsh-whale] {
  --pw-ink: #2E2A24;
  --pw-body-light: #8FB5FF;
  --pw-body: #4D6BFE;
  --pw-body-dark: #3550C9;
  --pw-blush: #F0A0A0;
  --pw-eye: #2E2A24;
  --pw-pupil: #FBF8F0;
  /* 尺寸总闸：只改这一个变量，下面所有几何都跟着走 */
  --pw-scale: 1;
  position: fixed;
  z-index: 900;
  width: calc(137px * var(--pw-scale));
  height: calc(101px * var(--pw-scale));
  pointer-events: none;
  user-select: none;
  font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* 隐藏模式：整只收起来，只留右下角小按钮 */
[data-dsh-whale].hidden { display: none !important; }

/* 右下角召回小按钮（挂在 body 上，独立于鲸鱼本体） */
[data-dsh-whale-mini] {
  position: fixed;
  right: 14px;
  bottom: 14px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.22);
  background: linear-gradient(160deg, #4D6BFE, #2E3F9E);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0,0,0,.28);
  z-index: 901;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  transition: transform .18s ease, box-shadow .18s ease;
}
[data-dsh-whale-mini]:hover {
  transform: translateY(-2px) scale(1.07);
  box-shadow: 0 10px 24px rgba(0,0,0,.36);
}
[data-dsh-whale-mini]:active { transform: scale(.94); }

/* 小按钮随 agent 状态变色呼吸：idle 蓝 / think 深蓝 / working 橙 / celebrate 绿 / error 红 */
[data-dsh-whale-mini] { animation: pw-mini-breathe 3.2s ease-in-out infinite; }
[data-dsh-whale-mini][data-state="think"] { background: linear-gradient(160deg, #6E8BFF, #3D55D6); animation: pw-mini-think 1.6s ease-in-out infinite; }
[data-dsh-whale-mini][data-state="working"] { background: linear-gradient(160deg, #F5A623, #C97B0B); animation: pw-mini-work 0.8s ease-in-out infinite; }
[data-dsh-whale-mini][data-state="celebrate"] { background: linear-gradient(160deg, #3BC46D, #1E8A4A); animation: pw-mini-celebrate 0.9s ease-in-out infinite; }
[data-dsh-whale-mini][data-state="error"] { background: linear-gradient(160deg, #E5484D, #A61B20); animation: pw-mini-error 0.5s ease-in-out infinite; }
[data-dsh-whale-mini].dragging { cursor: move; animation: none !important; transition: none; }

/* 思考内容滚动条：think 时悬在桌宠正上方，内容向左缓慢滚动 */
[data-dsh-whale-think] {
  position: fixed;
  left: 50%;
  top: 0;
  transform: translate(-50%, -100%);
  display: none;
  align-items: center;
  gap: 8px;
  width: auto;
  max-width: 360px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(30, 34, 46, .82);
  color: #CFE0FF;
  font: 12px/1.4 ui-monospace, Consolas, "Courier New", monospace;
  border: 1px solid rgba(139,160,255,.25);
  box-shadow: 0 6px 20px rgba(0,0,0,.25);
  pointer-events: none;
  z-index: 899;
  white-space: nowrap;
  overflow: hidden;
}
[data-dsh-whale-think].show { display: flex; }
[data-dsh-whale-think] .dsh-whale-think-label { flex: none; opacity: .85; }
[data-dsh-whale-think] .dsh-whale-think-scroll { flex: 1; overflow: hidden; }
[data-dsh-whale-think] .dsh-whale-think-text {
  display: inline-block;
  will-change: transform;
  max-width: none;
}

[data-dsh-whale] .pet-official {
  width: calc(137px * var(--pw-scale));
  height: calc(101px * var(--pw-scale));
  position: relative;
  cursor: grab;
  pointer-events: auto;
}
[data-dsh-whale] .pet-official:active { cursor: grabbing; }
[data-dsh-whale] .pet-official svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  transform-origin: 50% 85%;
}

/* 地面阴影：独立兄弟元素，钉在地面，鲸鱼的任何动画（翻滚/跃起/深潜）都不带动它 */
[data-dsh-whale] .dsh-whale-shadow {
  position: absolute;
  left: 50%;
  bottom: calc(-12px * var(--pw-scale));
  width: calc(79px * var(--pw-scale));
  height: calc(12px * var(--pw-scale));
  margin-left: calc(-40px * var(--pw-scale));
  background: radial-gradient(ellipse, rgba(46,42,36,.24), transparent 65%);
  border-radius: 50%;
  animation: pw-shadowBob 3.2s ease-in-out infinite;
  pointer-events: none;
}

/* 游动时的水流尾波光晕 */
[data-dsh-whale] .dsh-whale-wake {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(146px * var(--pw-scale));
  height: calc(96px * var(--pw-scale));
  margin-left: calc(-73px * var(--pw-scale));
  margin-top: calc(-48px * var(--pw-scale));
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(143, 181, 255, 0.28) 0%, rgba(77, 107, 254, 0.08) 50%, transparent 72%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
  filter: blur(4px);
  z-index: 1;
}
[data-dsh-whale].swimming .dsh-whale-wake {
  opacity: 1;
  animation: pw-wakePulse 1.6s ease-in-out infinite alternate;
}

/* 泡泡（庆祝 + 点击） */
[data-dsh-whale] .bubble {
  position: absolute;
  left: 50%;
  bottom: 5px;
  width: 7px;
  height: 7px;
  margin-left: -3.5px;
  border-radius: 50%;
  background: rgba(232,217,188,.9);
  border: 1px solid rgba(46,42,36,.15);
  opacity: 0;
  pointer-events: none;
}
[data-dsh-whale] .bubble::after {
  content: "";
  position: absolute;
  left: 1.4px;
  top: 1.4px;
  width: 2.2px;
  height: 2.2px;
  border-radius: 50%;
  background: rgba(255,255,255,.85);
}
[data-dsh-whale] .bubble.show { animation: pw-rise 0.9s ease-out forwards; }

/* 深潜蓝泡 */
[data-dsh-whale] .bubble-blue {
  position: absolute;
  left: 50%;
  bottom: 4.5px;
  width: 6px;
  height: 6px;
  margin-left: -3.2px;
  border-radius: 50%;
  background: rgba(168,200,232,.78);
  border: 1px solid rgba(96,138,190,.4);
  opacity: 0;
  pointer-events: none;
}
[data-dsh-whale] .bubble-blue::after {
  content: "";
  position: absolute;
  left: 1.4px;
  top: 1.4px;
  width: 1.8px;
  height: 1.8px;
  border-radius: 50%;
  background: rgba(255,255,255,.85);
}

/* ===== 状态动画 ===== */
[data-dsh-whale] .pet-official .body { animation: pw-qbob 3.2s ease-in-out infinite; }
[data-dsh-whale] .pet-official .eye-group { animation: pw-blink 4.5s ease-in-out infinite; transform-origin: 5.55px 5.7px; }

[data-dsh-whale] .pet-official.think { animation: pw-dive2 3.2s ease-in-out infinite; }
[data-dsh-whale] .pet-official.think .bubble-blue { animation: pw-riseBlue 3.2s ease-out infinite; }
[data-dsh-whale] .pet-official.think .bubble-blue.bb2 { animation-delay: 0.9s; }
[data-dsh-whale] .pet-official.think .bubble-blue.bb3 { animation-delay: 1.8s; }

  [data-dsh-whale] .pet-official.swim-dive,
  [data-dsh-whale] .pet-official.swimming-dive { animation: pw-dive2 1.6s ease-in-out; filter: drop-shadow(0 6px 14px rgba(53, 80, 201, 0.28)); }
  [data-dsh-whale] .pet-official.swim-dive .bubble-blue,
  [data-dsh-whale] .pet-official.swimming-dive .bubble-blue { display: block; animation: pw-riseBlue 1.2s ease-out infinite; }
  [data-dsh-whale] .pet-official.swimming .body { animation: pw-swimBody 0.85s ease-in-out infinite alternate; }


[data-dsh-whale] .pet-official.working { animation: pw-swim 1.1s ease-in-out infinite; }
[data-dsh-whale] .pet-official.working .body { animation: none; }
[data-dsh-whale] .pet-official.working .keyboard-unit { display: block !important; }
[data-dsh-whale] .pet-official.working .code-particle { display: block !important; }

/* 思考：眼珠右上凝视 + 灵动高光微呼吸 */
[data-dsh-whale] .pet-official.think .pupil-highlight {
  animation: pw-pupilGaze 2s ease-in-out infinite alternate;
}

/* 报错：晕眩叉叉眼 */
[data-dsh-whale] .pet-official.error { animation: pw-shake 0.5s ease-in-out infinite; }
[data-dsh-whale] .pet-official.error .angry { display: block !important; animation: pw-angryJitter 0.5s ease-in-out infinite; }
[data-dsh-whale] .pet-official.error .eye-group .eye,
[data-dsh-whale] .pet-official.error .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.error .eye-group .dizzy-eyes {
  display: inline !important;
  transform-origin: 5.55px 5.7px;
  animation: pw-dizzyShake 0.4s ease-in-out infinite alternate;
}

/* 休眠：安详月牙眼 */
[data-dsh-whale].sleeping .eye-group .eye,
[data-dsh-whale].sleeping .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale].sleeping .eye-group .sleep-eyes { display: inline !important; }

/* 开心态 */
[data-dsh-whale] .pet-official.joy {
  animation: pw-joyHop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
[data-dsh-whale] .pet-official.joy .eye-group .eye,
[data-dsh-whale] .pet-official.joy .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.joy .eye-group .sleep-eyes { display: inline !important; }

/* 戳晕态 */
[data-dsh-whale] .pet-official.dizzy {
  animation: pw-dizzyWobble 0.8s ease-in-out !important;
}
[data-dsh-whale] .pet-official.dizzy .eye-group .eye,
[data-dsh-whale] .pet-official.dizzy .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.dizzy .eye-group .dizzy-eyes {
  display: inline !important;
  transform-origin: 5.55px 5.7px;
  animation: pw-dizzyShake 0.35s ease-in-out infinite alternate;
}

/* 甩晕态：抓着左右猛甩的结果 */
[data-dsh-whale] .pet-official.shaken .eye-group .eye,
[data-dsh-whale] .pet-official.shaken .eye-group .pupil-highlight { opacity: 0 !important; }
/* 正晕着比被抓住更该被看见，所以压过拖拽的眯眼 */
[data-dsh-whale].dragging .pet-official.shaken .eye-group .caught-eyes { display: none !important; }
[data-dsh-whale] .pet-official.shaken .eye-group .dizzy-eyes {
  display: inline !important;
  transform-origin: 5.55px 5.7px;
  animation: pw-dizzyShake 0.22s ease-in-out infinite alternate;
}
/* 身体只在松手后才摇：还攥在手里的时候它本来也动不了，
   而且拖拽态给 .pet-official 上了 !important 的 transform，动画压不过 */
[data-dsh-whale]:not(.dragging) .pet-official.shaken {
  animation: pw-dizzyWobble 0.7s ease-in-out 2 !important;
}

/* 翻肚皮：双击的专属反应 */
[data-dsh-whale] .pet-official.belly-up {
  animation: pw-bellyUp 2s cubic-bezier(0.34, 1.4, 0.64, 1) !important;
}
[data-dsh-whale] .pet-official.belly-up .eye-group .eye,
[data-dsh-whale] .pet-official.belly-up .eye-group .pupil-highlight { opacity: 0 !important; }
/* 借用弯月眼——翻着肚皮眯眼笑正是它该有的样子 */
[data-dsh-whale] .pet-official.belly-up .eye-group .sleep-eyes { display: inline !important; }

/* 贴边挤扁：横向压扁，方向由贴的是哪边决定 */
/* 后两条是为了压过拖拽态的 animation:none——特异性相同则后定义者胜，
   而那条规则写在本段之后，只靠前两条会被它盖掉 */
[data-dsh-whale].edge-left .pet-official .body,
[data-dsh-whale].edge-right .pet-official .body,
[data-dsh-whale].dragging.edge-left .pet-official .body,
[data-dsh-whale].dragging.edge-right .pet-official .body {
  transform-origin: 50% 50%;
  animation: pw-squeeze 0.35s ease-out forwards !important;
}
/* 上下压扁：锚在被压的那条边上，看着才像真被按住 */
[data-dsh-whale].edge-top .pet-official .body,
[data-dsh-whale].dragging.edge-top .pet-official .body {
  transform-origin: 50% 0%;
  animation: pw-squash 0.35s ease-out forwards !important;
}
[data-dsh-whale].edge-bottom .pet-official .body,
[data-dsh-whale].dragging.edge-bottom .pet-official .body {
  transform-origin: 50% 100%;
  animation: pw-squash 0.35s ease-out forwards !important;
}

/* 拖着不放又不动：晃着腰表示不耐烦 */
[data-dsh-whale].dragging .pet-official.impatient .body {
  animation: pw-impatientSway 0.9s ease-in-out infinite !important;
}

/* 连戳中段：不耐烦，侧身躲一下 */
[data-dsh-whale] .pet-official.annoyed {
  animation: pw-annoyedDodge 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) !important;
}

/* 连戳过头：闹脾气，扭头 + 吊眉怒眼 */
[data-dsh-whale] .pet-official.sulking {
  animation: pw-sulkTurn 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) forwards !important;
}
/* 生气不闭眼：眼睛留着瞪人，只加一道吊眉 */
[data-dsh-whale] .pet-official.sulking .eye-group .angry-eyes { display: inline !important; }

/* 欢迎态 */
[data-dsh-whale] .pet-official.welcome {
  animation: pw-leap2 1.2s ease-in-out !important;
}
[data-dsh-whale] .pet-official.welcome .stars { display: block !important; }
[data-dsh-whale] .pet-official.welcome .spout-group {
  display: inline !important;
  transform-origin: 8.6px 1.2px;
  animation: pw-spoutSpray 1.1s cubic-bezier(0.2, 0.8, 0.35, 1);
}

/* 庆祝与喷水柱 */
[data-dsh-whale] .pet-official.celebrate { animation: pw-leap2 1.4s ease-in-out infinite; }
/* 笑眼只在没有别的表情抢眼睛时出现：庆祝中被戳、甩晕、翻肚皮，各用各的眼睛 */
[data-dsh-whale]:not(.dragging) .pet-official.celebrate:not(.joy):not(.dizzy):not(.shaken):not(.belly-up):not(.petting) .eye-group .eye,
[data-dsh-whale]:not(.dragging) .pet-official.celebrate:not(.joy):not(.dizzy):not(.shaken):not(.belly-up):not(.petting) .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale]:not(.dragging) .pet-official.celebrate:not(.joy):not(.dizzy):not(.shaken):not(.belly-up):not(.petting) .eye-group .happy-eyes { display: inline !important; }
/* 笑眯着的眼睛不眨：一眨就压成一条横线，看着像睡着了 */
[data-dsh-whale] .pet-official.celebrate .eye-group { animation: none; }
[data-dsh-whale] .pet-official.celebrate .stars { display: block !important; }
[data-dsh-whale] .pet-official.celebrate .starL { animation: pw-starSpin 1.2s ease-in-out infinite; }
[data-dsh-whale] .pet-official.celebrate .starR { animation: pw-starSpin 1.2s ease-in-out 0.3s infinite; }
[data-dsh-whale] .pet-official.celebrate .bubble { animation: pw-rise 1.2s ease-out 0.3s infinite; }
[data-dsh-whale] .pet-official.celebrate .bubble.b2 { animation-delay: 0.7s; }
[data-dsh-whale] .pet-official.celebrate .bubble.b3 { animation-delay: 1.05s; }
[data-dsh-whale] .pet-official.celebrate .spout-group,
[data-dsh-whale] .pet-official.spouting .spout-group {
  display: inline !important;
  transform-origin: 8.6px 1.2px;
  animation: pw-spoutSpray 1.3s cubic-bezier(0.2, 0.8, 0.35, 1) infinite;
}

/* 摸头：你的鼠标在它头顶来回蹭。眯眼、腮红变深，每蹭一下头顶被按下去一点 */
[data-dsh-whale].patting .pet-official { cursor: ${`url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text x='16' y='24' font-size='22' text-anchor='middle'>🤚</text></svg>")}") 16 16, pointer`}; }
[data-dsh-whale] .pet-official.petting .eye-group { animation: none; }
[data-dsh-whale] .pet-official.petting .eye-group .eye,
[data-dsh-whale] .pet-official.petting .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.petting .eye-group .sleep-eyes { display: inline !important; }
[data-dsh-whale] .pet-official .blush { transition: opacity 0.3s ease; }
[data-dsh-whale] .pet-official.petting .blush { opacity: 0.9; }
[data-dsh-whale] .pet-official.pat-press .body {
  transform-origin: 50% 100%;
  animation: pw-patPress 0.3s ease-out !important;
}
[data-dsh-whale] .pat-heart {
  position: absolute;
  left: 26%;
  top: 0;
  color: #F07A8E;
  font-size: calc(15px * var(--pw-scale));
  line-height: 1;
  opacity: 0;
  pointer-events: none;
}
[data-dsh-whale] .pat-heart.show { animation: pw-heartFloat 1.1s ease-out forwards; }

/* 背部粼粼波光折射 */
[data-dsh-whale] .caustic-shimmer {
  animation: pw-causticDrift 4.2s ease-in-out infinite alternate;
}

[data-dsh-whale] .pet-official.wait { animation: pw-wait 1.2s ease-in-out infinite; }
[data-dsh-whale] .pet-official.wait .bubble-blue { display: block; animation: pw-riseBlue 1.2s ease-out infinite; }
[data-dsh-whale] .pet-official.disappointed { animation: pw-disappointed 2.6s ease-in-out infinite; }
/* 失落：眼珠往下垂、高光缩小，配八字眉和一滴往下掉的眼泪 */
[data-dsh-whale] .pet-official.disappointed .eye-group .eye { transform: translateY(0.25px); }
[data-dsh-whale] .pet-official.disappointed .eye-group .pupil-highlight { transform: translate(-0.12px, 0.45px) scale(0.7); transform-origin: 5.92px 5.35px; }
[data-dsh-whale] .pet-official.disappointed .eye-group .sad-eyes { display: inline !important; }
[data-dsh-whale] .pet-official.disappointed .tear {
  display: inline !important;
  animation: pw-tearDrop 1.3s ease-in infinite;
}


/* 双击翻滚特技 */
[data-dsh-whale] .pet-official.rolling { animation: pw-rollTrick 0.65s cubic-bezier(0.34, 1.4, 0.64, 1) !important; }

/* 点击挤压回弹：作用在 SVG 上，不干扰位置 */
[data-dsh-whale] .pet-official.squish svg { animation: pw-squish 0.42s cubic-bezier(0.25, 1.4, 0.5, 1); }

/* 拖拽中：暂停状态动画 + 斜拉变形 */
[data-dsh-whale].dragging .pet-official {
  animation: none !important;
  transform: scaleX(1) rotate(-5deg) scale(1.04, 0.96) !important;
}
[data-dsh-whale].dragging[data-facing="right"] .pet-official {
  transform: scaleX(-1) rotate(5deg) scale(1.04, 0.96) !important;
}
[data-dsh-whale].dragging .pet-official .body { animation: none !important; }

/* 被抓/拖拽：动漫勾勾眼（>_<），替换正常眼睛 */
[data-dsh-whale].dragging .eye-group .eye,
[data-dsh-whale].dragging .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale].dragging .eye-group .caught-eyes { display: inline !important; }
[data-dsh-whale].dragging .pet-official .eye-group .happy-eyes,
[data-dsh-whale].dragging .pet-official .eye-group .sad-eyes,
[data-dsh-whale].dragging .pet-official .tear { display: none !important; }
[data-dsh-whale].dragging .eye-group .caught-eyes path { stroke: var(--pw-eye, #2E2A24) !important; stroke-width: 0.9 !important; }

/* ===== 台词气泡 ===== */
[data-dsh-whale] .dsh-whale-dialog {
  position: absolute;
  top: -34px;
  left: 50%;
  transform: translateX(-50%);
  background: #FFFFFF;
  color: var(--pw-ink);
  border: 1px solid rgba(46,42,36,.15);
  border-radius: 12px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 4px 14px rgba(46,42,36,.08);
  pointer-events: none;
  opacity: 0;
  transform-origin: 50% 100%;
  transition: opacity .25s ease, transform .25s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 20;
}
[data-dsh-whale] .dsh-whale-dialog.show { opacity: 1; transform: translateX(-50%) scale(1); }
[data-dsh-whale] .dsh-whale-dialog::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 50%;
  margin-left: -5px;
  border-width: 5px 5px 0;
  border-style: solid;
  border-color: #FFFFFF transparent transparent;
}

/* ===== 投喂小鱼干 ===== */
[data-dsh-whale] .dsh-whale-snack {
  position: absolute;
  top: -7px;
  left: 14px;
  font-size: 14px;
  opacity: 0;
  pointer-events: none;
  z-index: 15;
}
[data-dsh-whale] .dsh-whale-snack.drop { animation: pw-dropSnack 0.7s ease-in forwards; }
[data-dsh-whale][data-facing="right"] .dsh-whale-snack { left: auto; right: 14px; }

/* ===== 角标：别的会话里正在跑的个数 =====
 * 挂在鲸鱼头前上方（朝右时镜像过去），做成一颗小气泡：实色渐变 + 左上高光 + 内阴影。
 * 三种动效各占一个独立变换属性，互不覆盖：
 *   translate — JS 每帧跟着鲸鱼身体的起伏走（index.ts 的 followBody）
 *   rotate    — 轻微左右摆
 *   scale     — 数字变化时弹一下 */
[data-dsh-whale] .dsh-whale-badge {
  position: absolute;
  top: calc(4px * var(--pw-scale));
  left: calc(-6px * var(--pw-scale));
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: 12px;
  /* 底色要够深，白字才看得清；亮面只交给 ::before 那一小块高光 */
  background: radial-gradient(circle at 35% 30%, var(--pw-body) 0%, var(--pw-body-dark) 85%);
  border: 1.5px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 3px 8px rgba(53, 80, 201, 0.32),
    inset 0 -2px 3px rgba(20, 30, 90, 0.22),
    inset 0 1px 2px rgba(255, 255, 255, 0.55);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 800;
  line-height: 21px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(20, 30, 90, 0.55);
  pointer-events: auto;
  cursor: default;
  z-index: 16;
  transform-origin: 50% 90%;
  animation: pw-badgeSway 2.8s ease-in-out infinite;
}
/* 气泡左上角的高光（右下角别再加小反光点，真机上看着像数字后面跟了个句号） */
[data-dsh-whale] .dsh-whale-badge::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 4px;
  width: 7px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  transform: rotate(-28deg);
  pointer-events: none;
}
[data-dsh-whale] .dsh-whale-badge.pop {
  animation: pw-badgeSway 2.8s ease-in-out infinite, pw-badgePop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
}
[data-dsh-whale][data-facing="right"] .dsh-whale-badge { left: auto; right: calc(-6px * var(--pw-scale)); }
@keyframes pw-badgeSway {
  0%, 100% { rotate: -6deg; }
  50% { rotate: 6deg; }
}
@keyframes pw-badgePop {
  0% { scale: 0.3; }
  60% { scale: 1.18 0.9; }
  80% { scale: 0.95 1.05; }
  100% { scale: 1; }
}
/* 以后给角标加 display 时，hidden 属性会被压过（青筋/星星踩过的坑），先钉死 */
[data-dsh-whale] .dsh-whale-badge[hidden] { display: none !important; }


/* ===== 打瞌睡 ===== */
[data-dsh-whale] .dsh-whale-zzz {
  position: absolute;
  left: 58%;
  top: 19px;
  font-size: 10px;
  font-weight: bold;
  color: #8F4427;
  opacity: 0;
  pointer-events: none;
}
[data-dsh-whale].sleeping .dsh-whale-zzz { animation: pw-zzzFloat 2.8s ease-in-out infinite; }
[data-dsh-whale].sleeping .pet-official .body { animation: pw-sleepBob 4s ease-in-out infinite !important; }
[data-dsh-whale].sleeping .pet-official .eye-group { transform: scaleY(0.08) !important; }
[data-dsh-whale].sleeping .pet-official .pupil-highlight { opacity: 0 !important; }

/* ===== 右键菜单 ===== */
[data-dsh-whale] .dsh-whale-menu {
  position: absolute;
  min-width: 132px;
  padding: 4px;
  border-radius: 10px;
  background: var(--dsw-hovercard-bg, #2C2C2E);
  color: var(--dsw-alias-text-1, #eee);
  box-shadow: var(--dsw-shadow-lv3, 0 8px 24px rgba(0,0,0,.25));
  pointer-events: auto;
  z-index: 30;
  display: none;
  font-size: 13px;
}
[data-dsh-whale] .dsh-whale-menu.open { display: block; }
[data-dsh-whale] .dsh-whale-menu button {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  padding: 6px 10px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
}
[data-dsh-whale] .dsh-whale-menu button:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,.1)); }
[data-dsh-whale] .dsh-whale-menu .pw-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: -2px;
  border: 1px solid rgba(255,255,255,.35);
}

  [data-dsh-whale] .dsh-whale-menu {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    min-width: 168px;
  }
  [data-dsh-whale] .dsh-whale-menu .pw-panel-title {
    padding: 8px 10px 4px;
    font-weight: 600;
    font-size: 13px;
    opacity: .92;
    border-bottom: 1px solid rgba(255,255,255,.08);
    margin-bottom: 4px;
  }
  [data-dsh-whale] .dsh-whale-menu .pw-panel-section {
    padding: 4px 6px;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  [data-dsh-whale] .dsh-whale-menu .pw-panel-section:last-of-type {
    border-bottom: none;
  }
  [data-dsh-whale] .dsh-whale-menu .pw-panel-section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .4px;
    opacity: .65;
    padding: 6px 4px 2px;
  }
  [data-dsh-whale] .dsh-whale-menu .pw-palette-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: auto;
    min-width: 86px;
    margin: 2px;
    padding: 5px 8px;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 8px;
    background: rgba(255,255,255,.04);
  }
  [data-dsh-whale] .dsh-whale-menu .pw-palette-btn:hover {
    background: rgba(255,255,255,.12);
  }
  [data-dsh-whale] .dsh-whale-menu .pw-back {
    margin-top: 4px;
    opacity: .75;
  }


/* 悬停腮红加深 */
[data-dsh-whale] .pet-official:hover .eye-group {
  filter: drop-shadow(0 0 1px rgba(217, 142, 106, 0.8));
}

/* ===== keyframes（pw- 前缀） ===== */
@keyframes pw-qbob {
  0%,100% { transform: translateY(0) scale(1, 1); }
  22%     { transform: translateY(-7px) scale(.985, 1.035); }
  50%     { transform: translateY(2px) scale(1.02, .965); }
  72%     { transform: translateY(-3px) scale(.995, 1.012); }
}
@keyframes pw-dive2 {
  0%, 10%  { transform: translateY(0) rotate(0) scale(1, 1); opacity: 1; }
  24%      { transform: translateY(9px) rotate(-7deg) scale(1.03, .95); opacity: .78; }
  38%, 70% { transform: translateY(33px) rotate(3deg) scale(.95, 1.05); opacity: .42; }
  84%      { transform: translateY(6px) rotate(-5deg) scale(1.03, .96); opacity: .85; }
  94%,100% { transform: translateY(0) rotate(0) scale(1, 1); opacity: 1; }
}
@keyframes pw-leap2 {
  0%, 100%  { transform: translateY(0) rotate(0) scale(1, 1); }
  14%       { transform: translateY(-27px) rotate(-10deg) scale(.97, 1.06); }
  36%       { transform: translateY(2px) rotate(5deg) scale(1.09, .88); }
  52%       { transform: translateY(-13px) rotate(-4deg) scale(.98, 1.04); }
  72%       { transform: translateY(-3px) rotate(2deg) scale(1.03, .94); }
}
@keyframes pw-shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-3.5px); }
  50%      { transform: translateX(2.5px); }
  75%      { transform: translateX(-2px); }
}
@keyframes pw-wait {
  0%, 100% { transform: translateY(0) rotate(0) scale(1, 1); }
  30%      { transform: translateY(-4px) rotate(-2deg) scale(1.01, .99); }
  60%      { transform: translateY(2px) rotate(2deg) scale(.99, 1.01); }
}
@keyframes pw-disappointed {
  0%, 100% { transform: translateY(0) rotate(0) scale(1, 1); opacity: 1; }
  40%      { transform: translateY(1px) rotate(-1.5deg) scale(0.99, 1.01); opacity: .88; }
  70%      { transform: translateY(0) rotate(1deg) scale(1, 0.99); opacity: .94; }
}


@keyframes pw-swim {
  0%,100% { transform: translateX(-3.5px) translateY(0) rotate(-1.5deg); }
  50%     { transform: translateX(3.5px) translateY(-2px) rotate(1.5deg); }
}
@keyframes pw-swimBody {
  0%   { transform: translateY(0) rotate(-1.2deg) scale(1, 1); }
  100% { transform: translateY(-1.8px) rotate(1.2deg) scale(0.99, 1.015); }
}
@keyframes pw-blink {
  0%, 91%, 100% { transform: scaleY(1); }
  94%           { transform: scaleY(0.08); }
  97%           { transform: scaleY(1); }
}
@keyframes pw-rise {
  0%   { transform: translateY(0) scale(.6); opacity: 0; }
  20%  { opacity: .9; }
  100% { transform: translateY(-50px) scale(1.1); opacity: 0; }
}
@keyframes pw-riseBlue {
  0%   { transform: translate(5px, 22px) scale(.5); opacity: 0; }
  25%  { opacity: .85; }
  100% { transform: translate(-7px, -33px) scale(1.15); opacity: 0; }
}
@keyframes pw-squish {
  0%   { transform: scale(1, 1); }
  25%  { transform: scale(1.15, 0.82); }
  55%  { transform: scale(0.93, 1.09); }
  78%  { transform: scale(1.03, 0.98); }
  100% { transform: scale(1, 1); }
}
@keyframes pw-rollTrick {
  0%   { transform: translateY(0) rotate(0deg) scale(1, 1); }
  30%  { transform: translateY(-22px) rotate(-120deg) scale(1.08, 0.92); }
  70%  { transform: translateY(-14px) rotate(-260deg) scale(0.95, 1.05); }
  100% { transform: translateY(0) rotate(-360deg) scale(1, 1); }
}
@keyframes pw-shadowBob {
  0%,100% { transform: scale(1); opacity: .9; }
  50%     { transform: scale(.78); opacity: .5; }
}
@keyframes pw-keyTap1 {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(0.4px); }
}
@keyframes pw-keyTap2 {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(0.4px); }
}
[data-dsh-whale] .tap-k1 { animation: pw-keyTap1 0.16s ease-in-out infinite alternate; }
[data-dsh-whale] .tap-k2 { animation: pw-keyTap2 0.18s ease-in-out 0.08s infinite alternate; }
@keyframes pw-codeFloat1 {
  0%   { transform: translateY(0) scale(0.5); opacity: 0; }
  30%  { opacity: 0.95; }
  100% { transform: translateY(-16px) translateX(-5px) scale(1); opacity: 0; }
}
@keyframes pw-codeFloat2 {
  0%   { transform: translateY(0) scale(0.5); opacity: 0; }
  30%  { opacity: 0.95; }
  100% { transform: translateY(-17px) translateX(4px) scale(1.05); opacity: 0; }
}
[data-dsh-whale] .code-fx1 { animation: pw-codeFloat1 1.2s ease-out infinite; }
[data-dsh-whale] .code-fx2 { animation: pw-codeFloat2 1.2s ease-out 0.6s infinite; }
@keyframes pw-starSpin {
  0%,100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50%     { transform: scale(1.3) rotate(22deg); opacity: .65; }
}
@keyframes pw-angryJitter {
  0%,100% { transform: translateX(0); }
  50%     { transform: translateX(-1.2px); }
}
@keyframes pw-sleepBob {
  0%,100% { transform: translateY(0) scale(1, 1); }
  50%     { transform: translateY(3px) scale(1.02, 0.97); }
}
@keyframes pw-zzzFloat {
  0%   { transform: translate(0, 0) scale(0.6); opacity: 0; }
  30%  { opacity: 0.9; }
  100% { transform: translate(10px, -17px) scale(1.15); opacity: 0; }
}
@keyframes pw-dropSnack {
  0%   { transform: translateY(0) rotate(0); opacity: 1; }
  80%  { transform: translateY(79px) rotate(45deg); opacity: 1; }
  100% { transform: translateY(90px) scale(0.5); opacity: 0; }
}

@keyframes pw-mini-breathe {
  0%,100% { box-shadow: 0 8px 20px rgba(0,0,0,.28); }
  50%     { box-shadow: 0 8px 24px rgba(77,107,254,.55); }
}
@keyframes pw-mini-think {
  0%,100% { box-shadow: 0 8px 20px rgba(61,85,214,.35); }
  50%     { box-shadow: 0 8px 26px rgba(110,139,255,.75); }
}
@keyframes pw-mini-work {
  0%,100% { opacity: 1; }
  50%     { opacity: .62; }
}
@keyframes pw-mini-celebrate {
  0%,100% { box-shadow: 0 8px 20px rgba(27,138,74,.35); }
  50%     { box-shadow: 0 10px 28px rgba(59,196,109,.85); }
}
@keyframes pw-mini-error {
  0%,100% { box-shadow: 0 8px 20px rgba(166,27,32,.35); }
  50%     { box-shadow: 0 8px 26px rgba(229,72,77,.85); }
}

/* ===== 全屏独立固定粒子层 ===== */
.pw-particle-layer {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 898;
  overflow: hidden;
}

/* ===== 水纹与水泡特效 ===== */
.pw-water-ripple {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  border: 1.5px solid rgba(143, 181, 255, 0.65);
  background: radial-gradient(ellipse at center, rgba(143, 181, 255, 0.22) 0%, rgba(77, 107, 254, 0.05) 55%, transparent 75%);
  transform: translate(-50%, -50%) scale(0.2);
  animation: pw-rippleFade 1s cubic-bezier(0.12, 0.8, 0.32, 1) forwards;
  z-index: 898;
  box-shadow: 0 0 8px rgba(143, 181, 255, 0.35);
}
@keyframes pw-rippleFade {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0.85;
  }
  60% {
    opacity: 0.45;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.65);
    opacity: 0;
  }
}

.pw-stream-bubble {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FFFFFF 0%, rgba(180, 215, 255, 0.85) 55%, rgba(77, 107, 254, 0.45) 100%);
  border: 0.8px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 4px rgba(143, 181, 255, 0.5), inset -1px -1px 2px rgba(53, 80, 201, 0.3);
  animation: pw-bubbleFloat var(--pw-b-dur, 1.1s) cubic-bezier(0.2, 0.7, 0.4, 1) forwards;
  z-index: 899;
}
@keyframes pw-bubbleFloat {
  0% {
    transform: translate(0, 0) scale(0.3);
    opacity: 0;
  }
  20% {
    opacity: 0.95;
  }
  80% {
    opacity: 0.75;
    transform: translate(var(--pw-b-dx, -10px), var(--pw-b-dy, -20px)) scale(1.05);
  }
  100% {
    transform: translate(calc(var(--pw-b-dx, -10px) * 1.3), calc(var(--pw-b-dy, -20px) - 16px)) scale(0.2);
    opacity: 0;
  }
}

@keyframes pw-wakePulse {
  0%   { transform: scale(0.9, 0.82) rotate(-2.5deg); opacity: 0.45; }
  100% { transform: scale(1.18, 1.08) rotate(2.5deg); opacity: 0.85; }
}

@keyframes pw-spoutSpray {
  0%   { transform: scale(0.2) translateY(2px); opacity: 0; }
  25%  { transform: scale(1) translateY(0); opacity: 0.95; }
  70%  { transform: scale(1.08) translateY(-1.5px); opacity: 0.75; }
  100% { transform: scale(1.15) translateY(-3px); opacity: 0; }
}

@keyframes pw-pupilGaze {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(0.35px, -0.42px); }
}

@keyframes pw-annoyedDodge {
  0%   { transform: translateX(0) rotate(0deg); }
  35%  { transform: translateX(-9px) rotate(-7deg); }
  65%  { transform: translateX(4px) rotate(3deg); }
  100% { transform: translateX(0) rotate(0deg); }
}
/* 背过身：横向翻面到一半停住，读作"扭头不看你" */
@keyframes pw-sulkTurn {
  0%   { transform: rotate(0deg) scale(1, 1); }
  45%  { transform: rotate(-10deg) scale(0.94, 1.05); }
  100% { transform: rotate(-6deg) scale(0.97, 1.02); }
}
@keyframes pw-dizzyShake {
  0%   { transform: rotate(-12deg) scale(0.95); }
  100% { transform: rotate(12deg) scale(1.05); }
}

@keyframes pw-dizzyWobble {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25%      { transform: rotate(-7deg) scale(0.96); }
  75%      { transform: rotate(7deg) scale(0.96); }
}

@keyframes pw-bellyUp {
  0%   { transform: rotate(0deg) translateY(0); }
  20%  { transform: rotate(160deg) translateY(-18px); }
  35%  { transform: rotate(180deg) translateY(-6px); }
  75%  { transform: rotate(180deg) translateY(-6px); }
  100% { transform: rotate(360deg) translateY(0); }
}

@keyframes pw-squeeze {
  0%   { transform: scaleX(1) scaleY(1); }
  100% { transform: scaleX(0.82) scaleY(1.1); }
}

@keyframes pw-patPress {
  0%   { transform: scale(1, 1); }
  35%  { transform: scale(1.05, 0.9); }
  100% { transform: scale(1, 1); }
}
@keyframes pw-heartFloat {
  0%   { transform: translateY(4px) scale(0.5); opacity: 0; }
  25%  { transform: translateY(0) scale(1.1); opacity: 1; }
  100% { transform: translateY(-22px) scale(0.9); opacity: 0; }
}

@keyframes pw-tearDrop {
  0%   { transform: translateY(-0.4px) scale(0.4); opacity: 0; }
  25%  { transform: translateY(0) scale(1); opacity: 1; }
  70%  { transform: translateY(1.6px) scale(1); opacity: 1; }
  100% { transform: translateY(2.6px) scale(0.9); opacity: 0; }
}

@keyframes pw-squash {
  0%   { transform: scaleX(1) scaleY(1); }
  100% { transform: scaleX(1.12) scaleY(0.8); }
}

@keyframes pw-impatientSway {
  0%, 100% { transform: rotate(0deg); }
  30%      { transform: rotate(-5deg); }
  70%      { transform: rotate(5deg); }
}

@keyframes pw-joyHop {
  0%, 100% { transform: translateY(0) scale(1); }
  35%      { transform: translateY(-16px) scale(1.08, 0.94); }
  65%      { transform: translateY(-4px) scale(0.96, 1.04); }
}

@keyframes pw-causticDrift {
  0%   { transform: translate(-0.6px, 0.3px); opacity: 0.12; stroke-width: 0.9; }
  50%  { opacity: 0.28; stroke-width: 1.25; }
  100% { transform: translate(0.6px, -0.3px); opacity: 0.14; stroke-width: 1.0; }
}

/* 破浪跃水与着陆飞溅水滴 */
.pw-splash-drop {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FFFFFF 0%, rgba(180, 215, 255, 0.9) 60%, rgba(77, 107, 254, 0.5) 100%);
  box-shadow: 0 0 3px rgba(143, 181, 255, 0.6);
  animation: pw-splashFall var(--pw-sp-dur, 0.65s) cubic-bezier(0.25, 0.9, 0.4, 1) forwards;
  z-index: 899;
}
@keyframes pw-splashFall {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.95;
  }
  60% {
    opacity: 0.85;
  }
  100% {
    transform: translate(var(--pw-sp-dx, 12px), var(--pw-sp-dy, 35px)) scale(0.2);
    opacity: 0;
  }
}

/* 悬空拖拽滴水 */
.pw-drag-drip {
  position: absolute;
  pointer-events: none;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, rgba(160, 205, 255, 0.85) 60%, rgba(77, 107, 254, 0.4) 100%);
  box-shadow: 0 0 3px rgba(143, 181, 255, 0.4);
  animation: pw-dripFall 0.52s cubic-bezier(0.45, 0.05, 0.85, 0.6) forwards;
  z-index: 897;
}
@keyframes pw-dripFall {
  0% {
    transform: translate(0, 0) scale(0.6);
    opacity: 0.9;
  }
  50% {
    transform: translate(0, 14px) scale(0.9, 1.25);
    opacity: 0.85;
  }
  100% {
    transform: translate(0, 46px) scale(0.3, 0.1);
    opacity: 0;
  }
}

/* 庆祝彩屑粒子 */
.pw-confetti {
  position: absolute;
  pointer-events: none;
  width: var(--pw-cf-w, 7px);
  height: var(--pw-cf-h, 10px);
  background: var(--pw-cf-bg, #4D6BFE);
  border-radius: var(--pw-cf-r, 2px);
  opacity: 0.95;
  animation: pw-confettiFall var(--pw-cf-dur, 1.1s) cubic-bezier(0.22, 0.8, 0.36, 1) forwards;
  z-index: 899;
}
@keyframes pw-confettiFall {
  0% {
    transform: translate(0, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    opacity: 1;
  }
  60% {
    opacity: 0.85;
  }
  100% {
    transform: translate(var(--pw-cf-dx, 35px), var(--pw-cf-dy, 100px)) rotateX(540deg) rotateY(360deg) rotateZ(270deg);
    opacity: 0;
  }
}

/* 陪伴统计项目 */
[data-dsh-whale] .dsh-whale-menu .pw-stats-item {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 12px;
  padding: 6px 10px;
  margin-bottom: 4px;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0.95;
}
[data-dsh-whale][data-theme="dark"] .dsh-whale-menu .pw-stats-item {
  background: rgba(255, 255, 255, 0.08);
  color: #F2F2F0;
}

/* 后台省电：页面不可见时暂停一切动画 */
[data-dsh-whale].paused,
[data-dsh-whale].paused * { animation-play-state: paused !important; transition: none !important; }
[data-dsh-whale-mini].paused { animation: none !important; }

/* 主题联动：DSH 暗色主题下的 UI 皮肤 */
[data-dsh-whale][data-theme="dark"] .dsh-whale-dialog {
  background: #2C2C2E;
  color: #F2F2F0;
  border-color: rgba(255,255,255,.12);
}
[data-dsh-whale][data-theme="dark"] .dsh-whale-dialog::after {
  border-color: #2C2C2E transparent transparent;
}
[data-dsh-whale][data-theme="dark"] .dsh-whale-shadow {
  background: radial-gradient(ellipse, rgba(0,0,0,.5), transparent 65%);
}
[data-dsh-whale][data-theme="dark"] .dsh-whale-wake {
  background: radial-gradient(ellipse at center, rgba(110, 145, 255, 0.22) 0%, rgba(53, 80, 201, 0.06) 50%, transparent 72%);
}

/* 减少动态效果：全关动画 */
@media (prefers-reduced-motion: reduce) {
  [data-dsh-whale-mini] { animation: none !important; transition: none !important; }
  [data-dsh-whale] *,
  [data-dsh-whale] { animation: none !important; transition: none !important; }
  .pw-water-ripple, .pw-stream-bubble, .pw-splash-drop, .pw-drag-drip, .pw-confetti { display: none !important; }
}
`
			},
			{
				id: "cat",
				name: {
					zh: "小猫",
					en: "Cat"
				},
				icon: "🐱",
				html: `<svg viewBox="0 0 26 19" aria-hidden="true">
          <defs>
            <linearGradient id="catGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color:var(--pw-body-light,#8FB5FF)"/>
              <stop offset="0.55" style="stop-color:var(--pw-body,#4D6BFE)"/>
              <stop offset="1" style="stop-color:var(--pw-body-dark,#3550C9)"/>
            </linearGradient>
          </defs>

          <g class="body">
            <!-- 尾巴：挂在右边，绕着屁股摆 -->
            <path class="tail" d="M17.9 16.2 C21.2 16.5 22.9 13.9 21.3 11.5" fill="none" stroke="url(#catGrad)" stroke-width="1.5" stroke-linecap="round" style="transform-origin: 17.9px 16.2px"/>

            <!-- 耳朵（画在头后面） -->
            <path d="M10.6 3.4 L9.6 0.5 L12.6 1.9 Z" fill="url(#catGrad)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.26" stroke-linejoin="round"/>
            <path d="M15.4 3.4 L16.4 0.5 L13.4 1.9 Z" fill="url(#catGrad)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.26" stroke-linejoin="round"/>
            <path d="M10.8 2.9 L10.2 1.3 L11.7 2.05 Z" fill="var(--pw-blush,#F0A0A0)" opacity=".8"/>
            <path d="M15.2 2.9 L15.8 1.3 L14.3 2.05 Z" fill="var(--pw-blush,#F0A0A0)" opacity=".8"/>

            <!-- 坐姿身体：肩窄臀宽 -->
            <path d="M13 8.4 C10.4 8.4 8.6 10.2 8.0 13.0 C7.5 15.2 8.0 17.1 8.9 17.5 L17.1 17.5 C18.0 17.1 18.5 15.2 18.0 13.0 C17.4 10.2 15.6 8.4 13 8.4 Z" fill="url(#catGrad)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.28" stroke-linejoin="round"/>
            <!-- 胸口浅色 -->
            <ellipse cx="13" cy="14.2" rx="3.5" ry="2.9" style="fill:var(--pw-body-light,#8FB5FF)" opacity=".45"/>
            <!-- 前爪 -->
            <ellipse cx="10.9" cy="17.25" rx="1.5" ry="0.68" style="fill:var(--pw-body-light,#8FB5FF)"/>
            <ellipse cx="15.1" cy="17.25" rx="1.5" ry="0.68" style="fill:var(--pw-body-light,#8FB5FF)"/>

            <!-- 头 -->
            <circle cx="13" cy="6.3" r="4.35" fill="url(#catGrad)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.28"/>
            <!-- 口鼻区 -->
            <ellipse cx="13" cy="8.0" rx="2.0" ry="1.3" style="fill:var(--pw-body-light,#8FB5FF)" opacity=".8"/>
            <path d="M12.62 7.33 L13.38 7.33 L13.0 7.76 Z" style="fill:var(--pw-eye,#2E2A24)"/>
            <path d="M13 7.76 C13 8.32 12.55 8.56 12.16 8.42 M13 7.76 C13 8.32 13.45 8.56 13.84 8.42" fill="none" style="stroke:var(--pw-eye,#2E2A24)" stroke-width="0.16" stroke-linecap="round"/>
            <!-- 胡须 -->
            <g style="stroke:var(--pw-eye,#2E2A24)" stroke-width="0.11" stroke-linecap="round" opacity=".45" fill="none">
              <path d="M10.4 7.7 L7.6 7.25"/>
              <path d="M10.4 8.15 L7.7 8.2"/>
              <path d="M10.5 8.6 L7.9 9.05"/>
              <path d="M15.6 7.7 L18.4 7.25"/>
              <path d="M15.6 8.15 L18.3 8.2"/>
              <path d="M15.5 8.6 L18.1 9.05"/>
            </g>
            <!-- 腮红 -->
            <ellipse class="cat-blush" cx="10.05" cy="8.1" rx="0.85" ry="0.48" style="fill:var(--pw-blush,#F0A0A0)" opacity=".45"/>
            <ellipse class="cat-blush" cx="15.95" cy="8.1" rx="0.85" ry="0.48" style="fill:var(--pw-blush,#F0A0A0)" opacity=".45"/>

            <!-- 眼睛：正常 / 被抓 / 眯笑 / 晕眩 / 吊眉 -->
            <g class="eye-group">
              <ellipse class="eye" cx="11.25" cy="5.95" rx="0.92" ry="1.15" style="fill:var(--pw-eye,#2E2A24)"/>
              <ellipse class="eye" cx="14.75" cy="5.95" rx="0.92" ry="1.15" style="fill:var(--pw-eye,#2E2A24)"/>
              <g class="pupil-highlight">
                <circle cx="11.5" cy="5.55" r="0.33" style="fill:var(--pw-pupil,#FBF8F0)"/>
                <circle cx="15.0" cy="5.55" r="0.33" style="fill:var(--pw-pupil,#FBF8F0)"/>
              </g>
              <g class="caught-eyes" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.34" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.55 5.45 L11.6 5.98 L10.55 6.5"/>
                <path d="M15.45 5.45 L14.4 5.98 L15.45 6.5"/>
              </g>
              <g class="sleep-eyes" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.3" stroke-linecap="round">
                <path d="M10.4 6.12 Q11.25 5.35 12.1 6.12"/>
                <path d="M13.9 6.12 Q14.75 5.35 15.6 6.12"/>
              </g>
              <g class="dizzy-eyes" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.26" stroke-linecap="round">
                <path d="M10.7 5.45 L11.8 6.55 M11.8 5.45 L10.7 6.55"/>
                <path d="M14.2 5.45 L15.3 6.55 M15.3 5.45 L14.2 6.55"/>
              </g>
              <g class="angry-eyes" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.3" stroke-linecap="round">
                <path d="M10.35 4.85 L12.05 5.5"/>
                <path d="M15.65 4.85 L13.95 5.5"/>
              </g>
            </g>

            <!-- 闹脾气的青筋 -->
            <g class="angry" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.26" stroke-linecap="round">
              <path d="M18.95 2.5 L19.6 3.9"/>
              <path d="M20.15 3.2 L20.8 4.6"/>
            </g>

            <!-- 星星 -->
            <g class="stars" style="display:none">
              <path class="starL" d="M6.4 1.6 L6.68 2.32 L7.4 2.6 L6.68 2.88 L6.4 3.6 L6.12 2.88 L5.4 2.6 L6.12 2.32 Z" fill="#E8C56B" style="transform-origin: 6.4px 2.6px"/>
              <path class="starR" d="M19.6 1.2 L19.88 1.92 L20.6 2.2 L19.88 2.48 L19.6 3.2 L19.32 2.48 L18.6 2.2 L19.32 1.92 Z" fill="#E8C56B" style="transform-origin: 19.6px 2.2px"/>
            </g>

            <!-- 兴奋的小喷气 -->
            <g class="spout-group" style="display:none">
              <circle class="spout-drop" cx="11.5" cy="0.95" r="0.32" style="fill:var(--pw-body-light,#8FB5FF)"/>
              <circle class="spout-drop" cx="13.0" cy="0.4" r="0.42" style="fill:var(--pw-body-light,#8FB5FF)"/>
              <circle class="spout-drop" cx="14.5" cy="0.95" r="0.32" style="fill:var(--pw-body-light,#8FB5FF)"/>
              <path class="spout-stream" d="M11.2 2.1 Q10.6 1.5 11.4 1.0" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.28" stroke-linecap="round" opacity=".85"/>
              <path class="spout-stream" d="M14.8 2.1 Q15.4 1.5 14.6 1.0" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.28" stroke-linecap="round" opacity=".85"/>
            </g>
          </g>

          <!-- 代码粒子 -->
          <g class="code-particle" style="display:none">
            <text x="4.2" y="12.2" font-size="1.6" style="fill:var(--pw-body,#4D6BFE)" font-weight="bold" font-family="monospace" class="code-fx1">&lt;/&gt;</text>
            <text x="18.6" y="11.4" font-size="1.4" style="fill:var(--pw-body,#4D6BFE)" font-weight="bold" font-family="monospace" class="code-fx2">{;}</text>
          </g>

          <!-- 小键盘 + 两只敲键的爪子 -->
          <g class="keyboard-unit" style="display:none">
            <ellipse cx="13" cy="17.7" rx="5.4" ry="1.05" fill="rgba(46,42,36,0.18)"/>
            <path d="M8.4 15.45 L17.6 15.25 L18.3 17.0 L7.8 17.2 Z" fill="#2E2A24" stroke="#5F2E15" stroke-width="0.2" stroke-linejoin="round"/>
            <path d="M8.6 15.45 L17.4 15.3 L18.0 16.85 L8.0 17.0 Z" fill="#484139"/>
            <g class="tap-k1">
              <rect x="8.7" y="15.65" width="0.9" height="0.6" rx="0.14" fill="#F7F2E6"/>
              <rect x="10.15" y="15.6" width="0.9" height="0.6" rx="0.14" fill="#F7F2E6"/>
              <rect x="11.6" y="15.55" width="0.9" height="0.6" rx="0.14" style="fill:var(--pw-body-light,#8FB5FF)"/>
              <rect x="13.05" y="15.5" width="0.9" height="0.6" rx="0.14" fill="#F7F2E6"/>
              <rect x="14.5" y="15.5" width="0.9" height="0.6" rx="0.14" fill="#E8D9BC"/>
              <rect x="15.95" y="15.5" width="0.9" height="0.6" rx="0.14" fill="#F7F2E6"/>
              <ellipse cx="10.5" cy="15.95" rx="1.05" ry="0.6" style="fill:var(--pw-body-light,#8FB5FF)"/>
            </g>
            <g class="tap-k2">
              <rect x="8.9" y="16.5" width="0.9" height="0.6" rx="0.14" fill="#F7F2E6"/>
              <rect x="10.35" y="16.45" width="0.9" height="0.6" rx="0.14" fill="#E8D9BC"/>
              <rect x="11.8" y="16.4" width="0.9" height="0.6" rx="0.14" fill="#F7F2E6"/>
              <rect x="13.25" y="16.35" width="0.9" height="0.6" rx="0.14" style="fill:var(--pw-blush,#F0A0A0)"/>
              <rect x="14.7" y="16.35" width="0.9" height="0.6" rx="0.14" fill="#F7F2E6"/>
              <rect x="16.15" y="16.3" width="0.9" height="0.6" rx="0.14" fill="#F7F2E6"/>
              <ellipse cx="15.5" cy="16.8" rx="1.05" ry="0.6" style="fill:var(--pw-body-light,#8FB5FF)"/>
            </g>
          </g>
        </svg><span class="pat-heart">♥</span>
        <span class="bubble"></span>
        <span class="bubble b2"></span>
        <span class="bubble b3"></span>
        <span class="bubble-blue"></span>
        <span class="bubble-blue bb2"></span>
        <span class="bubble-blue bb3"></span>`,
				css: `
/* ===== 泡泡（庆祝 + 点击）：HTML span，绝对定位在 .pet-official 上 ===== */
[data-dsh-whale] .bubble {
  position: absolute;
  left: 50%;
  bottom: 5px;
  width: 7px;
  height: 7px;
  margin-left: -3.5px;
  border-radius: 50%;
  background: rgba(232,217,188,.9);
  border: 1px solid rgba(46,42,36,.15);
  opacity: 0;
  pointer-events: none;
}
[data-dsh-whale] .bubble::after {
  content: "";
  position: absolute;
  left: 1.4px;
  top: 1.4px;
  width: 2.2px;
  height: 2.2px;
  border-radius: 50%;
  background: rgba(255,255,255,.85);
}
[data-dsh-whale] .bubble.show { animation: cat-rise 0.9s ease-out forwards; }

/* 深潜蓝泡 */
[data-dsh-whale] .bubble-blue {
  position: absolute;
  left: 50%;
  bottom: 4.5px;
  width: 6px;
  height: 6px;
  margin-left: -3.2px;
  border-radius: 50%;
  background: rgba(168,200,232,.78);
  border: 1px solid rgba(96,138,190,.4);
  opacity: 0;
  pointer-events: none;
}
[data-dsh-whale] .bubble-blue::after {
  content: "";
  position: absolute;
  left: 1.4px;
  top: 1.4px;
  width: 1.8px;
  height: 1.8px;
  border-radius: 50%;
  background: rgba(255,255,255,.85);
}

/* ===== 待机 ===== */
[data-dsh-whale] .pet-official .body { animation: cat-breathe 3.6s ease-in-out infinite; }
[data-dsh-whale] .pet-official .tail { animation: cat-tailSway 3.2s ease-in-out infinite; }
[data-dsh-whale] .pet-official .eye-group { animation: cat-blink 4.6s ease-in-out infinite; transform-origin: 13px 5.95px; }

/* ===== 思考：蹲低 + 盯屏幕，蓝泡上浮 ===== */
[data-dsh-whale] .pet-official.think { animation: cat-crouch 3.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official.think .bubble-blue { animation: cat-riseBlue 3.2s ease-out infinite; }
[data-dsh-whale] .pet-official.think .bubble-blue.bb2 { animation-delay: 0.9s; }
[data-dsh-whale] .pet-official.think .bubble-blue.bb3 { animation-delay: 1.8s; }
[data-dsh-whale] .pet-official.think .pupil-highlight { animation: cat-pupilGaze 2s ease-in-out infinite alternate; }

/* 游动（自主巡游） */
[data-dsh-whale] .pet-official.swim-dive,
[data-dsh-whale] .pet-official.swimming-dive { animation: cat-crouch 1.6s ease-in-out; filter: drop-shadow(0 6px 14px rgba(53, 80, 201, 0.28)); }
[data-dsh-whale] .pet-official.swim-dive .bubble-blue,
[data-dsh-whale] .pet-official.swimming-dive .bubble-blue { display: block; animation: cat-riseBlue 1.2s ease-out infinite; }
[data-dsh-whale] .pet-official.swimming .body { animation: cat-swimBody 0.85s ease-in-out infinite alternate; }

/* ===== 工作：敲键盘 + 代码粒子 ===== */
[data-dsh-whale] .pet-official.working { animation: cat-workWiggle 0.9s ease-in-out infinite; }
[data-dsh-whale] .pet-official.working .body { animation: none; }
[data-dsh-whale] .pet-official.working .keyboard-unit { display: block !important; }
[data-dsh-whale] .pet-official.working .code-particle { display: block !important; }

/* ===== 报错：炸毛 + 叉叉眼 ===== */
[data-dsh-whale] .pet-official.error { animation: cat-shake 0.5s ease-in-out infinite; }
[data-dsh-whale] .pet-official.error .angry { display: block !important; animation: cat-angryJitter 0.5s ease-in-out infinite; }
[data-dsh-whale] .pet-official.error .eye-group .eye,
[data-dsh-whale] .pet-official.error .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.error .eye-group .dizzy-eyes {
  display: inline !important;
  transform-origin: 13px 5.95px;
  animation: cat-dizzyShake 0.4s ease-in-out infinite alternate;
}

/* ===== 休眠：月牙眼 ===== */
[data-dsh-whale].sleeping .eye-group .eye,
[data-dsh-whale].sleeping .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale].sleeping .eye-group .sleep-eyes { display: inline !important; }

/* ===== 开心 ===== */
[data-dsh-whale] .pet-official.joy { animation: cat-joyHop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) !important; }
[data-dsh-whale] .pet-official.joy .eye-group .eye,
[data-dsh-whale] .pet-official.joy .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.joy .eye-group .sleep-eyes { display: inline !important; }

/* ===== 戳晕 ===== */
[data-dsh-whale] .pet-official.dizzy { animation: cat-dizzyWobble 0.8s ease-in-out !important; }
[data-dsh-whale] .pet-official.dizzy .eye-group .eye,
[data-dsh-whale] .pet-official.dizzy .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.dizzy .eye-group .dizzy-eyes {
  display: inline !important;
  transform-origin: 13px 5.95px;
  animation: cat-dizzyShake 0.35s ease-in-out infinite alternate;
}

/* ===== 甩晕 ===== */
[data-dsh-whale] .pet-official.shaken .eye-group .eye,
[data-dsh-whale] .pet-official.shaken .eye-group .pupil-highlight { opacity: 0 !important; }
/* 正晕着比被抓住更该被看见，所以压过拖拽的勾勾眼 */
[data-dsh-whale].dragging .pet-official.shaken .eye-group .caught-eyes { display: none !important; }
[data-dsh-whale] .pet-official.shaken .eye-group .dizzy-eyes {
  display: inline !important;
  transform-origin: 13px 5.95px;
  animation: cat-dizzyShake 0.22s ease-in-out infinite alternate;
}
/* 松手后才摇身体：拖拽态给 .pet-official 上了 !important 的 transform，动画压不过 */
[data-dsh-whale]:not(.dragging) .pet-official.shaken { animation: cat-dizzyWobble 0.7s ease-in-out 2 !important; }

/* ===== 翻肚皮（双击的专属反应） ===== */
[data-dsh-whale] .pet-official.belly-up { animation: cat-bellyUp 2s cubic-bezier(0.34, 1.4, 0.64, 1) !important; }
[data-dsh-whale] .pet-official.belly-up .eye-group .eye,
[data-dsh-whale] .pet-official.belly-up .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.belly-up .eye-group .sleep-eyes { display: inline !important; }

/* ===== 贴边挤扁 ===== */
[data-dsh-whale].edge-left .pet-official .body,
[data-dsh-whale].edge-right .pet-official .body,
[data-dsh-whale].dragging.edge-left .pet-official .body,
[data-dsh-whale].dragging.edge-right .pet-official .body {
  transform-origin: 50% 50%;
  animation: cat-squeeze 0.35s ease-out forwards !important;
}

/* 拖着不动又不耐烦 */
[data-dsh-whale].dragging .pet-official.impatient .body { animation: cat-impatientSway 0.9s ease-in-out infinite !important; }

/* 连戳中段：侧身躲 */
[data-dsh-whale] .pet-official.annoyed { animation: cat-annoyedDodge 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) !important; }

/* 连戳过头：扭头吊眉 */
[data-dsh-whale] .pet-official.sulking { animation: cat-sulkTurn 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) forwards !important; }
[data-dsh-whale] .pet-official.sulking .eye-group .angry-eyes { display: inline !important; }

/* ===== 欢迎态 / 庆祝 ===== */
[data-dsh-whale] .pet-official.welcome { animation: cat-leap 1.2s ease-in-out !important; }
[data-dsh-whale] .pet-official.welcome .stars { display: block !important; }
[data-dsh-whale] .pet-official.welcome .spout-group {
  display: inline !important;
  transform-origin: 13px 1.6px;
  animation: cat-puff 1.1s cubic-bezier(0.2, 0.8, 0.35, 1);
}
[data-dsh-whale] .pet-official.celebrate { animation: cat-leap 1.4s ease-in-out infinite; }
/* 星星在 SVG 里是内联 display:none，这里必须 !important 才压得住（鲸鱼那张表漏了它） */
[data-dsh-whale] .pet-official.celebrate .stars { display: block !important; }
[data-dsh-whale] .pet-official.celebrate .starL { animation: cat-starSpin 1.2s ease-in-out infinite; }
[data-dsh-whale] .pet-official.celebrate .starR { animation: cat-starSpin 1.2s ease-in-out 0.3s infinite; }
[data-dsh-whale] .pet-official.celebrate .bubble { animation: cat-rise 1.2s ease-out 0.3s infinite; }
[data-dsh-whale] .pet-official.celebrate .bubble.b2 { animation-delay: 0.7s; }
[data-dsh-whale] .pet-official.celebrate .bubble.b3 { animation-delay: 1.05s; }
[data-dsh-whale] .pet-official.celebrate .spout-group,
[data-dsh-whale] .pet-official.spouting .spout-group {
  display: inline !important;
  transform-origin: 13px 1.6px;
  animation: cat-puff 1.3s cubic-bezier(0.2, 0.8, 0.35, 1) infinite;
}

/* ===== 等待输入 / 失落 ===== */
[data-dsh-whale] .pet-official.wait { animation: cat-wait 1.2s ease-in-out infinite; }
[data-dsh-whale] .pet-official.wait .bubble-blue { display: block; animation: cat-riseBlue 1.2s ease-out infinite; }
[data-dsh-whale] .pet-official.disappointed { animation: cat-disappointed 2.6s ease-in-out infinite; }

/* 双击翻滚特技 */
[data-dsh-whale] .pet-official.rolling { animation: cat-rollTrick 0.65s cubic-bezier(0.34, 1.4, 0.64, 1) !important; }

/* 点击挤压回弹：作用在 SVG 上，不干扰位置 */
[data-dsh-whale] .pet-official.squish svg { animation: cat-squish 0.42s cubic-bezier(0.25, 1.4, 0.5, 1); }

/* ===== 拖拽中：暂停状态动画 + 斜拉变形 ===== */
[data-dsh-whale].dragging .pet-official {
  animation: none !important;
  transform: scaleX(1) rotate(-5deg) scale(1.04, 0.96) !important;
}
[data-dsh-whale].dragging[data-facing="right"] .pet-official {
  transform: scaleX(-1) rotate(5deg) scale(1.04, 0.96) !important;
}
[data-dsh-whale].dragging .pet-official .body { animation: none !important; }

/* 被抓/拖拽：勾勾眼（>_<） */
[data-dsh-whale].dragging .eye-group .eye,
[data-dsh-whale].dragging .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale].dragging .eye-group .caught-eyes { display: inline !important; }
[data-dsh-whale].dragging .eye-group .caught-eyes path { stroke: var(--pw-eye, #2E2A24) !important; stroke-width: 0.34 !important; }

/* 打瞌睡：耳朵趴下、身体起伏 */
[data-dsh-whale].sleeping .pet-official .body { animation: cat-sleepBob 4s ease-in-out infinite !important; }
[data-dsh-whale].sleeping .pet-official .tail { animation: none !important; }
[data-dsh-whale].sleeping .pet-official .eye-group { transform: scaleY(0.08) !important; }
[data-dsh-whale].sleeping .pet-official .pupil-highlight { opacity: 0 !important; }

/* 悬停：腮红加深 */
[data-dsh-whale] .pet-official:hover .cat-blush { opacity: .72; }

/* 键盘与代码粒子 */
[data-dsh-whale] .tap-k1 { animation: cat-keyTap1 0.16s ease-in-out infinite alternate; }
[data-dsh-whale] .tap-k2 { animation: cat-keyTap2 0.18s ease-in-out 0.08s infinite alternate; }
[data-dsh-whale] .code-fx1 { animation: cat-codeFloat1 1.2s ease-out infinite; }
[data-dsh-whale] .code-fx2 { animation: cat-codeFloat2 1.2s ease-out 0.6s infinite; }

/* ===== keyframes（cat- 前缀） ===== */
@keyframes cat-breathe {
  0%,100% { transform: translateY(0) scale(1, 1); }
  50%     { transform: translateY(-1.4px) scale(1.012, .988); }
}
@keyframes cat-tailSway {
  0%,100% { transform: rotate(0deg); }
  50%     { transform: rotate(11deg); }
}
@keyframes cat-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  95%, 97%      { transform: scaleY(0.12); }
}
@keyframes cat-crouch {
  0%,100% { transform: translateY(0) rotate(0deg) scale(1, 1); opacity: 1; }
  35%     { transform: translateY(2.2px) rotate(-2deg) scale(1.02, .97); opacity: .92; }
  65%     { transform: translateY(1.2px) rotate(1.4deg) scale(.99, 1.02); opacity: .96; }
}
@keyframes cat-workWiggle {
  0%,100% { transform: translateX(0) rotate(0deg); }
  25%     { transform: translateX(-1.2px) rotate(-1.2deg); }
  75%     { transform: translateX(1.2px) rotate(1.2deg); }
}
@keyframes cat-swimBody {
  0%   { transform: translateY(0) rotate(-2deg); }
  100% { transform: translateY(-2px) rotate(2deg); }
}
@keyframes cat-pupilGaze {
  0%   { transform: translate(-0.25px, -0.25px); }
  100% { transform: translate(0.35px, -0.45px); }
}
@keyframes cat-shake {
  0%,100% { transform: translateX(0) rotate(0deg); }
  25%     { transform: translateX(-1.1px) rotate(-1.6deg); }
  75%     { transform: translateX(1.1px) rotate(1.6deg); }
}
@keyframes cat-angryJitter {
  0%,100% { transform: translate(0, 0); }
  50%     { transform: translate(0.5px, -0.4px); }
}
@keyframes cat-dizzyShake {
  0%   { transform: rotate(-6deg) scale(1); }
  100% { transform: rotate(6deg) scale(1.06); }
}
@keyframes cat-dizzyWobble {
  0%   { transform: rotate(0deg); }
  20%  { transform: rotate(-7deg); }
  45%  { transform: rotate(6deg); }
  70%  { transform: rotate(-4deg); }
  100% { transform: rotate(0deg); }
}
@keyframes cat-joyHop {
  0%,100% { transform: translateY(0) scale(1, 1); }
  25%     { transform: translateY(-7px) scale(.98, 1.05); }
  55%     { transform: translateY(1px) scale(1.05, .95); }
  75%     { transform: translateY(-2.5px) scale(.995, 1.01); }
}
@keyframes cat-bellyUp {
  0%   { transform: rotate(0deg) translateY(0); }
  30%  { transform: rotate(-90deg) translateY(-5px); }
  55%  { transform: rotate(-160deg) translateY(3px); }
  75%  { transform: rotate(-160deg) translateY(3px); }
  100% { transform: rotate(-360deg) translateY(0); }
}
@keyframes cat-squeeze {
  0%   { transform: scaleX(1) scaleY(1); }
  40%  { transform: scaleX(.62) scaleY(1.08); }
  100% { transform: scaleX(.68) scaleY(1.06); }
}
@keyframes cat-impatientSway {
  0%,100% { transform: rotate(-2.5deg); }
  50%     { transform: rotate(2.5deg); }
}
@keyframes cat-annoyedDodge {
  0%,100% { transform: translateX(0) rotate(0deg); }
  35%     { transform: translateX(4px) rotate(4deg); }
  70%     { transform: translateX(-1.5px) rotate(-2deg); }
}
@keyframes cat-sulkTurn {
  0%   { transform: translateX(0) rotate(0deg); }
  100% { transform: translateX(1.5px) rotate(7deg); }
}
@keyframes cat-leap {
  0%,100% { transform: translateY(0) rotate(0deg) scale(1, 1); }
  14%     { transform: translateY(-16px) rotate(-5deg) scale(.97, 1.05); }
  36%     { transform: translateY(1px) rotate(3deg) scale(1.07, .9); }
  58%     { transform: translateY(-7px) rotate(-2deg) scale(.99, 1.02); }
  78%     { transform: translateY(0) rotate(1deg) scale(1.02, .98); }
}
@keyframes cat-puff {
  0%   { transform: translateY(3px) scale(.55); opacity: 0; }
  30%  { transform: translateY(0) scale(1); opacity: .95; }
  100% { transform: translateY(-7px) scale(1.15); opacity: 0; }
}
@keyframes cat-starSpin {
  0%,100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50%     { transform: scale(1.3) rotate(20deg); opacity: .6; }
}
@keyframes cat-rise {
  0%   { transform: translateY(0) scale(.55); opacity: 0; }
  25%  { opacity: .95; }
  100% { transform: translateY(-34px) scale(1); opacity: 0; }
}
@keyframes cat-riseBlue {
  0%   { transform: translateY(0) scale(.55); opacity: 0; }
  25%  { opacity: .9; }
  100% { transform: translateY(-30px) scale(1); opacity: 0; }
}
@keyframes cat-wait {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%     { transform: translateY(-1.5px) rotate(-1.5deg); }
}
@keyframes cat-disappointed {
  0%,100% { transform: translateY(0) scale(1, 1); }
  35%     { transform: translateY(1.8px) scale(1.03, .96); }
  70%     { transform: translateY(1.2px) scale(1.02, .975); }
}
@keyframes cat-rollTrick {
  0%   { transform: translateY(0) rotate(0deg) scale(1, 1); }
  30%  { transform: translateY(-12px) rotate(-120deg) scale(1.06, .94); }
  70%  { transform: translateY(-7px) rotate(-260deg) scale(.96, 1.04); }
  100% { transform: translateY(0) rotate(-360deg) scale(1, 1); }
}
@keyframes cat-squish {
  0%   { transform: scale(1, 1); }
  35%  { transform: scale(1.11, .86); }
  70%  { transform: scale(.96, 1.05); }
  100% { transform: scale(1, 1); }
}
@keyframes cat-sleepBob {
  0%,100% { transform: translateY(0) scale(1, 1); }
  50%     { transform: translateY(1.6px) scale(1.02, .975); }
}
@keyframes cat-keyTap1 {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(0.42px); }
}
@keyframes cat-keyTap2 {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(0.42px); }
}
@keyframes cat-codeFloat1 {
  0%   { transform: translateY(0) scale(0.5); opacity: 0; }
  30%  { opacity: 0.95; }
  100% { transform: translateY(-13px) translateX(-4px) scale(1); opacity: 0; }
}
@keyframes cat-codeFloat2 {
  0%   { transform: translateY(0) scale(0.5); opacity: 0; }
  30%  { opacity: 0.95; }
  100% { transform: translateY(-14px) translateX(3px) scale(1.05); opacity: 0; }
}
`,
				text: {
					zh: {
						status: {
							idle: [
								"小猫趴在这儿呢~ 点我可以戳戳哦 🐱",
								"今天有什么新任务？我盯着屏幕呢 👀",
								"甩甩尾巴，随时可以开工！",
								"（在原地踩了踩奶）"
							],
							think: [
								"正盯着屏幕梳理线索... 🔍",
								"让我想想这一步该怎么走…",
								"尾巴尖轻轻抽动，脑子在转 🧠",
								"趴在键盘边等你说完"
							],
							working: [
								"认真敲代码中！⚡",
								"爪子噼里啪啦按着键盘 ⌨️",
								"正在调用 Agent 工具执行任务！"
							],
							celebrate: [
								"太棒啦！任务圆满搞定~ 🎉",
								"测试全绿，可以舔爪子收工了 ✨",
								"（开心地打了个滚）"
							],
							error: [
								"炸毛了！正在发抖求救 🙀",
								"捕获到一个异常，正在尝试自愈...",
								"呜——毛都竖起来了 >_<"
							],
							wait: [
								"主人，这里需要你确认一下 🙋",
								"等你拍板呢，我先把进度停在这里~",
								"歪头看你：要不要继续？ ✋"
							],
							disappointed: [
								"呜... 刚刚没发挥好，耳朵都耷拉了 🥺",
								"失败是成功之母，我再缓缓~",
								"下次一定会更好的..."
							]
						},
						bond: {
							levelUp: [
								"",
								"好像... 跟你熟起来了呢 🐱✨",
								"已经离不开你啦，别丢下我哦 (´∀｀)♡"
							],
							poke: [
								[
									"……（慢慢眨了下眼）",
									"喵？",
									"唔，痒。",
									"（尾巴甩了一下）"
								],
								[
									"呼噜呼噜~ 戳到软软的肚子啦！",
									"好痒呀~ 哈哈哈 (≧▽≦)",
									"猫猫活力 +10！继续加油~",
									"甩甩尾巴，心情超棒 ✨"
								],
								[
									"又戳我~ 就知道你闲不住 (´∀｀)",
									"嘿嘿，今天也来找我玩啦 ♡",
									"再多摸一会儿嘛，我不介意的 🐱",
									"（主动翻过身，把肚皮露给你）"
								]
							],
							welcome: [
								"你好，我是这儿的小猫 🐱",
								"欢迎回来，今天也一起加油吧！🐱✨",
								"你来啦！我一直在窗边等你 🐱✨"
							],
							chatter: [
								"喵~ 我在这儿哦 🐱",
								"（悄悄看了你一眼）",
								"今天也一起呢，真好 ✨",
								"（用尾巴轻轻扫了扫你）",
								"不打扰你，就是想喵一声 🐾"
							]
						},
						panel: { swim: "🐾 巡逻" },
						feedback: {
							roll: "打个滚给你看！(≧∇≦)ﾉ ✨",
							feed: "嚼嚼嚼... 小鱼干真好吃！美味~ 🐟",
							hidden: "我先躲到右下角啦，想我随时点 🐱",
							shown: "回来啦！想我了没~ 🐱",
							schedule1h: "好~ 1 小时后我会自己躲到右下角 🐱",
							scheduleDaily: "记下啦：每天 22:00 自动躲到右下角 🌙",
							sleep: "呼噜噜... 蜷成一团，做小鱼干的梦 (Zzz) 💤",
							swim: [
								"溜达一圈，活动一下~ 🐱",
								"换个角度看主人 ✨",
								"巡视领地中，一切正常 👑",
								"踮着脚走，不打扰你 🐾",
								"尾巴竖起来，心情不错 🐱"
							],
							swimOn: "巡逻模式已开启，我会自己到处溜达 🐱🐾",
							swimOff: "巡逻模式已关闭，我乖乖待命~",
							joy: [
								"呼噜呼噜，最喜欢主人啦~ 🥰",
								"好开心！能量充满啦~ ✨",
								"（用脑袋蹭了蹭你）💖",
								"尾巴翘得高高的，心情极佳 🐱"
							],
							pokeDizzy: [
								"哎呀，轻轻戳嘛，有点小晕乎 @-@",
								"晕头转向了... 别戳太用力呀 🥺",
								"晃晃脑袋，差点被戳倒啦 ~"
							],
							pokeAnnoyed: [
								"喂喂喂，戳上瘾啦？(￣▽￣)\"",
								"再戳我就要跑开咯 ~",
								"好啦好啦，知道你在了 🐱",
								"肚子都要被戳扁了啦 >_<"
							],
							pokeSulk: [
								"哼，不理你了 (￣ε(#￣)",
								"猫猫罢工中，请稍后再试 💤",
								"生气了！要摸摸才理你 (｀へ´)"
							],
							comfort: [
								"呜... 谢谢你还在 (´;ω;`)",
								"被摸了摸头，好像又有力气了 ✨",
								"有你在就没关系啦，再来一次！🐱"
							],
							shaken: [
								"呜哇——太晕了！别甩啦 @_@",
								"天旋地转... 我要吐毛球了 🧶",
								"停停停！毛都炸开啦 >_<",
								"眼冒金星... 让我缓缓 (@_@;)"
							],
							bellyUp: [
								"翻个肚皮给你看~ 只对你哦 ♡",
								"咕噜噜——肚皮朝天，最舒服的姿势 (´∀｀)",
								"晒肚皮时间！别戳痒痒肉 🐱",
								"完全放松状态，可以随便摸 ✨"
							],
							dragIdle: [
								"举着不动... 手不酸吗 (・_・)",
								"要放我下来了吗，还是继续举着 ~",
								"悬在半空有点没安全感呀 🥺",
								"喂——还在吗？我还挂着呢 🐱"
							],
							sizeSet: (name) => `变成${name}号啦~ 合适吗 🐱`,
							sedentarySet: (min) => `好，坐满 ${min} 分钟我就过来蹭蹭你 ⏰`,
							restNudge: [
								"坐好久啦，起来伸个懒腰吧 🐱",
								"喝口水？我陪你歇一会儿 ☕",
								"眼睛也要休息的，看看远处吧 ✨",
								"猫都睡一轮了，你也歇会儿吧 💤"
							]
						},
						aria: {
							mini: "显示桌宠小猫",
							miniTitle: (state) => `桌宠小猫（${state}）· 点我召回，可拖拽移动`
						}
					},
					en: {
						status: {
							idle: [
								"Cat on standby~ Click me for a poke! 🐱",
								"Any new tasks today? I am watching the screen 👀",
								"Swishing my tail, ready to go!",
								"(kneading the spot I am sitting on)"
							],
							think: [
								"Staring at the screen, sorting out the clues... 🔍",
								"Let me think about how to approach this…",
								"Tail tip twitching — the brain is working 🧠",
								"Sitting by the keyboard, waiting for you to finish"
							],
							working: [
								"Typing code seriously! ⚡",
								"Paws clattering on the keyboard ⌨️",
								"Calling agent tools to get things done!"
							],
							celebrate: [
								"Yay! Task completed~ 🎉",
								"All tests green — time to groom my paws ✨",
								"(happily rolls over)"
							],
							error: [
								"Fur standing on end! Shaking for help 🙀",
								"Caught an exception, trying to self-heal...",
								"Mrrp — my fur is all puffed up >_<"
							],
							wait: [
								"Hey, I need your confirmation here 🙋",
								"Waiting for your call—I will hold right here~",
								"Tilting my head: shall we continue? ✋"
							],
							disappointed: [
								"Aww... that did not go well, my ears are drooping 🥺",
								"Failure is the mother of success, give me a moment~",
								"I will do better next time..."
							]
						},
						bond: {
							levelUp: [
								"",
								"Feels like... we are getting close 🐱✨",
								"I cannot do without you now, do not leave me (´∀｀)♡"
							],
							poke: [
								[
									"……(slowly blinks)",
									"Meow?",
									"Mm, ticklish.",
									"(flicks tail once)"
								],
								[
									"Purr purr~ you poked my soft belly!",
									"So ticklish~ hahaha (≧▽≦)",
									"Cat energy +10! Keep going~",
									"Tail swish, feeling great ✨"
								],
								[
									"Poking me again~ I know you cannot sit still (´∀｀)",
									"Hehe, you came to play again today ♡",
									"Pet me a bit longer, I do not mind 🐱",
									"(rolls over and shows you the belly)"
								]
							],
							welcome: [
								"Hi, I am the cat here 🐱",
								"Welcome back, let us do our best today too! 🐱✨",
								"You are here! I was waiting by the window 🐱✨"
							],
							chatter: [
								"Meow~ I am right here 🐱",
								"(quietly glances at you)",
								"Together again today, nice ✨",
								"(brushes you lightly with the tail)",
								"Not disturbing you, just saying meow 🐾"
							]
						},
						panel: { swim: "🐾 Patrol" },
						feedback: {
							roll: "A roll just for you! (≧∇≦)ﾉ ✨",
							feed: "Munch munch... this dried fish is great! Yummy~ 🐟",
							hidden: "I will hide in the corner. Call me anytime 🐱",
							shown: "I am back! Did you miss me~ 🐱",
							schedule1h: "Okay~ I will hide in the corner in 1 hour 🐱",
							scheduleDaily: "Noted: hide in the corner every day at 22:00 🌙",
							sleep: "Purr... curled up, dreaming of dried fish (Zzz) 💤",
							swim: [
								"Taking a stroll, stretching my legs~ 🐱",
								"A different angle on you ✨",
								"Patrolling my territory, all clear 👑",
								"Walking on tiptoes so I do not disturb you 🐾",
								"Tail up, feeling good 🐱"
							],
							swimOn: "Patrol mode on — I will wander around on my own 🐱🐾",
							swimOff: "Patrol mode off, I will stay put~",
							joy: [
								"Purr purr, you are my favorite~ 🥰",
								"So happy! Fully charged~ ✨",
								"(headbutts you) 💖",
								"Tail held high, in a great mood 🐱"
							],
							pokeDizzy: [
								"Hey, gentle pokes please, I am a bit dizzy @-@",
								"Everything is spinning... not so hard 🥺",
								"Shaking my head, almost got knocked over ~"
							],
							pokeAnnoyed: [
								"Hey hey hey, addicted to poking? (￣▽￣)\"",
								"Poke me again and I will run off ~",
								"Okay okay, I know you are there 🐱",
								"My belly is going flat from all this poking >_<"
							],
							pokeSulk: [
								"Hmph, not talking to you (￣ε(#￣)",
								"Cat is on strike, please try later 💤",
								"I am upset! Only pets will fix it (｀へ´)"
							],
							comfort: [
								"Aww... thank you for staying (´;ω;`)",
								"A little headpat and I feel strong again ✨",
								"With you here it is fine, let us try again! 🐱"
							],
							shaken: [
								"Whoa—too dizzy! Stop shaking me @_@",
								"The world is spinning... I am going to cough up a hairball 🧶",
								"Stop stop stop! My fur is all puffed up >_<",
								"Seeing stars... give me a moment (@_@;)"
							],
							bellyUp: [
								"Belly up, just for you ♡",
								"Flop—— belly to the sky, the comfiest pose (´∀｀)",
								"Belly-basking time! Do not poke the ticklish spot 🐱",
								"Fully relaxed, you may pet me anywhere ✨"
							],
							dragIdle: [
								"Held up and not moving... is your arm okay? (・_・)",
								"Putting me down, or holding on? ~",
								"Dangling in mid-air is a bit scary 🥺",
								"Hey—— still there? I am still hanging 🐱"
							],
							sizeSet: (name) => `Now I am size ${name}~ how do I look 🐱`,
							sedentarySet: (min) => `Okay, after ${min} minutes I will come nudge you ⏰`,
							restNudge: [
								"You have sat for a long while, stand up and stretch 🐱",
								"Some water? I will rest with you ☕",
								"Eyes need breaks too — look far away ✨",
								"Even a cat has napped once already; take a break 💤"
							]
						},
						aria: {
							mini: "Show desktop pet cat",
							miniTitle: (state) => `Desktop cat (${state}) · Click to recall, draggable`
						}
					}
				}
			},
			{
				id: "linger",
				name: {
					zh: "灵儿",
					en: "Ling'er"
				},
				icon: "🌸",
				html: `<svg viewBox="0 0 26 48" aria-hidden="true">
          <defs>
            <linearGradient id="lingRobe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color:var(--pw-robe,#F9FBFE)"/>
              <stop offset="0.72" style="stop-color:var(--pw-robe,#F6F9FD)"/>
              <stop offset="1" style="stop-color:var(--pw-robe-shade,#E5EBF3)"/>
            </linearGradient>
            <linearGradient id="lingBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color:var(--pw-body,#4D6BFE)"/>
              <stop offset="1" style="stop-color:var(--pw-body-dark,#3550C9)"/>
            </linearGradient>
            <linearGradient id="lingHair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#413B4D"/>
              <stop offset="1" stop-color="#211E29"/>
            </linearGradient>
            <linearGradient id="lingBlade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#EAF8FF"/>
              <stop offset="0.5" stop-color="#FFFFFF"/>
              <stop offset="1" stop-color="#9FD8F5"/>
            </linearGradient>
          </defs>

          <g class="body">
            <!-- 及臀后发（最底层，贴身不铺开） -->
            <path class="hair" d="M9.0 5.8 C8.1 12.2 7.9 20.4 8.5 28.4 C8.7 29.4 9.3 29.8 9.9 29.4 C9.4 21.4 9.7 13.2 10.4 7.0 Z" fill="url(#lingHair)"/>
            <path class="hair" d="M17.0 5.8 C17.9 12.2 18.1 20.4 17.5 28.4 C17.3 29.4 16.7 29.8 16.1 29.4 C16.6 21.4 16.3 13.2 15.6 7.0 Z" fill="url(#lingHair)"/>

            <!-- 正面身体整组（转身时整体隐藏/显示由样式表控制） -->
            <g class="front-body">
            <!-- 长裙：白为主 + 蓝侧片 + 蓝裙摆滚边 -->
            <g class="skirt" style="transform-origin: 13px 23px">
              <path d="M10.0 23.0 L16.0 23.0 C17.2 30.2 18.6 39.0 19.2 45.2 C16.9 46.0 14.7 46.4 13 46.4 C11.3 46.4 9.1 46.0 6.8 45.2 C7.4 39.0 8.8 30.2 10.0 23.0 Z" fill="url(#lingRobe)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.2" stroke-linejoin="round"/>
              <path d="M10.0 23.2 C8.9 30.2 7.9 38.4 7.0 45.0 L9.0 45.7 C9.3 38.6 9.9 30.0 10.9 23.4 Z" fill="url(#lingBlue)"/>
              <path d="M16.0 23.2 C17.1 30.2 18.1 38.4 19.0 45.0 L17.0 45.7 C16.7 38.6 16.1 30.0 15.1 23.4 Z" fill="url(#lingBlue)"/>
              <path d="M6.9 44.6 C9.4 45.5 16.6 45.5 19.1 44.6 C19.2 44.9 19.2 45.1 19.2 45.3 C16.8 46.1 9.2 46.1 6.8 45.3 C6.8 45.1 6.85 44.9 6.9 44.6 Z" style="fill:var(--pw-body,#4D6BFE)"/>
              <path d="M13 23.8 L13 46.0" fill="none" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.1" opacity=".24"/>
              <path d="M10.9 24.6 C10.3 31.4 9.7 38.6 9.5 45.0 M15.1 24.6 C15.7 31.4 16.3 38.6 16.5 45.0" fill="none" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.09" opacity=".16"/>
            </g>

            <!-- 浅蓝布鞋 -->
            <ellipse cx="11.4" cy="46.9" rx="1.05" ry="0.44" style="fill:var(--pw-body,#4D6BFE)"/>
            <ellipse cx="14.6" cy="46.9" rx="1.05" ry="0.44" style="fill:var(--pw-body,#4D6BFE)"/>

            <!-- 白色交领内衬（领口白色一路露到腰带） -->
            <path d="M13 14.0 C10.4 14.0 8.6 15.4 8.3 17.8 L9.9 22.6 L16.1 22.6 L17.7 17.8 C17.4 15.4 15.6 14.0 13 14.0 Z" fill="url(#lingRobe)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.2" stroke-linejoin="round"/>
            <path d="M11.0 14.4 L13 17.6 L15.0 14.4" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.2" stroke-linecap="round" opacity=".85"/>
            <!-- 颈洞：领口中间露出的一小段脖子 -->
            <path d="M12.2 14.0 L13.8 14.0 L13 15.2 Z" fill="#EFCDB4"/>
            <path d="M12.2 14.0 L13.8 14.0" fill="none" stroke="#D9AE90" stroke-width="0.12" stroke-linecap="round" opacity=".7"/>
            <!-- 下巴投影：脖子与下巴的分界 -->
            <path d="M11.6 12.4 C12.4 12.8 13.6 12.8 14.4 12.4" fill="none" stroke="#D9AE90" stroke-width="0.34" stroke-linecap="round" opacity=".45"/>
            <!-- 蓝色外袍：开口一路开到腰带，白色交领整条露出 -->
            <!-- 蓝外袍：窄肩带式（肩顶露白色的，不再像披肩），V 开口更高、下沿到腰 -->
            <path fill-rule="evenodd" d="M9.7 15.0 C11.0 16.2 15.0 16.2 16.3 15.0 L17.5 17.6 L16.1 22.7 L9.9 22.7 L8.5 17.6 Z M13 15.7 C14.0 15.7 14.9 16.0 15.5 16.5 L13 19.9 L10.5 16.5 C11.1 16.0 12.0 15.7 13 15.7 Z" fill="url(#lingBlue)"/>
            <path d="M9.7 15.2 C11.0 16.4 15.0 16.4 16.3 15.2" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.16" stroke-linecap="round" opacity=".8"/>
            <path d="M10.4 16.9 L13 21.8 L15.6 16.9" fill="none" style="stroke:var(--pw-robe,#F9FBFE)" stroke-width="0.3" stroke-linecap="round" opacity=".95"/>
            <path d="M10.1 17.2 L13 22.6 L15.9 17.2" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.15" stroke-linecap="round" opacity=".7"/>

            <!-- 红腰带（细）+ 打结 + 两条细长飘带 -->
            <rect x="9.6" y="22.2" width="6.8" height="1.1" rx="0.3" style="fill:var(--pw-blush,#F0A0A0)"/>
            <circle cx="13" cy="22.78" r="0.44" style="fill:var(--pw-blush,#F0A0A0)"/>
            <path d="M12.95 22.83 C12.35 22.38 11.85 22.28 11.35 22.48" fill="none" style="stroke:var(--pw-blush,#F0A0A0)" stroke-width="0.28" stroke-linecap="round"/>
            <path d="M13.05 22.83 C13.65 22.38 14.15 22.28 14.65 22.48" fill="none" style="stroke:var(--pw-blush,#F0A0A0)" stroke-width="0.28" stroke-linecap="round"/>
            <g class="sash" style="transform-origin: 12.6px 22.9px">
              <path d="M12.6 23.0 C12.0 27.4 11.9 32.0 12.3 36.4 C12.8 36.5 13.1 36.2 13.1 35.8 C12.8 31.8 12.9 27.4 13.3 23.0 Z" style="fill:var(--pw-blush,#F0A0A0)"/>
            </g>
            <g class="sash" style="transform-origin: 13.4px 22.9px">
              <path d="M13.4 23.0 C13.9 27.4 14.0 31.8 13.7 35.8 C13.2 35.9 12.9 35.6 12.9 35.2 C13.2 31.6 13.1 27.2 12.8 23.0 Z" style="fill:var(--pw-blush,#F0A0A0)"/>
            </g>

            <!-- 肩前发：两条**细**发，直直垂到腰际（参考图就是这两条，不是一整片） -->
            <path class="hair-front" style="transform-origin: 9.7px 13.0px" d="M10.0 12.8 C9.6 16.6 9.5 20.6 9.7 24.8 C10.1 25.0 10.5 24.7 10.6 24.2 C10.4 20.4 10.5 16.4 10.8 13.0 Z" fill="url(#lingHair)"/>
            <path class="hair-front" style="transform-origin: 16.3px 13.0px" d="M16.0 12.8 C16.4 16.6 16.5 20.6 16.3 24.8 C15.9 25.0 15.5 24.7 15.4 24.2 C15.6 20.4 15.5 16.4 15.2 13.0 Z" fill="url(#lingHair)"/>

            <!-- 手臂：上臂(贴身) + 肘 + 前臂(袖口/袖尾/手，绕肘转)。画在衣服之后，抬起才不会被盖 -->
            <g class="arm" style="transform-origin: 9.2px 14.6px">
              <!-- 上臂（贴身、细；不参与手势） -->
              <path d="M9.2 14.2 C7.9 15.4 7.1 17.4 6.9 19.4 L6.9 20.8 C7.8 21.5 9.0 21.3 9.8 20.5 C10.0 18.4 10.2 16.6 10.7 15.9 Z" fill="url(#lingRobe)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.18" stroke-linejoin="round"/>
              <!-- 肘关节（盖住接缝） -->
              <circle cx="7.85" cy="20.6" r="0.95" fill="url(#lingRobe)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.18"/>
              <!-- 前臂：袖口 + 垂下的袖尾 + 手，整体绕肘转动 -->
              <g class="forearm" style="transform-origin: 7.85px 20.6px">
                <!-- 前臂：喇叭形广袖，袖口停在腕部（手从袖口下方露出，不再有第三截） -->
                <path d="M6.9 20.4 C6.6 22.2 6.1 24.0 5.7 25.5 C7.0 26.5 8.5 26.5 9.6 25.6 C9.9 23.9 10.0 22.1 10.0 20.6 Z" fill="url(#lingRobe)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.18" stroke-linejoin="round"/>
                <path d="M6.0 24.4 C7.2 25.2 8.5 25.1 9.6 24.2" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.4" stroke-linecap="round"/>
                <g class="hand">
                  <path d="M7.9 25.7 C7.2 25.7 6.8 26.2 6.8 26.9 C6.8 27.7 7.3 28.2 8.0 28.2 C8.7 28.2 9.1 27.6 9.1 26.9 C9.1 26.2 8.6 25.7 7.9 25.7 Z" fill="#F7E0CE" stroke="#E8C4A8" stroke-width="0.09"/>
                  <path d="M6.9 26.4 C6.5 26.2 6.3 26.3 6.2 26.6 C6.1 26.9 6.3 27.2 6.6 27.2" fill="#F7E0CE" stroke="#E8C4A8" stroke-width="0.09"/>
                  <path d="M7.3 27.8 L7.3 28.4 M7.9 28.0 L7.9 28.6 M8.5 27.8 L8.5 28.4" fill="none" stroke="#E8C4A8" stroke-width="0.08" stroke-linecap="round"/>
                </g>
              </g>
            </g>
            <g class="arm" style="transform-origin: 16.8px 14.6px">
              <!-- 上臂（贴身、细；不参与手势） -->
              <path d="M16.8 14.2 C18.1 15.4 18.9 17.4 19.1 19.4 L19.1 20.8 C18.2 21.5 17.0 21.3 16.2 20.5 C16.0 18.4 15.8 16.6 15.3 15.9 Z" fill="url(#lingRobe)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.18" stroke-linejoin="round"/>
              <circle cx="18.15" cy="20.6" r="0.95" fill="url(#lingRobe)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.18"/>
              <g class="forearm" style="transform-origin: 18.15px 20.6px">
                <!-- 前臂：喇叭形广袖，袖口停在腕部（手从袖口下方露出，不再有第三截） -->
                <path d="M19.1 20.4 C19.4 22.2 19.9 24.0 20.3 25.5 C19.0 26.5 17.5 26.5 16.4 25.6 C16.1 23.9 16.0 22.1 16.0 20.6 Z" fill="url(#lingRobe)" stroke="var(--pw-body-dark,#3550C9)" stroke-width="0.18" stroke-linejoin="round"/>
                <path d="M20.0 24.4 C18.8 25.2 17.5 25.1 16.4 24.2" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.4" stroke-linecap="round"/>
                <g class="hand">
                  <path d="M18.1 25.7 C18.8 25.7 19.2 26.2 19.2 26.9 C19.2 27.7 18.7 28.2 18.0 28.2 C17.3 28.2 16.9 27.6 16.9 26.9 C16.9 26.2 17.4 25.7 18.1 25.7 Z" fill="#F7E0CE" stroke="#E8C4A8" stroke-width="0.09"/>
                  <path d="M19.1 26.4 C19.5 26.2 19.7 26.3 19.8 26.6 C19.9 26.9 19.7 27.2 19.4 27.2" fill="#F7E0CE" stroke="#E8C4A8" stroke-width="0.09"/>
                  <path d="M18.7 27.8 L18.7 28.4 M18.1 28.0 L18.1 28.6 M17.5 27.8 L17.5 28.4" fill="none" stroke="#E8C4A8" stroke-width="0.08" stroke-linecap="round"/>
                </g>
                <!-- 折扇：挂在右手里（默认隐藏，micro-fan 时展开挥动）。
                     放在 .forearm 里，所以抬手/挥扇会跟着手臂一起走。 -->
                <g class="fan" style="display:none;transform-origin:18.1px 26.4px">
                  <!-- 扇面画成"局部朝下"：右前臂折起约 110° 时它正好转到朝上，像在胸前扇风 -->
                  <path d="M18.1 26.4 L20.0 30.6 A 4.5 4.5 0 0 1 16.2 30.6 Z" fill="#F7F2E4" stroke="#B9A98C" stroke-width="0.14" stroke-linejoin="round"/>
                  <path d="M20.0 30.6 A 4.5 4.5 0 0 1 16.2 30.6" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.38" stroke-linecap="round"/>
                  <path d="M18.1 26.4 L19.6 30.3 M18.1 26.4 L18.1 30.9 M18.1 26.4 L16.6 30.3" fill="none" stroke="#B9A98C" stroke-width="0.12" stroke-linecap="round"/>
                  <path d="M17.4 30.9 C17.0 31.6 16.9 32.2 17.1 32.8" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.2" stroke-linecap="round"/>
                  <circle cx="18.1" cy="26.4" r="0.34" fill="#C9A76A"/>
                </g>
              </g>
            </g>
            <!-- 脖子（领口会盖住下半段，靠下面的"颈洞"露出来） -->
            </g>

            <rect class="neck" x="12.35" y="12.0" width="1.3" height="2.8" rx="0.35" fill="#EFCDB4"/>

            <!-- 头部整体上移 1.2：下巴与领口之间露出可见的一截脖子。
                 注意：位移写在样式表里（[data-dsh-whale] .pet-official .head），
                 **不要**写成 transform 属性 —— 那样 CSS 动画（远眺/理鬓等）一上就会覆盖属性，
                 头会当场掉下来。 -->
            <g class="head">
            <!-- 正面五官整组：转身到背面相位时整组隐藏，改由 .back-view 接管 -->
            <g class="face-front">
            <!-- 脸：圆一些、下巴短一点（原来上下拉得太长） -->
            <path d="M13 4.2 C10.5 4.2 8.5 6.0 8.5 8.4 C8.5 10.6 9.4 12.5 11.0 13.4 C11.6 13.7 12.3 13.9 13 13.9 C13.7 13.9 14.4 13.7 15.0 13.4 C16.6 12.5 17.5 10.6 17.5 8.4 C17.5 6.0 15.5 4.2 13 4.2 Z" fill="#F7E0CE"/>
            <!-- 鬓发（细，只到下颌） -->
            <path d="M8.6 6.2 C8.0 9.0 8.1 12.0 8.9 14.2 C9.7 14.3 10.3 13.6 10.4 12.8 C9.7 10.6 9.6 8.6 10.1 6.4 Z" fill="url(#lingHair)"/>
            <path d="M17.4 6.2 C18.0 9.0 17.9 12.0 17.1 14.2 C16.3 14.3 15.7 13.6 15.6 12.8 C16.3 10.6 16.4 8.6 15.9 6.4 Z" fill="url(#lingHair)"/>
            <!-- 顶发：贴着头的帽子，不再高高鼓起（"中间少"） -->
            <path d="M13 3.0 C9.6 3.0 7.4 5.4 7.3 9.2 C7.3 10.4 7.5 11.4 7.9 12.2 L8.0 9.4 C8.0 6.6 10.1 4.8 13 4.8 C15.9 4.8 18.0 6.6 18.0 9.4 L18.1 12.2 C18.5 11.4 18.7 10.4 18.7 9.2 C18.6 5.4 16.4 3.0 13 3.0 Z" fill="url(#lingHair)"/>
            <!-- 刘海：中分——左右各一缕扫向颧骨，**中间露额头**（原来中间垂得最低，像一撮盖在额上） -->
            <path d="M13 5.1 C12.5 6.2 11.9 7.5 11.4 8.9 C10.3 8.8 9.3 8.9 8.6 9.4 C8.1 8.3 8.0 6.9 8.5 6.0 C9.4 4.9 11.0 4.3 13 5.1 Z" fill="url(#lingHair)"/>
            <path d="M13 5.1 C13.5 6.2 14.1 7.5 14.6 8.9 C15.7 8.8 16.7 8.9 17.4 9.4 C17.9 8.3 18.0 6.9 17.5 6.0 C16.6 4.9 15.0 4.3 13 5.1 Z" fill="url(#lingHair)"/>
            <!-- 刘海里的两缕细发（参考图那种分缕感） -->
            <path d="M11.9 5.8 C11.4 7.0 11.0 8.0 10.6 8.9" fill="none" stroke="#6E6680" stroke-width="0.16" stroke-linecap="round" opacity=".5"/>
            <path d="M14.1 5.8 C14.6 7.0 15.0 8.0 15.4 8.9" fill="none" stroke="#6E6680" stroke-width="0.16" stroke-linecap="round" opacity=".5"/>
            <!-- 中分线（头顶中间是分缝，不堆头发） -->
            <path d="M13 2.9 L13 5.3" fill="none" stroke="#6E6680" stroke-width="0.16" stroke-linecap="round" opacity=".8"/>
            <path d="M11.6 3.5 C12.2 3.2 13.8 3.2 14.4 3.5" fill="none" stroke="#6E6680" stroke-width="0.14" stroke-linecap="round" opacity=".45"/>
            <!-- 双丫髻：**左右两侧**的大包子头（不在头顶中间） -->
            <circle cx="8.3" cy="4.4" r="1.5" fill="url(#lingHair)"/>
            <circle cx="8.3" cy="4.3" r="0.62" fill="#4E4759"/>
            <circle cx="17.7" cy="4.4" r="1.5" fill="url(#lingHair)"/>
            <circle cx="17.7" cy="4.3" r="0.62" fill="#4E4759"/>
            <!-- 蓝发绳：绕在髻根 -->
            <path d="M7.0 5.3 C7.7 6.2 8.9 6.2 9.6 5.3" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.32" stroke-linecap="round"/>
            <path d="M16.4 5.3 C17.1 6.2 18.3 6.2 19.0 5.3" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.32" stroke-linecap="round"/>
            <!-- 垂下的蓝丝带 -->
            <g class="ribbon" style="transform-origin: 8.9px 6.2px">
              <path d="M8.7 6.4 C7.7 8.4 7.3 10.6 7.4 12.8" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.3" stroke-linecap="round"/>
            </g>
            <g class="ribbon" style="transform-origin: 17.1px 6.2px">
              <path d="M17.3 6.4 C18.3 8.4 18.7 10.6 18.6 12.8" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.3" stroke-linecap="round"/>
            </g>
            <!-- 细眉 + 眼型 -->
            <path d="M10.2 7.8 Q11.05 7.5 11.9 7.78" fill="none" style="stroke:var(--pw-eye,#2E2A24)" stroke-width="0.16" stroke-linecap="round" opacity=".8"/>
            <path d="M15.8 7.8 Q14.95 7.5 14.1 7.78" fill="none" style="stroke:var(--pw-eye,#2E2A24)" stroke-width="0.16" stroke-linecap="round" opacity=".8"/>
            <g class="eye-group">
              <ellipse class="eye" cx="11.15" cy="9.25" rx="0.68" ry="0.84" style="fill:var(--pw-eye,#2E2A24)"/>
              <ellipse class="eye" cx="14.85" cy="9.25" rx="0.68" ry="0.84" style="fill:var(--pw-eye,#2E2A24)"/>
              <g class="pupil-highlight">
                <circle cx="11.34" cy="8.98" r="0.24" style="fill:var(--pw-pupil,#FBF8F0)"/>
                <circle cx="15.04" cy="8.98" r="0.24" style="fill:var(--pw-pupil,#FBF8F0)"/>
              </g>
              <g class="caught-eyes" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.55 8.8 L11.45 9.25 L10.55 9.7"/>
                <path d="M15.45 8.8 L14.55 9.25 L15.45 9.7"/>
              </g>
              <g class="sleep-eyes" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.26" stroke-linecap="round">
                <path d="M10.45 9.45 Q11.15 8.8 11.85 9.45"/>
                <path d="M14.15 9.45 Q14.85 8.8 15.55 9.45"/>
              </g>
              <g class="dizzy-eyes" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.24" stroke-linecap="round">
                <path d="M10.65 8.7 L11.7 9.75 M11.7 8.7 L10.65 9.75"/>
                <path d="M14.3 8.7 L15.35 9.75 M15.35 8.7 L14.3 9.75"/>
              </g>
              <g class="angry-eyes" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.28" stroke-linecap="round">
                <path d="M10.3 8.1 L11.9 8.7"/>
                <path d="M15.7 8.1 L14.1 8.7"/>
              </g>
            </g>
            <ellipse class="blush" cx="9.9" cy="10.9" rx="0.66" ry="0.34" style="fill:var(--pw-blush,#F0A0A0)" opacity=".24"/>
            <ellipse class="blush" cx="16.1" cy="10.9" rx="0.66" ry="0.34" style="fill:var(--pw-blush,#F0A0A0)" opacity=".24"/>
            <path d="M12.72 11.45 Q13 11.78 13.28 11.45" fill="none" style="stroke:var(--pw-eye,#2E2A24)" stroke-width="0.17" stroke-linecap="round" opacity=".75"/>

            </g>

            <!-- 背面视图（micro-spin 转到背面相位时显示，把脸整组盖住）。
                 坐标写在"局部系"里：本组在 .head 内，而 .head 有 translateY(-1.2)，
                 所以 y 要比实际渲染位置大 1.2（比如臀线渲染在 30.4，这里写 31.6）。 -->
            <g class="back-view" style="display:none;opacity:0">
              <path d="M13 1.4 C8.6 1.4 6.7 4.6 6.7 8.8 C6.7 14.2 7.0 19.4 7.6 24.2 C8.0 27.6 8.6 29.8 9.5 31.0 C10.6 31.8 11.8 31.6 12.5 30.6 C12.9 29.4 13.0 27.4 13.0 25.2 C13.0 27.4 13.1 29.4 13.5 30.6 C14.2 31.6 15.4 31.8 16.5 31.0 C17.4 29.8 18.0 27.6 18.4 24.2 C19.0 19.4 19.3 14.2 19.3 8.8 C19.3 4.6 17.4 1.4 13 1.4 Z" fill="url(#lingHair)"/>
              <path d="M9.6 4.4 C11.0 3.6 15.0 3.6 16.4 4.4" fill="none" stroke="#6E6680" stroke-width="0.22" stroke-linecap="round" opacity=".38"/>
              <path d="M10.2 12.0 C9.6 17.4 9.4 23.4 9.9 29.6" fill="none" stroke="#6E6680" stroke-width="0.16" stroke-linecap="round" opacity=".3"/>
              <path d="M15.8 12.0 C16.4 17.4 16.6 23.4 16.1 29.6" fill="none" stroke="#6E6680" stroke-width="0.16" stroke-linecap="round" opacity=".3"/>
              <circle cx="8.3" cy="4.4" r="1.5" fill="url(#lingHair)"/>
              <circle cx="8.3" cy="4.35" r="0.6" fill="#4E4759"/>
              <circle cx="17.7" cy="4.4" r="1.5" fill="url(#lingHair)"/>
              <circle cx="17.7" cy="4.35" r="0.6" fill="#4E4759"/>
              <path d="M7.0 5.3 C7.7 6.2 8.9 6.2 9.6 5.3" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.32" stroke-linecap="round"/>
              <path d="M16.4 5.3 C17.1 6.2 18.3 6.2 19.0 5.3" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.32" stroke-linecap="round"/>
              <path d="M13 23.7 C11.8 22.9 10.6 23.1 10.4 23.9 C10.2 24.7 11.2 25.3 12.6 24.9 Z" style="fill:var(--pw-blush,#F0A0A0)"/>
              <path d="M13 23.7 C14.2 22.9 15.4 23.1 15.6 23.9 C15.8 24.7 14.8 25.3 13.4 24.9 Z" style="fill:var(--pw-blush,#F0A0A0)"/>
              <circle cx="13" cy="23.8" r="0.44" style="fill:var(--pw-blush,#F0A0A0)"/>
              <path d="M12.7 24.1 C12.2 26.9 12.1 29.4 12.4 31.6 C12.8 31.7 13.1 31.4 13.1 31.0 C12.9 28.6 13.0 26.3 13.3 24.1 Z" style="fill:var(--pw-blush,#F0A0A0)" opacity=".92"/>
              <path d="M13.3 24.1 C13.7 26.3 13.8 28.6 13.6 31.0 C13.2 31.1 12.9 30.8 12.9 30.4 C13.1 28.2 13.0 26.1 12.7 24.1 Z" style="fill:var(--pw-blush,#F0A0A0)" opacity=".92"/>
            </g>

            <!-- 思考：双掌掐诀于胸前（手随手臂抬起，这里只画指间的灵光） -->
            <g class="hand-seal" style="display:none">

              <circle cx="14.4" cy="14.4" r="0.44" style="fill:var(--pw-body-light,#8FB5FF)"/>
              <circle cx="14.4" cy="14.4" r="1.15" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.15" opacity=".7"/>
              <path d="M13.5 15.1 L13.1 15.6 M15.3 15.1 L15.7 15.6" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.13" stroke-linecap="round" opacity=".8"/>
            </g>

            <!-- 施法失败的青筋 -->
            <g class="angry" style="display:none;stroke:var(--pw-eye,#2E2A24)" fill="none" stroke-width="0.26" stroke-linecap="round">
              <path d="M18.7 1.9 L19.4 3.3"/>
              <path d="M19.9 2.6 L20.6 4.0"/>
            </g>

            <!-- 灵光星星 -->
            <g class="stars" style="display:none">
              <path class="starL" d="M4.6 3.4 L4.88 4.12 L5.6 4.4 L4.88 4.68 L4.6 5.4 L4.32 4.68 L3.6 4.4 L4.32 4.12 Z" fill="#FFE9A8" style="transform-origin: 4.6px 4.4px"/>
              <path class="starR" d="M21.4 3.0 L21.68 3.72 L22.4 4.0 L21.68 4.28 L21.4 5.0 L21.12 4.28 L20.4 4.0 L21.12 3.72 Z" fill="#FFE9A8" style="transform-origin: 21.4px 4.0px"/>
            </g>

            <!-- 花瓣/灵光上升 -->
            <g class="spout-group" style="display:none">
              <circle class="spout-drop" cx="10.1" cy="0.8" r="0.36" style="fill:var(--pw-blush,#F0A0A0)" opacity=".9"/>
              <circle class="spout-drop" cx="13.0" cy="0.28" r="0.46" style="fill:var(--pw-body-light,#8FB5FF)" opacity=".9"/>
              <circle class="spout-drop" cx="15.9" cy="0.8" r="0.36" style="fill:var(--pw-blush,#F0A0A0)" opacity=".9"/>
              <path class="spout-stream" d="M9.7 2.1 Q8.9 1.5 9.9 0.9" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.26" stroke-linecap="round" opacity=".85"/>
              <path class="spout-stream" d="M16.3 2.1 Q17.1 1.5 16.1 0.9" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.26" stroke-linecap="round" opacity=".85"/>
            </g>

            </g>

          <!-- 御剑：整把剑横在脚下，两端探出裙外 -->
          <g class="sword" style="display:none">
            <ellipse cx="13" cy="47.0" rx="9.6" ry="1.4" style="fill:var(--pw-body-light,#8FB5FF)" opacity=".3"/>
            <path d="M1.0 46.2 L0.1 46.9 L1.0 47.6 Z" fill="#DCEFFF" stroke="#5A6B7A" stroke-width="0.12" stroke-linejoin="round"/>
            <path d="M1.0 46.2 L22.4 45.1 L23.0 46.5 L1.0 47.6 Z" fill="url(#lingBlade)" stroke="#5A6B7A" stroke-width="0.18" stroke-linejoin="round"/>
            <path d="M1.4 46.45 L22.2 45.4" fill="none" stroke="#FFFFFF" stroke-width="0.28" opacity=".95"/>
            <path d="M1.2 44.8 L6.4 45.7" fill="none" stroke="#DFF3FF" stroke-width="0.22" stroke-linecap="round" opacity=".9"/>
            <path d="M1.0 48.0 L5.6 47.3" fill="none" stroke="#DFF3FF" stroke-width="0.2" stroke-linecap="round" opacity=".8"/>
            <path d="M22.3 44.4 L22.9 47.2 L23.6 47.2 L23.1 44.4 Z" fill="#C9A76A" stroke="#8A6F3E" stroke-width="0.1" stroke-linejoin="round"/>
            <path d="M23.4 45.2 L25.3 45.1 L25.4 46.7 L23.5 46.8 Z" fill="#6B5A46"/>
            <path d="M25.2 45.2 L25.8 45.2 L25.9 46.7 L25.3 46.7 Z" fill="#C9A76A"/>
          </g>

          <!-- 灵光符文（working 时浮起） -->
          <g class="code-particle" style="display:none">
            <path class="code-fx1" d="M5.8 32.6 L6.05 33.25 L6.7 33.5 L6.05 33.75 L5.8 34.4 L5.55 33.75 L4.9 33.5 L5.55 33.25 Z" style="fill:var(--pw-body-light,#8FB5FF)"/>
            <path class="code-fx2" d="M20.2 31.6 L20.45 32.25 L21.1 32.5 L20.45 32.75 L20.2 33.4 L19.95 32.75 L19.3 32.5 L19.95 32.25 Z" style="fill:var(--pw-body,#4D6BFE)"/>
          </g>

          <!-- 法阵（working 时出现，替代键盘） -->
          <g class="keyboard-unit" style="display:none">
            <ellipse cx="13" cy="44.8" rx="5.8" ry="1.4" style="fill:var(--pw-body-dark,#3550C9)" opacity=".24"/>
            <g class="tap-k1">
              <circle cx="13" cy="44.0" r="4.6" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.26" stroke-dasharray="1.1 .7" opacity=".9"/>
              <circle cx="13" cy="44.0" r="3.3" fill="none" style="stroke:var(--pw-body,#4D6BFE)" stroke-width="0.2" stroke-dasharray=".5 .9" opacity=".75"/>
            </g>
            <g class="tap-k2">
              <path d="M10.3 42.2 L10.6 43.0 M10.9 42.2 L10.6 43.0" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.22" stroke-linecap="round"/>
              <path d="M15.7 42.2 L15.4 43.0 M15.1 42.2 L15.4 43.0" fill="none" style="stroke:var(--pw-body-light,#8FB5FF)" stroke-width="0.22" stroke-linecap="round"/>
            </g>
          </g>

          </g>

        </svg><span class="pat-heart">♥</span>
        <span class="bubble"></span>
        <span class="bubble b2"></span>
        <span class="bubble b3"></span>
        <span class="bubble-blue"></span>
        <span class="bubble-blue bb2"></span>
        <span class="bubble-blue bb3"></span>`,
				css: `
/* ===== 灵儿专属变量：她那身白袍要保持"白"，只有蓝/红的部件跟着色板走 ===== */
[data-dsh-whale] {
  --pw-robe: #F7F9FC;        /* 白袍主色 */
  --pw-robe-shade: #E4EAF2;  /* 白袍暗部 */
}

/* ===== 容器是竖盒子（index.ts 里 size: 104×140），这几处跟着改 ===== */
[data-dsh-whale][data-pet="linger"] .dsh-whale-shadow {
  bottom: calc(-4px * var(--pw-scale));
  width: calc(52px * var(--pw-scale));
  height: calc(10px * var(--pw-scale));
  margin-left: calc(-26px * var(--pw-scale));
}
[data-dsh-whale] .dsh-whale-zzz { left: 60%; top: 22px; }
/* 巡游时的光晕换成剑气青光 */
[data-dsh-whale] .dsh-whale-wake {
  width: calc(120px * var(--pw-scale));
  height: calc(120px * var(--pw-scale));
  margin-left: calc(-60px * var(--pw-scale));
  margin-top: calc(-60px * var(--pw-scale));
  background: radial-gradient(ellipse at center, rgba(168, 236, 255, 0.30) 0%, rgba(96, 190, 220, 0.10) 50%, transparent 72%);
}

/* ===== 泡泡（庆祝 + 点击）===== */
[data-dsh-whale] .bubble {
  position: absolute;
  left: 50%;
  bottom: 5px;
  width: 7px;
  height: 7px;
  margin-left: -3.5px;
  border-radius: 50%;
  background: rgba(232,217,188,.9);
  border: 1px solid rgba(46,42,36,.15);
  opacity: 0;
  pointer-events: none;
}
[data-dsh-whale] .bubble::after {
  content: "";
  position: absolute;
  left: 1.4px;
  top: 1.4px;
  width: 2.2px;
  height: 2.2px;
  border-radius: 50%;
  background: rgba(255,255,255,.85);
}
[data-dsh-whale] .bubble.show { animation: linger-rise 0.9s ease-out forwards; }
[data-dsh-whale] .bubble-blue {
  position: absolute;
  left: 50%;
  bottom: 4.5px;
  width: 6px;
  height: 6px;
  margin-left: -3.2px;
  border-radius: 50%;
  background: rgba(190,235,245,.8);
  border: 1px solid rgba(96,180,200,.45);
  opacity: 0;
  pointer-events: none;
}
[data-dsh-whale] .bubble-blue::after {
  content: "";
  position: absolute;
  left: 1.4px;
  top: 1.4px;
  width: 1.8px;
  height: 1.8px;
  border-radius: 50%;
  background: rgba(255,255,255,.85);
}

/* ===== 待机：呼吸 + 裙摆与披帛飘 + 长发微动 + 手轻摆 ===== */
/* 重要：SVG 子元素默认 transform-box:view-box，即以**整个画布中心**为旋转轴心。
   所以凡是对 .body 做的旋转/缩放，都必须把轴心显式放到脚下，否则人会绕着画面中心转
   （御剑前倾时脚会离开剑，看着就是"歪了"）。 */
[data-dsh-whale] .pet-official .body { transform-origin: 13px 46.5px; animation: linger-breathe 3.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official .skirt { animation: linger-skirtSway 3.8s ease-in-out infinite; }
[data-dsh-whale] .pet-official .sash { animation: linger-sashFloat 3.0s ease-in-out infinite; }
[data-dsh-whale] .pet-official .sash + .sash { animation-delay: -1.1s; }
[data-dsh-whale] .pet-official .ribbon { animation: linger-ribbonFlutter 2.4s ease-in-out infinite; transform-origin: 13px 3.4px; }
[data-dsh-whale] .pet-official .hair-front { animation: linger-hairSway 3.8s ease-in-out infinite; }
[data-dsh-whale] .pet-official .hair-front + .hair-front { animation-delay: -1.5s; }
[data-dsh-whale] .pet-official .eye-group { animation: linger-blink 4.8s ease-in-out infinite; transform-origin: 13px 9.15px; }
/* 手：待机时轻轻前后摆（宽度 ±0.35 单位，看得见但不夸张） */
[data-dsh-whale] .pet-official .arm { animation: linger-armSwayL 4.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official .arm + .arm { animation: linger-armSwayR 4.4s ease-in-out infinite; }
/* 空闲姿态 = 双手交叠于腹前（只折 42°）。原来是"抱臂"（-122/+96），但手肘是刚体、
   前臂仅 6 单位，折多了手只能落在胸口中线、必然压住另一只袖子 —— 看着就是"手和袖口重叠"。
   折 42° 时手落在腰带两侧、红飘带从两手之间露出来，干净且仍然端正。 */
[data-dsh-whale] .pet-official .forearm { animation: linger-forearmHugL 4.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official .arm + .arm .forearm { animation: linger-forearmHugR 4.4s ease-in-out infinite; }
/* 头部上移 1.2（原来写在 SVG 的 transform 属性上；改成 CSS 才能和"远眺/整衣襟"等 CSS 动画共存）。
   轴心必须显式给：SVG 子元素默认以 viewBox 中心为轴（transform-box:view-box），
   不写的话"点头/抬头"会变成绕腰部的平移。14.4 = 脖子根在**局部坐标**里的位置
   （局部比渲染位置低 1.2，因为位移是这一层的 transform 做的）。 */
[data-dsh-whale] .pet-official .head { transform-origin: 13px 14.4px; transform: translateY(-1.2px); }

/* ===== idle 原地动作（micro-*）：关闭御剑时她就靠这些"活着" =====
   约定（见 pets/types.ts）：插件给 .pet-official 加临时 class，2.4s 后移除；
   动画必须一次性、≤2.2s，且 0% / 100% 都回到**中性姿态**（否则移除时硬切会跳）。
   中性姿态＝待机那一套：.body = translateY(0) scale(1,1)｜左前臂 -42°｜右前臂 +42°｜
   .head = translateY(-1.2px)（轴心在脖子）｜.skirt = rotate(-1.4deg) scaleX(1)｜.hair(后发) 无动画。

   只留 4 个（用户 2026-09-17 拍板）：转圈(spin) / 放法术(spell) / 扇扇子(fan) / 远眺(gaze) ——
   前三个"看得出来"，远眺安静。原先的拂袖/整衣襟/掐指/裙摆轻摆幅度太小，已删。 */
/* 原地转圈：绕**竖轴**转身（.body 做 scaleX 翻转），不是在画面里翻滚 */
[data-dsh-whale] .pet-official.micro-spin .body { animation: linger-microSpin 1.9s ease-in-out; }
/* 转身＝换图（只做正⇄背两张图；侧身那张画不好，用户 2026-09-17 决定去掉）：
   换面时身体轻微收窄(0.8)+位移，配合衣摆/丝带的拖尾把"转过去"交代出来。
   正面专属部件（脸/刘海/肩前发/背后长发/脖子）在背面相位隐藏；背面图自带头发与腰结。 */
[data-dsh-whale] .pet-official.micro-spin .face-front,
[data-dsh-whale] .pet-official.micro-spin .hair-front,
[data-dsh-whale] .pet-official.micro-spin .hair,
[data-dsh-whale] .pet-official.micro-spin .neck { animation: linger-microSpinFace 1.9s ease-in-out; }
[data-dsh-whale] .pet-official.micro-spin .back-view { display: block !important; animation: linger-microSpinBack 1.9s ease-in-out; }
[data-dsh-whale] .pet-official.micro-spin .back-view { display: block !important; animation: linger-microSpinBack 1.9s ease-in-out; }
[data-dsh-whale] .pet-official.micro-spin .skirt { animation: linger-microSpinFlare 1.9s ease-in-out; }
[data-dsh-whale] .pet-official.micro-spin .ribbon { animation: linger-microSpinRibbon 1.9s ease-in-out; }
[data-dsh-whale] .pet-official.micro-spin .sash { animation: linger-microSpinSash 1.9s ease-in-out; }
/* 放法术：双臂抬起结印 + 脚下法阵亮起 + 花瓣升起 + 指尖灵光 */
[data-dsh-whale] .pet-official.micro-spell .forearm { animation: linger-microSpellL 2.2s ease-in-out; }
[data-dsh-whale] .pet-official.micro-spell .arm + .arm .forearm { animation: linger-microSpellR 2.2s ease-in-out; }
[data-dsh-whale] .pet-official.micro-spell .hand-seal { display: block !important; animation: linger-microSealGlow 2.2s ease-in-out; }
[data-dsh-whale] .pet-official.micro-spell .keyboard-unit { display: block !important; animation: linger-microFormation 2.2s ease-out; }
[data-dsh-whale] .pet-official.micro-spell .spout-group { display: block !important; animation: linger-microSpout 2.2s ease-out; }
[data-dsh-whale] .pet-official.micro-spell .head { animation: linger-microHeadGaze 2.2s ease-in-out; }
[data-dsh-whale] .pet-official.micro-spell .skirt { animation: linger-microSkirtPulse 2.2s ease-in-out; }
/* 扇扇子：右手折扇展开并挥动（扇子挂在右前臂里，随手臂走） */
[data-dsh-whale] .pet-official.micro-fan .arm + .arm .forearm { animation: linger-microFanArm 2.2s ease-in-out; }
[data-dsh-whale] .pet-official.micro-fan .fan { display: block !important; animation: linger-microFanWave 2.2s ease-in-out; }
[data-dsh-whale] .pet-official.micro-fan .ribbon { animation: linger-microFanRibbon 2.2s ease-in-out; }
[data-dsh-whale] .pet-official.micro-fan .head { animation: linger-microHeadTiltRight 2.2s ease-in-out; }
/* 远眺：抬头 + 长发与裙摆被风带起 */
[data-dsh-whale] .pet-official.micro-gaze .head { animation: linger-microGazeUp 2.2s ease-in-out; }
[data-dsh-whale] .pet-official.micro-gaze .hair { animation: linger-microHairTrail 2.2s ease-in-out; transform-origin: 13px 7px; }
[data-dsh-whale] .pet-official.micro-gaze .skirt { animation: linger-microSkirtTrail 2.2s ease-in-out; }

/* ===== 思考：凝神掐诀（抬手 + 灵光），与 idle 明显区分 ===== */
[data-dsh-whale] .pet-official.think { animation: linger-meditate 3.6s ease-in-out infinite; }
[data-dsh-whale] .pet-official.think .arm + .arm .forearm { animation: linger-forearmChin 3.6s ease-in-out infinite; }
[data-dsh-whale] .pet-official.think .hand-seal { display: block !important; }
[data-dsh-whale] .pet-official.think .hand-seal circle { animation: linger-sealGlow 1.6s ease-in-out infinite; transform-origin: 13px 21.2px; }
[data-dsh-whale] .pet-official.think .bubble-blue { animation: linger-riseBlue 3.2s ease-out infinite; }
[data-dsh-whale] .pet-official.think .bubble-blue.bb2 { animation-delay: 0.9s; }
[data-dsh-whale] .pet-official.think .bubble-blue.bb3 { animation-delay: 1.8s; }
[data-dsh-whale] .pet-official.think .pupil-highlight { animation: linger-pupilGaze 2.2s ease-in-out infinite alternate; }

/* ===== 御剑飞行（自主巡游）===== */
[data-dsh-whale] .pet-official.swimming .body,
[data-dsh-whale] .pet-official.swimming-dive .body { animation: linger-fly 1.1s ease-in-out infinite; }
[data-dsh-whale] .pet-official.swim-dive .body,
[data-dsh-whale] .pet-official.swimming-dive .body { animation: linger-flyDive 1.6s ease-in-out; }
/* 御剑：手臂向后掠 */
[data-dsh-whale] .pet-official.swimming .forearm { animation: linger-forearmTrailL 1.1s ease-in-out infinite; }
[data-dsh-whale] .pet-official.swimming .arm + .arm .forearm { animation: linger-forearmTrailR 1.1s ease-in-out infinite; }
/* 腾空：收起地面阴影，否则看着像站在地上 */
[data-dsh-whale].swimming .dsh-whale-shadow { opacity: 0; }
/* 腾空时脚下的光晕更亮一点，强调"离地" */
[data-dsh-whale].swimming .dsh-whale-wake { opacity: 1; }

[data-dsh-whale] .pet-official.swimming .sword,
[data-dsh-whale] .pet-official.swim-dive .sword,
[data-dsh-whale] .pet-official.swimming-dive .sword {
  /* !important 必需：SVG 上写了行内 display:none，普通声明压不过它（这里踩过坑） */
  display: block !important;
  animation: linger-bladeFloat 1.1s ease-in-out infinite;
  transform-origin: 13px 47px;
}
[data-dsh-whale] .pet-official.swimming .skirt { animation: linger-skirtTrail 1.1s ease-in-out infinite; }
[data-dsh-whale] .pet-official.swimming .sash { animation: linger-sashTrail 0.9s ease-in-out infinite; }
/* 长发向后飘（头为轴心） */
[data-dsh-whale] .pet-official.swimming .hair { animation: linger-hairTrail 1.1s ease-in-out infinite; transform-origin: 13px 7px; }
[data-dsh-whale] .pet-official.swim-dive .bubble-blue,
[data-dsh-whale] .pet-official.swimming-dive .bubble-blue { display: block; animation: linger-riseBlue 1.2s ease-out infinite; }

/* ===== 工作：脚下起法阵，符文浮动 ===== */
[data-dsh-whale] .pet-official.working { animation: linger-cast 1.0s ease-in-out infinite; }
[data-dsh-whale] .pet-official.working .body { animation: none; }
[data-dsh-whale] .pet-official.working .keyboard-unit { display: block !important; }
[data-dsh-whale] .pet-official.working .code-particle { display: block !important; }
[data-dsh-whale] .pet-official.working .skirt { animation: linger-skirtSway 1.6s ease-in-out infinite; }
[data-dsh-whale] .pet-official.working .sash { animation: linger-sashFloat 1.4s ease-in-out infinite; }
/* 施法时双手抬起画诀 */
[data-dsh-whale] .pet-official.working .forearm { animation: linger-forearmCastL 1.3s ease-in-out infinite; }
[data-dsh-whale] .pet-official.working .arm + .arm .forearm { animation: linger-forearmCastR 1.3s ease-in-out -0.65s infinite; }

/* 报错：双手护在身前发抖 */
[data-dsh-whale] .pet-official.error .forearm { animation: linger-forearmTrembleL 0.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official.error .arm + .arm .forearm { animation: linger-forearmTrembleR 0.4s ease-in-out infinite; }

/* ===== 报错：施法失败，符光乱窜 ===== */
[data-dsh-whale] .pet-official.error { animation: linger-shake 0.5s ease-in-out infinite; }
[data-dsh-whale] .pet-official.error .angry { display: block !important; animation: linger-angryJitter 0.5s ease-in-out infinite; }
[data-dsh-whale] .pet-official.error .eye-group .eye,
[data-dsh-whale] .pet-official.error .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.error .eye-group .dizzy-eyes {
  display: inline !important;
  transform-origin: 13px 9.15px;
  animation: linger-dizzyShake 0.4s ease-in-out infinite alternate;
}

/* ===== 打坐入定 ===== */
[data-dsh-whale].sleeping .eye-group .eye,
[data-dsh-whale].sleeping .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale].sleeping .eye-group .sleep-eyes { display: inline !important; }

/* ===== 开心：轻跃（手也跟着扬起来） ===== */
[data-dsh-whale] .pet-official.joy { animation: linger-joyHop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) !important; }
[data-dsh-whale] .pet-official.joy .arm { animation: linger-armRaiseL 0.9s ease-in-out infinite; }
[data-dsh-whale] .pet-official.joy .forearm { animation: linger-forearmWave 0.9s ease-in-out infinite; }
[data-dsh-whale] .pet-official.joy .eye-group .eye,
[data-dsh-whale] .pet-official.joy .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.joy .eye-group .sleep-eyes { display: inline !important; }

/* ===== 戳晕 ===== */
[data-dsh-whale] .pet-official.dizzy { animation: linger-dizzyWobble 0.8s ease-in-out !important; }
[data-dsh-whale] .pet-official.dizzy .eye-group .eye,
[data-dsh-whale] .pet-official.dizzy .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.dizzy .eye-group .dizzy-eyes {
  display: inline !important;
  transform-origin: 13px 9.15px;
  animation: linger-dizzyShake 0.35s ease-in-out infinite alternate;
}

/* ===== 甩晕：发髻散乱 ===== */
[data-dsh-whale] .pet-official.shaken .eye-group .eye,
[data-dsh-whale] .pet-official.shaken .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale].dragging .pet-official.shaken .eye-group .caught-eyes { display: none !important; }
[data-dsh-whale] .pet-official.shaken .eye-group .dizzy-eyes {
  display: inline !important;
  transform-origin: 13px 9.15px;
  animation: linger-dizzyShake 0.22s ease-in-out infinite alternate;
}
[data-dsh-whale]:not(.dragging) .pet-official.shaken { animation: linger-dizzyWobble 0.7s ease-in-out 2 !important; }

/* ===== 双击：旋身行礼（替代鲸鱼的翻肚皮）===== */
[data-dsh-whale] .pet-official.belly-up { animation: linger-spinBow 1.9s cubic-bezier(0.34, 1.3, 0.64, 1) !important; }
[data-dsh-whale] .pet-official.belly-up .eye-group .eye,
[data-dsh-whale] .pet-official.belly-up .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale] .pet-official.belly-up .eye-group .sleep-eyes { display: inline !important; }
[data-dsh-whale] .pet-official.belly-up .sash { animation: linger-sashSpin 1.9s ease-in-out; }

/* ===== 贴边挤扁 ===== */
[data-dsh-whale].edge-left .pet-official .body,
[data-dsh-whale].edge-right .pet-official .body,
[data-dsh-whale].dragging.edge-left .pet-official .body,
[data-dsh-whale].dragging.edge-right .pet-official .body {
  transform-origin: 50% 50%;
  animation: linger-squeeze 0.35s ease-out forwards !important;
}

/* 拖着不动又不耐烦 */
[data-dsh-whale].dragging .pet-official.impatient .body { animation: linger-impatientSway 0.9s ease-in-out infinite !important; }
/* 连戳中段：侧身躲 */
[data-dsh-whale] .pet-official.annoyed { animation: linger-annoyedDodge 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) !important; }
/* 连戳过头：扭头吊眉 */
[data-dsh-whale] .pet-official.sulking { animation: linger-sulkTurn 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) forwards !important; }
[data-dsh-whale] .pet-official.sulking .eye-group .angry-eyes { display: inline !important; }

/* ===== 欢迎 / 庆祝：跃起 + 灵光花瓣 ===== */
[data-dsh-whale] .pet-official.welcome { animation: linger-leap 1.2s ease-in-out !important; }
[data-dsh-whale] .pet-official.welcome .stars { display: block !important; }
[data-dsh-whale] .pet-official.welcome .spout-group {
  display: inline !important;
  transform-origin: 13px 3.0px;
  animation: linger-petal 1.2s cubic-bezier(0.2, 0.8, 0.35, 1);
}
[data-dsh-whale] .pet-official.celebrate { animation: linger-leap 1.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official.celebrate .arm { animation: linger-armRaiseL 1.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official.celebrate .arm + .arm { animation: linger-armRaiseR 1.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official.celebrate .forearm { animation: linger-forearmCheerL 1.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official.celebrate .arm + .arm .forearm { animation: linger-forearmCheerR 1.4s ease-in-out infinite; }
[data-dsh-whale] .pet-official.celebrate .stars { display: block !important; }
[data-dsh-whale] .pet-official.celebrate .starL { animation: linger-starSpin 1.2s ease-in-out infinite; }
[data-dsh-whale] .pet-official.celebrate .starR { animation: linger-starSpin 1.2s ease-in-out 0.3s infinite; }
[data-dsh-whale] .pet-official.celebrate .bubble { animation: linger-rise 1.2s ease-out 0.3s infinite; }
[data-dsh-whale] .pet-official.celebrate .bubble.b2 { animation-delay: 0.7s; }
[data-dsh-whale] .pet-official.celebrate .bubble.b3 { animation-delay: 1.05s; }
[data-dsh-whale] .pet-official.celebrate .spout-group,
[data-dsh-whale] .pet-official.spouting .spout-group {
  display: inline !important;
  transform-origin: 13px 3.0px;
  animation: linger-petal 1.3s cubic-bezier(0.2, 0.8, 0.35, 1) infinite;
}

/* ===== 等待输入 / 失落 ===== */
[data-dsh-whale] .pet-official.wait { animation: linger-wait 1.2s ease-in-out infinite; }
[data-dsh-whale] .pet-official.wait .forearm { animation: linger-forearmMeetL 2.6s ease-in-out infinite; }
[data-dsh-whale] .pet-official.wait .arm + .arm .forearm { animation: linger-forearmMeetR 2.6s ease-in-out infinite; }
[data-dsh-whale] .pet-official.wait .bubble-blue { display: block; animation: linger-riseBlue 1.2s ease-out infinite; }
[data-dsh-whale] .pet-official.disappointed { animation: linger-disappointed 2.6s ease-in-out infinite; }
[data-dsh-whale] .pet-official.disappointed .forearm { animation: linger-forearmDroopL 2.6s ease-in-out infinite; }
[data-dsh-whale] .pet-official.disappointed .arm + .arm .forearm { animation: linger-forearmDroopR 2.6s ease-in-out infinite; }

/* 双击翻滚特技（摸头/翻跟头按钮） */
[data-dsh-whale] .pet-official.rolling { animation: linger-spinBow 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) !important; }
/* 点击挤压回弹 */
[data-dsh-whale] .pet-official.squish svg { animation: linger-squish 0.42s cubic-bezier(0.25, 1.4, 0.5, 1); }

/* ===== 拖拽中 ===== */
[data-dsh-whale].dragging .pet-official {
  animation: none !important;
  transform: scaleX(1) rotate(-5deg) scale(1.04, 0.96) !important;
}
[data-dsh-whale].dragging[data-facing="right"] .pet-official {
  transform: scaleX(-1) rotate(5deg) scale(1.04, 0.96) !important;
}
[data-dsh-whale].dragging .pet-official .body { animation: none !important; }
/* 被拎起来时手臂垂下（收起来的抱臂不合物理） */
[data-dsh-whale].dragging .pet-official .forearm { animation: linger-forearmDroopL 1.6s ease-in-out infinite; }
[data-dsh-whale].dragging .pet-official .arm + .arm .forearm { animation: linger-forearmDroopR 1.6s ease-in-out infinite; }
[data-dsh-whale].dragging .eye-group .eye,
[data-dsh-whale].dragging .eye-group .pupil-highlight { opacity: 0 !important; }
[data-dsh-whale].dragging .eye-group .caught-eyes { display: inline !important; }
[data-dsh-whale].dragging .eye-group .caught-eyes path { stroke: var(--pw-eye, #2E2A24) !important; stroke-width: 0.34 !important; }

/* 打坐入定：身体起伏、裙摆收拢 */
[data-dsh-whale].sleeping .pet-official .body { animation: linger-sleepBob 4s ease-in-out infinite !important; }
[data-dsh-whale].sleeping .pet-official .skirt { animation: linger-skirtSway 6s ease-in-out infinite; }
[data-dsh-whale].sleeping .pet-official .sash { animation: none !important; }
[data-dsh-whale].sleeping .pet-official .eye-group { transform: scaleY(0.08) !important; }
[data-dsh-whale].sleeping .pet-official .pupil-highlight { opacity: 0 !important; }

/* 悬停：腮红加深 */
[data-dsh-whale] .pet-official:hover .blush { opacity: .55; }

/* 符文与法阵的动画 */
[data-dsh-whale] .tap-k1 { animation: linger-formation 6s linear infinite; transform-origin: 13px 44px; }
[data-dsh-whale] .tap-k2 { animation: linger-runePulse 1.4s ease-in-out infinite; transform-origin: 13px 44px; }
[data-dsh-whale] .code-fx1 { animation: linger-runeFloat1 1.6s ease-out infinite; }
[data-dsh-whale] .code-fx2 { animation: linger-runeFloat2 1.6s ease-out 0.7s infinite; }

/* ===== 御剑飞行：把公共的水花粒子改造成剑气与云气 =====
   粒子由 swim.ts 生成、挂在 body 下的共享层 [data-dsh-whale-particles]，
   所以要用属性选择器而不是 [data-dsh-whale]（层不在宠物容器里）。 */
[data-dsh-whale-particles] .pw-water-ripple {
  border: 1.2px solid rgba(186, 240, 255, 0.75);
  background: radial-gradient(ellipse at center, rgba(186, 240, 255, 0.24) 0%, rgba(96, 200, 225, 0.06) 55%, transparent 75%);
  box-shadow: 0 0 10px rgba(150, 230, 255, 0.5);
}
[data-dsh-whale-particles] .pw-stream-bubble {
  background: radial-gradient(circle at 35% 35%, #FFFFFF 0%, rgba(206, 244, 255, 0.8) 55%, rgba(120, 205, 230, 0.35) 100%);
  border: 0.8px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 0 7px rgba(170, 235, 255, 0.6);
}
[data-dsh-whale-particles] .pw-splash-drop {
  background: linear-gradient(120deg, #FFFFFF 0%, rgba(196, 244, 255, 0.95) 60%, rgba(120, 205, 230, 0.6) 100%);
  box-shadow: 0 0 6px rgba(180, 240, 255, 0.75);
  border-radius: 60% 15% 60% 15%;
}
[data-dsh-whale-particles] .pw-drag-drip {
  background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, rgba(206, 244, 255, 0.85) 60%, rgba(120, 205, 230, 0.4) 100%);
  box-shadow: 0 0 6px rgba(180, 240, 255, 0.55);
}
[data-dsh-whale-particles] .pw-confetti {
  background: var(--pw-blush, #F0A0A0);
  border-radius: 62% 12% 62% 12%;
}

/* ===== keyframes（linger- 前缀）===== */
@keyframes linger-breathe {
  0%,100% { transform: translateY(0) scale(1, 1); }
  50%     { transform: translateY(-1.1px) scale(1.008, .992); }
}
@keyframes linger-skirtSway {
  0%,100% { transform: rotate(-1.4deg) scaleX(1); }
  50%     { transform: rotate(1.6deg) scaleX(1.03); }
}
@keyframes linger-sashFloat {
  0%,100% { transform: rotate(-2.5deg) translateY(0); }
  50%     { transform: rotate(3.5deg) translateY(-0.6px); }
}
@keyframes linger-ribbonFlutter {
  0%,100% { transform: rotate(-2deg); }
  50%     { transform: rotate(2.5deg); }
}
@keyframes linger-hairSway {
  0%,100% { transform: rotate(-1.2deg); }
  50%     { transform: rotate(1.6deg); }
}
/* ---- idle 原地动作（micro-*）的关键帧 ----
   规矩：一次性、≤2.2s、**首尾回中性姿态**（待机那套数值），class 被移除时看不出跳变。
   中性值速查：.body = translateY(0) scale(1,1)｜.skirt = rotate(-1.4deg) scaleX(1)｜
   .sash = rotate(-2.5deg)｜.head = translateY(-1.2px)｜左前臂 = rotate(-42deg)｜右前臂 = rotate(42deg)｜
   .hair(后发) 无动画｜.fan 有独立轴心（扇钉）。
   几何限制：手肘刚体、前臂 6 单位，手够不到头/脸；扇子画成"局部朝下"，
   这样右前臂折起约 110° 时扇面正好朝上，像在胸前扇风。 */
/* 转圈：绕竖轴转一整圈（1 → 侧 → 背 → 侧 → 1），不是画面内翻滚 */
/* 转圈：绕竖轴转身。要点：
   - 最小宽度只压到 0.34（原来 0.16，太薄就成了纸片），始终保留体积
   - 加左右位移（±2px）与 ±3° 微转，暗示"质量绕着中轴甩过去"
   - 头发/裙摆/腰带**滞后一拍**（各自再做一个反向 scaleX/rotate），形成拖尾 */
/* 身体：只在换面那一下轻微收窄 + 位移（正面留 ~23%，背面留 ~47%） */
@keyframes linger-microSpin {
  0%   { transform: translate(0, 0) scale(1, 1); }
  20%  { transform: translate(-1.2px, -0.6px) scale(0.8, 1.01); }
  27%  { transform: translate(-0.8px, -1.3px) scale(1, 1); }
  70%  { transform: translate(0.8px, -1.3px) scale(1, 1); }
  77%  { transform: translate(1.2px, -0.6px) scale(0.8, 1.01); }
  100% { transform: translate(0, 0) scale(1, 1); }
}
/* 正面专属部件：23%~72% 藏起来（那段看背面图） */
@keyframes linger-microSpinFace {
  0%,23%     { opacity: 1; }
  23.1%,72%  { opacity: 0; }
  72.1%,100% { opacity: 1; }
}
/* 背面视图：23%~72% 显示 */
@keyframes linger-microSpinBack {
  0%,23%     { opacity: 0; }
  23.1%,72%  { opacity: 1; }
  72.1%,100% { opacity: 0; }
}
@keyframes linger-microSpinFlare {
  0%,100% { transform: rotate(-1.4deg) scaleX(1); }
  28%     { transform: rotate(3deg) scaleX(1.11); }
  56%     { transform: rotate(-1deg) scaleX(0.74); }
  80%     { transform: rotate(2deg) scaleX(1.06); }
}
@keyframes linger-microSpinRibbon {
  0%,100% { transform: rotate(0deg) scaleX(1); }
  30%     { transform: rotate(16deg) scaleX(1.2); }
  58%     { transform: rotate(-8deg) scaleX(0.82); }
  82%     { transform: rotate(9deg) scaleX(1.06); }
}
@keyframes linger-microSpinSash {
  0%,100% { transform: rotate(-2.5deg) scaleX(1); }
  30%     { transform: rotate(12deg) scaleX(1.16); }
  58%     { transform: rotate(-6deg) scaleX(0.84); }
  82%     { transform: rotate(7deg) scaleX(1.04); }
}
/* 放法术：双臂上举结印 + 法阵 + 花瓣 */
@keyframes linger-microSpellL {
  0%,100% { transform: rotate(-42deg); }
  30%     { transform: rotate(-158deg); }
  70%     { transform: rotate(-150deg); }
}
@keyframes linger-microSpellR {
  0%,100% { transform: rotate(42deg); }
  30%     { transform: rotate(132deg); }
  70%     { transform: rotate(124deg); }
}
@keyframes linger-microFormation {
  0%      { opacity: 0; transform: scale(.6) rotate(0deg); }
  25%     { opacity: 1; }
  75%     { opacity: .95; }
  100%    { opacity: 0; transform: scale(1.25) rotate(80deg); }
}
@keyframes linger-microSpout {
  0%      { opacity: 0; transform: translateY(2px); }
  35%     { opacity: 1; transform: translateY(-1px); }
  100%    { opacity: 0; transform: translateY(-5px); }
}
@keyframes linger-microSealGlow {
  0%,12%,100% { opacity: 0; }
  34%         { opacity: 1; }
  68%         { opacity: .5; }
}
@keyframes linger-microHeadGaze {
  0%,100% { transform: translateY(-1.2px) rotate(0deg); }
  32%     { transform: translateY(-1.9px) rotate(-3deg); }
  72%     { transform: translateY(-1.6px) rotate(-2deg); }
}
@keyframes linger-microSkirtPulse {
  0%,100% { transform: rotate(-1.4deg) scaleX(1); }
  40%     { transform: rotate(0deg) scaleX(1.08); }
}
/* 扇扇子：抬手到胸前 + 扇面来回挥（-16°/+10°/-14°/+8°） */
@keyframes linger-microFanArm {
  0%,100% { transform: rotate(42deg); }
  22%     { transform: rotate(124deg); }
  78%     { transform: rotate(120deg); }
}
@keyframes linger-microFanWave {
  0%,100% { transform: rotate(0deg); }
  20%     { transform: rotate(-16deg); }
  40%     { transform: rotate(10deg); }
  60%     { transform: rotate(-14deg); }
  80%     { transform: rotate(8deg); }
}
@keyframes linger-microFanRibbon {
  0%,100% { transform: rotate(0deg); }
  40%     { transform: rotate(12deg); }
}
/* 远眺：抬头 + 长发/裙摆被风带起 */
@keyframes linger-microGazeUp {
  0%,100% { transform: translateY(-1.2px) rotate(0deg); }
  30%     { transform: translateY(-2.1px) rotate(-6.5deg); }
  70%     { transform: translateY(-1.7px) rotate(-3.5deg); }
}
@keyframes linger-microHeadTiltRight {
  0%,100% { transform: translateY(-1.2px) rotate(0deg); }
  32%     { transform: translateY(-1.2px) rotate(3.2deg); }
  66%     { transform: translateY(-1.2px) rotate(2.2deg); }
}
@keyframes linger-microHairTrail {
  0%,100% { transform: rotate(0deg); }
  34%     { transform: rotate(13deg); }
  74%     { transform: rotate(7deg); }
}
@keyframes linger-microSkirtTrail {
  0%,100% { transform: rotate(-1.4deg) scaleX(1); }
  34%     { transform: rotate(-12deg) scaleX(1.12); }
  74%     { transform: rotate(-6deg) scaleX(1.05); }
}/* 手：待机轻摆 / 施法抬手画诀 / 开心上扬 */
/* 手臂：绕肩摆动 / 掐指（抬起并收袖）/ 施法 / 上扬。左右分开写，因为"抬起"要朝身体内侧。
   注：手臂是刚体（没有肘），"抬到胸前"用 translate + scale 收短袖子，而不是硬转一个大角度。 */
/* 手臂关键帧。几何：肘在 y20.6，前臂约 6 单位（手在胯侧 y26.6），肘下另有一截袖尾。
   角度（前臂从自然下垂起算，顺时针为正）：抱臂 右+98°/左-120°、拱手 左-76°/右+76°、
   掐指（右手）+144°、腰前画符 ±30~42°、上举 ±150~168°、挥袖 +120~140°、护身 ±112~120° */
@keyframes linger-armSwayL {
  0%,100% { transform: rotate(0deg); }
  50%     { transform: rotate(-1.5deg); }
}
@keyframes linger-armSwayR {
  0%,100% { transform: rotate(0deg); }
  50%     { transform: rotate(1.5deg); }
}
/* 空闲：抱臂（左前臂横压在上，右前臂垫在内） */
@keyframes linger-forearmHugL {
  0%,100% { transform: rotate(-42deg); }
  50%     { transform: rotate(-37deg); }
}
@keyframes linger-forearmHugR {
  0%,100% { transform: rotate(42deg); }
  50%     { transform: rotate(47deg); }
}
/* 等待：拱手于腹前（双手在身前合拢，位置比抱臂低） */
@keyframes linger-forearmMeetL {
  0%,100% { transform: rotate(-74deg); }
  50%     { transform: rotate(-80deg); }
}
@keyframes linger-forearmMeetR {
  0%,100% { transform: rotate(74deg); }
  50%     { transform: rotate(80deg); }
}
/* 思考：只有右手抬到颔下掐指（左手保持抱臂） */
@keyframes linger-forearmChin {
  0%,100% { transform: rotate(138deg); }
  50%     { transform: rotate(148deg); }
}
/* 施法：双手在腰前执诀画符，左右不同相位 */
@keyframes linger-forearmCastL {
  0%,100% { transform: rotate(-30deg); }
  50%     { transform: rotate(-44deg); }
}
@keyframes linger-forearmCastR {
  0%,100% { transform: rotate(30deg); }
  50%     { transform: rotate(44deg); }
}
/* 上臂外抬（庆祝/挥手用；光折前臂够不到头顶） */
@keyframes linger-armRaiseL {
  0%,100% { transform: rotate(20deg); }
  50%     { transform: rotate(32deg); }
}
@keyframes linger-armRaiseR {
  0%,100% { transform: rotate(-20deg); }
  50%     { transform: rotate(-32deg); }
}
/* 开心：单手挥袖（上臂已抬） */
@keyframes linger-forearmWave {
  0%,100% { transform: rotate(96deg); }
  50%     { transform: rotate(122deg); }
}
/* 庆祝：双臂上举 */
@keyframes linger-forearmCheerL {
  0%,100% { transform: rotate(-156deg); }
  50%     { transform: rotate(-172deg); }
}
@keyframes linger-forearmCheerR {
  0%,100% { transform: rotate(156deg); }
  50%     { transform: rotate(172deg); }
}
/* 报错：双手护在身前发抖 */
@keyframes linger-forearmTrembleL {
  0%,100% { transform: rotate(-112deg); }
  50%     { transform: rotate(-120deg); }
}
@keyframes linger-forearmTrembleR {
  0%,100% { transform: rotate(112deg); }
  50%     { transform: rotate(120deg); }
}
/* 失落 / 拖拽：手自然垂（略前倾） */
@keyframes linger-forearmDroopL {
  0%,100% { transform: rotate(-10deg); }
  50%     { transform: rotate(-17deg); }
}
@keyframes linger-forearmDroopR {
  0%,100% { transform: rotate(10deg); }
  50%     { transform: rotate(17deg); }
}
/* 御剑：左手向后掠、右手前伸掐诀（导向），不对称才像在飞 */
@keyframes linger-forearmTrailL {
  0%,100% { transform: rotate(-36deg); }
  50%     { transform: rotate(-46deg); }
}
@keyframes linger-forearmTrailR {
  0%,100% { transform: rotate(50deg); }
  50%     { transform: rotate(60deg); }
}
@keyframes linger-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  95%, 97%      { transform: scaleY(0.12); }
}
@keyframes linger-meditate {
  0%,100% { transform: translateY(0) rotate(0deg); }
  35%     { transform: translateY(-1.6px) rotate(-1.2deg); }
  70%     { transform: translateY(-0.8px) rotate(1deg); }
}
@keyframes linger-cast {
  0%,100% { transform: translateY(0) rotate(0deg); }
  30%     { transform: translateY(-1.2px) rotate(-0.8deg); }
  70%     { transform: translateY(0.4px) rotate(0.8deg); }
}
/* 御剑飞行：整体**升空**（人抬高 5~7 单位）+ 前倾 15° + 起伏。
   剑在同一个坐标系里也抬同样高度，两者才不会脱开。 */
@keyframes linger-fly {
  0%,100% { transform: translateY(-5px) rotate(-15deg); }
  50%     { transform: translateY(-7px) rotate(-12deg); }
}
/* 长发与裙摆被风向后带 */
@keyframes linger-hairTrail {
  0%,100% { transform: rotate(5deg); }
  50%     { transform: rotate(11deg); }
}
@keyframes linger-flyDive {
  0%   { transform: translateY(0) rotate(0deg); }
  35%  { transform: translateY(4px) rotate(-10deg) scale(1.02, .97); }
  70%  { transform: translateY(1px) rotate(-4deg) scale(1, 1); }
  100% { transform: translateY(0) rotate(0deg); }
}
/* 剑现在在 .body 里面，升空与前倾由身体带；这里只保留"剑头微抬 + 轻微浮动" */
@keyframes linger-bladeFloat {
  0%,100% { transform: translateY(0) rotate(9deg); }
  50%     { transform: translateY(-1.5px) rotate(6deg); }
}
@keyframes linger-skirtTrail {
  0%,100% { transform: rotate(-8deg) scaleX(1.07); }
  50%     { transform: rotate(-14deg) scaleX(1.11); }
}
@keyframes linger-sashTrail {
  0%,100% { transform: rotate(-8deg) translateX(-0.6px); }
  50%     { transform: rotate(-14deg) translateX(-1.4px); }
}
@keyframes linger-pupilGaze {
  0%   { transform: translate(-0.22px, -0.22px); }
  100% { transform: translate(0.32px, -0.4px); }
}
@keyframes linger-shake {
  0%,100% { transform: translateX(0) rotate(0deg); }
  25%     { transform: translateX(-1px) rotate(-1.4deg); }
  75%     { transform: translateX(1px) rotate(1.4deg); }
}
@keyframes linger-angryJitter {
  0%,100% { transform: translate(0, 0); }
  50%     { transform: translate(0.5px, -0.4px); }
}
@keyframes linger-dizzyShake {
  0%   { transform: rotate(-6deg) scale(1); }
  100% { transform: rotate(6deg) scale(1.06); }
}
@keyframes linger-dizzyWobble {
  0%   { transform: rotate(0deg); }
  20%  { transform: rotate(-6deg); }
  45%  { transform: rotate(5deg); }
  70%  { transform: rotate(-3.5deg); }
  100% { transform: rotate(0deg); }
}
@keyframes linger-joyHop {
  0%,100% { transform: translateY(0) scale(1, 1); }
  25%     { transform: translateY(-6px) scale(.985, 1.03); }
  55%     { transform: translateY(1px) scale(1.03, .97); }
  75%     { transform: translateY(-2px) scale(.995, 1.01); }
}
@keyframes linger-spinBow {
  0%   { transform: rotate(0deg) translateY(0) scale(1, 1); }
  30%  { transform: rotate(-140deg) translateY(-5px) scale(.98, 1.03); }
  60%  { transform: rotate(-330deg) translateY(0) scale(1.02, .98); }
  80%  { transform: rotate(-360deg) translateY(0) scale(1.03, .96); }
  100% { transform: rotate(-360deg) translateY(0) scale(1, 1); }
}
@keyframes linger-sashSpin {
  0%,100% { transform: rotate(0deg); }
  45%     { transform: rotate(-24deg); }
  70%     { transform: rotate(18deg); }
}
@keyframes linger-squeeze {
  0%   { transform: scaleX(1) scaleY(1); }
  40%  { transform: scaleX(.64) scaleY(1.07); }
  100% { transform: scaleX(.7) scaleY(1.05); }
}
@keyframes linger-impatientSway {
  0%,100% { transform: rotate(-2.4deg); }
  50%     { transform: rotate(2.4deg); }
}
@keyframes linger-annoyedDodge {
  0%,100% { transform: translateX(0) rotate(0deg); }
  35%     { transform: translateX(3.5px) rotate(3.5deg); }
  70%     { transform: translateX(-1.4px) rotate(-2deg); }
}
@keyframes linger-sulkTurn {
  0%   { transform: translateX(0) rotate(0deg); }
  100% { transform: translateX(1.2px) rotate(6deg); }
}
@keyframes linger-leap {
  0%,100% { transform: translateY(0) rotate(0deg) scale(1, 1); }
  14%     { transform: translateY(-14px) rotate(-4deg) scale(.98, 1.05); }
  36%     { transform: translateY(1px) rotate(3deg) scale(1.05, .93); }
  58%     { transform: translateY(-6px) rotate(-2deg) scale(.99, 1.02); }
  78%     { transform: translateY(0) rotate(1deg) scale(1.02, .98); }
}
@keyframes linger-petal {
  0%   { transform: translateY(3px) scale(.6); opacity: 0; }
  30%  { transform: translateY(0) scale(1); opacity: .95; }
  100% { transform: translateY(-8px) scale(1.15) rotate(14deg); opacity: 0; }
}
@keyframes linger-starSpin {
  0%,100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50%     { transform: scale(1.35) rotate(22deg); opacity: .6; }
}
@keyframes linger-rise {
  0%   { transform: translateY(0) scale(.55); opacity: 0; }
  25%  { opacity: .95; }
  100% { transform: translateY(-40px) scale(1); opacity: 0; }
}
@keyframes linger-riseBlue {
  0%   { transform: translateY(0) scale(.55); opacity: 0; }
  25%  { opacity: .9; }
  100% { transform: translateY(-34px) scale(1); opacity: 0; }
}
@keyframes linger-wait {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%     { transform: translateY(-1.4px) rotate(-1.2deg); }
}
@keyframes linger-disappointed {
  0%,100% { transform: translateY(0) scale(1, 1); }
  35%     { transform: translateY(1.6px) scale(1.025, .965); }
  70%     { transform: translateY(1px) scale(1.015, .98); }
}
@keyframes linger-squish {
  0%   { transform: scale(1, 1); }
  35%  { transform: scale(1.1, .87); }
  70%  { transform: scale(.965, 1.045); }
  100% { transform: scale(1, 1); }
}
@keyframes linger-sleepBob {
  0%,100% { transform: translateY(0) scale(1, 1); }
  50%     { transform: translateY(1.4px) scale(1.015, .98); }
}
@keyframes linger-formation {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes linger-sealGlow {
  0%,100% { transform: scale(.8); opacity: .5; }
  50%     { transform: scale(1.5); opacity: 1; }
}
@keyframes linger-runePulse {
  0%,100% { transform: scale(1); opacity: .5; }
  50%     { transform: scale(1.08); opacity: .85; }
}
@keyframes linger-runeFloat1 {
  0%   { transform: translateY(0) scale(.5); opacity: 0; }
  30%  { opacity: .95; }
  100% { transform: translateY(-12px) translateX(-3.5px) scale(1.05); opacity: 0; }
}
@keyframes linger-runeFloat2 {
  0%   { transform: translateY(0) scale(.5); opacity: 0; }
  30%  { opacity: .95; }
  100% { transform: translateY(-13px) translateX(3px) scale(1.05); opacity: 0; }
}
`,
				text: {
					zh: {
						status: {
							idle: [
								"灵儿在此，静候差遣 🌸",
								"今日要处理什么凡间事务？",
								"衣袖轻拂，随时可以动身。",
								"（理了理裙裾，安静站着）"
							],
							think: [
								"凝神推演中…",
								"让我静心算一算这一步。",
								"灵台清明，正在梳理脉络 ✦",
								"（闭目掐指，指尖灵光微亮）"
							],
							working: [
								"法术将成，稍候片刻。",
								"正在施展符术，灵光流转 ✦",
								"（以指为笔，在空中画符）"
							],
							celebrate: [
								"事成！天地灵气为之一清 ✦",
								"此局已解，皆大欢喜。",
								"（轻轻一跃，花瓣随之升起）"
							],
							error: [
								"哎呀，法诀念错了一个字……",
								"灵气紊乱，待我重新结印。",
								"（符纸烧焦了，有点不好意思）"
							],
							wait: [
								"此事需你定夺。",
								"我在此候你一句话。",
								"（歪头看你，等你示下）"
							],
							disappointed: [
								"唔……这一式没能成。",
								"修行本就有起有落，我再练练。",
								"（垂袖静立，稍作调息）"
							]
						},
						bond: {
							levelUp: [
								"",
								"与你相处久了，我的灵力也稳了些 ✦",
								"此后路上，你我同行便是 (´∀｀)♡"
							],
							poke: [
								[
									"……（睁眼看你一眼）",
									"嗯？",
									"仙家弟子，不可轻戳。",
									"（衣袖一拂）"
								],
								[
									"嘻，痒的。",
									"再戳灵气要散了哦 🌸",
									"把我当小猫了么？",
									"（用袖子挡了一下）"
								],
								[
									"又来啦~ 陪你玩便是 ♡",
									"今天心情好，任你戳。",
									"（把花瓣分你一半）",
									"好啦好啦，我在这儿呢。"
								]
							],
							welcome: [
								"灵儿见过你 🌸",
								"你回来啦，今日也一起吧。",
								"（迎上前一步，衣袖轻扬）"
							],
							chatter: [
								"（安静地站在你身侧）",
								"此地灵气不错，适合修行 ✦",
								"你忙你的，我不打扰。",
								"（把一枚花瓣放在你手边）",
								"若累了，记得歇息。"
							]
						},
						panel: { swim: "🗡 御剑" },
						feedback: {
							roll: "旋身一礼，谢你相伴 ♡",
							feed: "（小口吃了）多谢，味道清甜。",
							hidden: "我先隐去身形，唤我便是 🌸",
							shown: "灵儿回来了，可有事吩咐？",
							schedule1h: "好，一小时后我自行隐去。",
							scheduleDaily: "记下了：每晚 22:00 我自行隐去 🌙",
							sleep: "入定去了…… (Zzz) 💤",
							swim: [
								"御剑起，随云而行 🗡",
								"换个方向看看你在哪。",
								"剑气开路，闲人退避。",
								"乘风一游，正好散心。",
								"（衣袂翻飞，落在剑上）"
							],
							swimOn: "御剑术已开，我自己走走 🗡☁️",
							swimOff: "收剑，灵儿归位。",
							joy: [
								"心里欢喜 ✦",
								"（转了个圈，裙摆旋开）",
								"灵气都轻快起来了。",
								"嘻，今日甚好。"
							],
							pokeDizzy: [
								"哎呀，轻些……有点晕 @-@",
								"转得我眼花啦。",
								"（扶了扶发簪）"
							],
							pokeAnnoyed: [
								"再戳，我可要掐诀了哦 (￣▽￣)\"",
								"凡人，莫要得寸进尺。",
								"好啦，我知道你在 🌀",
								"衣袖都要被你戳皱了。"
							],
							pokeSulk: [
								"哼，不理你了 (￣ε(#￣)",
								"灵儿生气了！",
								"要赔我一枝花才理你 (｀へ´)"
							],
							comfort: [
								"……谢谢你还在 (´;ω;`)",
								"被你这样一摸头，力气就回来了 ✦",
								"有你在，再来一次便是。"
							],
							shaken: [
								"哎呀——别晃了，发簪要掉了 @_@",
								"天旋地转…符也画不直了。",
								"停停停！灵气都被你摇散了 >_<",
								"眼冒金星……容我缓缓。"
							],
							bellyUp: [
								"（旋身一礼）谢过。",
								"既如此，灵儿献丑了 ♡",
								"（转了一圈，衣袖如花）",
								"礼成——可还入眼？"
							],
							dragIdle: [
								"举着不动…你的手不累么？",
								"要放我下来了么？",
								"（悬在半空，袖子垂着）",
								"喂——还在吗？"
							],
							squeezed: [
								"挤…挤扁了 >_<",
								"再推就贴到墙上了。",
								"仙人也会被挤的呀。"
							],
							sizeSet: (name) => `身形化作${name}，可还合适？`,
							sedentarySet: (min) => `好，坐满 ${min} 分钟，我提醒你起来走走。`,
							restNudge: [
								"久坐伤身，起来舒展一下吧 🌸",
								"喝口茶？我陪你歇歇。",
								"眼睛也该歇了，看看远处。",
								"修行也讲张弛，你也一样。"
							]
						},
						micro: {
							spin: [
								"（原地转了个圈，裙裾如花）",
								"转一圈，灵气顺一顺 ✦",
								"旋身一礼——好看么？"
							],
							spell: [
								"敕——！",
								"（结印于胸前，灵光自足下升起）",
								"符成，诸邪退避 ✦",
								"且看这一式。"
							],
							fan: [
								"（展开折扇，徐徐摇了两下）",
								"心静自然凉。",
								"扇面上这枝梅，是我自己题的。"
							],
							gaze: [
								"云那边似乎有动静。",
								"（远眺片刻，风把裙裾带起）",
								"今日天光不错，宜出行。"
							]
						},
						aria: {
							mini: "显示桌宠灵儿",
							miniTitle: (state) => `桌宠灵儿（${state}）· 点我召回，可拖拽移动`
						}
					},
					en: {
						status: {
							idle: [
								"Ling'er is here, awaiting your word 🌸",
								"What mortal business shall we handle today?",
								"Sleeves ready — I can set off anytime.",
								"(smooths her skirt and stands quietly)"
							],
							think: [
								"Divining quietly…",
								"Let me calmly work out this step.",
								"My mind is clear; sorting the threads ✦",
								"(eyes closed, fingers tracing a seal)"
							],
							working: [
								"The spell is nearly done — one moment.",
								"Casting the charm, light spiraling ✦",
								"(drawing a sigil in the air with one finger)"
							],
							celebrate: [
								"Done! The air feels clearer already ✦",
								"The problem is solved — joy all around.",
								"(a light hop, petals rising with her)"
							],
							error: [
								"Oh dear, I mispronounced one syllable…",
								"The qi is tangled; let me reseal it.",
								"(the talisman scorched a little — a bit embarrassed)"
							],
							wait: [
								"This needs your decision.",
								"I will wait here for your word.",
								"(tilts her head, waiting for your call)"
							],
							disappointed: [
								"Mm… that stance did not come together.",
								"Cultivation has its ups and downs; I will practice.",
								"(stands with lowered sleeves, catching her breath)"
							]
						},
						bond: {
							levelUp: [
								"",
								"Spending time with you has steadied my power ✦",
								"From here on, we walk together (´∀｀)♡"
							],
							poke: [
								[
									"……(opens one eye at you)",
									"Mm?",
									"Immortal disciples are not to be poked.",
									"(brushes you off with a sleeve)"
								],
								[
									"Hehe, that tickles.",
									"Poke again and my qi scatters 🌸",
									"Do you take me for a cat?",
									"(blocks it with her sleeve)"
								],
								[
									"Again~ fine, I will play along ♡",
									"Good mood today — poke away.",
									"(shares half of her petals with you)",
									"All right, all right, I am here."
								]
							],
							welcome: [
								"Ling'er greets you 🌸",
								"You are back — let us begin again today.",
								"(steps forward, sleeves lifting)"
							],
							chatter: [
								"(stands quietly at your side)",
								"The qi here is good for training ✦",
								"Do what you must; I will not disturb you.",
								"(sets a petal beside your hand)",
								"If you tire, please rest."
							]
						},
						panel: { swim: "🗡 Sword flight" },
						feedback: {
							roll: "A spin and a bow, for your company ♡",
							feed: "(takes a small bite) Thank you — sweet and light.",
							hidden: "I will veil myself; call and I come 🌸",
							shown: "Ling'er has returned — what do you need?",
							schedule1h: "Very well, I will veil myself in an hour.",
							scheduleDaily: "Noted: I will veil myself at 22:00 each night 🌙",
							sleep: "Entering meditation… (Zzz) 💤",
							swim: [
								"The sword rises — riding the clouds 🗡",
								"Circling around to find you.",
								"Sword light clears the way.",
								"A ride on the wind, just to clear my head.",
								"(robe fluttering, alighting on the blade)"
							],
							swimOn: "Sword flight engaged — I will wander on my own 🗡☁️",
							swimOff: "Blade sheathed; Ling'er returns.",
							joy: [
								"My heart is light ✦",
								"(spins once, skirt flaring)",
								"Even the qi feels cheerful.",
								"Hehe, a fine day."
							],
							pokeDizzy: [
								"Oh — gently, I am a little dizzy @-@",
								"You are making my head spin.",
								"(steadies her hairpin)"
							],
							pokeAnnoyed: [
								"Poke again and I will cast a spell (￣▽￣)\"",
								"Mortal, do not push your luck.",
								"All right, I know you are there 🌀",
								"You are creasing my sleeves."
							],
							pokeSulk: [
								"Hmph, I am not talking to you (￣ε(#￣)",
								"Ling'er is upset!",
								"Bring me a flower and I may forgive you (｀へ´)"
							],
							comfort: [
								"…thank you for staying (´;ω;`)",
								"A headpat like that and my strength returns ✦",
								"With you here, let us try again."
							],
							shaken: [
								"Ah—stop shaking me, my hairpin will fall @_@",
								"The world spins… I cannot draw a straight sigil.",
								"Stop, stop! You are scattering my qi >_<",
								"Seeing stars… give me a moment."
							],
							bellyUp: [
								"(spins and bows) My thanks.",
								"Then allow me to perform ♡",
								"(one turn, sleeves blooming like a flower)",
								"How was that?"
							],
							dragIdle: [
								"Held up like this… does your arm not ache?",
								"Will you set me down?",
								"(dangling, sleeves hanging)",
								"Hello—— are you still there?"
							],
							squeezed: [
								"Squeezed… I am flat >_<",
								"Push more and I will stick to the wall.",
								"Even immortals get squashed."
							],
							sizeSet: (name) => `My form is now ${name} — is it fitting?`,
							sedentarySet: (min) => `Very well: after ${min} minutes I will remind you to stretch.`,
							restNudge: [
								"Sitting long harms the body — rise and stretch 🌸",
								"Some tea? I will rest with you.",
								"Your eyes need rest too; look far away.",
								"Even cultivation needs balance — so do you."
							]
						},
						micro: {
							spin: [
								"(turns once on the spot, skirt blooming)",
								"One turn to settle my qi ✦",
								"A twirl and a bow — how was that?"
							],
							spell: [
								"Seal — !",
								"(forms a sign at her chest, light rising from her feet)",
								"The charm holds; nothing foul may pass ✦",
								"Watch this one."
							],
							fan: [
								"(unfurls a folding fan and waves it twice)",
								"A calm mind cools itself.",
								"I wrote that plum branch on the fan myself."
							],
							gaze: [
								"Something stirs past those clouds.",
								"(gazes afar, skirt lifted by the wind)",
								"Fine light today — good for travel."
							]
						},
						aria: {
							mini: "Show desktop pet Ling'er",
							miniTitle: (state) => `Desktop pet Ling'er (${state}) · Click to recall, draggable`
						}
					}
				},
				size: {
					w: 87,
					h: 160
				},
				idleDrift: false,
				micro: [
					"spin",
					"spell",
					"fan",
					"gaze"
				]
			}
		];
		/** 首次运行（或存储里的 id 失效）时用哪只 */
		const DEFAULT_PET_ID = "whale";
		const PET_KEY = "pet-whale:pet";
		/** 按 id 取宠物；id 不认识时回落到默认宠物，绝不返回 undefined */
		function petOf(id) {
			return PETS.find((p) => p.id === id) ?? PETS.find((p) => p.id === "whale") ?? PETS[0];
		}
		function loadPetId() {
			try {
				const raw = localStorage.getItem(PET_KEY);
				if (raw !== null && PETS.some((p) => p.id === raw)) return raw;
			} catch {}
			return DEFAULT_PET_ID;
		}
		function savePetId(id) {
			try {
				localStorage.setItem(PET_KEY, id);
			} catch {}
		}
		//#endregion
		//#region src/client/i18n.ts
		const zh = {
			status: {
				idle: [
					"小鲸鱼待命中~ 点击我可以戳戳哦 🐳",
					"今天有什么新的代码任务呢？✨",
					"摇摇尾巴，随时准备出发！"
				],
				think: [
					"正在深潜检索知识库... 🌊",
					"认真思考架构逻辑中...",
					"咕噜噜... 正在探索深海答案"
				],
				working: [
					"认真敲代码中！⚡",
					"噼里啪啦码字中，很快就好~ ⌨️",
					"正在调用 Agent 工具执行任务！"
				],
				celebrate: [
					"太棒啦！任务圆满搞定~ 🎉",
					"代码测试全绿，完美交付！✨",
					"冒泡庆祝中，请主人查收~"
				],
				error: [
					"哎呀出错了，正在发抖求救 🥺",
					"捕获到一个异常，正在尝试自愈...",
					"呜呜呜，遇到阻碍了 >_<"
				],
				wait: [
					"主人，这里需要你确认一下 🙋",
					"等你拍板呢，我先把进度停在这里~",
					"需要你看一眼再继续哦 ✋"
				],
				disappointed: [
					"呜呜... 刚刚没发挥好，有点小失落 🥺",
					"失败是成功之母，我再缓缓~",
					"下次一定会更好的..."
				]
			},
			bond: {
				tierName: [
					"初识",
					"熟络",
					"形影不离"
				],
				levelUp: [
					"",
					"好像... 跟你熟起来了呢 🐋✨",
					"已经离不开你啦，别丢下我哦 (´∀｀)♡"
				],
				poke: [
					[
						"咕噜。",
						"……（歪着头看你）",
						"唔，痒。",
						"（往旁边挪了挪）"
					],
					[
						"咕噜咕噜~ 戳到软软的肚皮啦！",
						"好痒呀~ 哈哈哈 (≧▽≦)",
						"鲸鱼活力 +10！继续加油~",
						"小尾巴拍拍水，心情超棒 ✨"
					],
					[
						"又戳我~ 就知道你闲不住 (´∀｀)",
						"嘿嘿，今天也来找我玩啦 ♡",
						"再多戳一会儿嘛，我不介意的 🐳",
						"（主动把肚皮翻过来给你）"
					]
				],
				welcome: [
					"你好，我是这儿的鲸鱼 🐋",
					"欢迎回来，今天也一起加油吧！🐳✨",
					"你来啦！我一直在等你 🐳✨"
				],
				chatter: [
					"欸嘿，我在这儿哦 🐳",
					"（悄悄看了你一眼）",
					"今天也一起呢，真好 ✨",
					"（用尾巴轻轻戳了戳你）",
					"不打扰你，就是想冒个泡 🫧"
				]
			},
			menu: {
				feed: "🐟 投喂小鱼干",
				headpat: "✨ 摸摸头",
				soundOn: "🔊 音效: 开",
				soundOff: "🔇 音效: 关",
				hide: "🙈 隐藏到右下角",
				more: "⚙ 更多设置…",
				copyError: "📋 复制错误信息"
			},
			panel: {
				title: "更多设置",
				appearance: "外观",
				pet: "🐾 宠物",
				colors: "🎨 配色",
				behavior: "行为",
				stats: "陪伴记录",
				statsCompleted: (n) => `🏆 已完成回合：${n}`,
				statsInteractions: (n) => `💬 亲密互动：${n} 次`,
				statsErrors: (n) => `🛠 遇到异常：${n} 次`,
				statsDays: (n) => `📅 共同陪伴：${n} 天`,
				statsBond: (name, pct) => pct < 0 ? `💞 关系：${name}（满）` : `💞 关系：${name}（下一档 ${pct}%）`,
				size: (name) => `📐 大小：${name}`,
				sizeNames: [
					"小",
					"标准",
					"大",
					"特大"
				],
				rest: "休息",
				pretend: "💼 假装工作",
				thinkTicker: "🧠 思考链",
				swim: "🏊 游泳",
				volume: (name) => `🔊 音量：${name}`,
				volumeOff: "静音",
				volumeNames: [
					"小",
					"中",
					"大"
				],
				followAll: "🫧 跟随所有会话",
				notify: "🔔 完成提醒",
				sysNotify: "📢 系统通知",
				sedentary: (min) => min === 0 ? "⏰ 久坐提醒：关" : `⏰ 久坐提醒：${min} 分钟`,
				schedule: "🕐 定时隐藏",
				in1h: "1 小时后隐藏",
				daily: "每晚 22:00 隐藏",
				cancelSchedule: "取消定时隐藏",
				hide: "🙈 隐藏到右下角",
				close: "⏹ 关闭桌宠",
				back: "← 返回"
			},
			pet: {
				whale: "小鲸鱼",
				cat: "小猫",
				linger: "灵儿"
			},
			palette: {
				terracotta: "陶土",
				ocean: "深海蓝",
				matcha: "抹茶绿",
				sakura: "樱粉",
				ink: "墨灰",
				night: "夜黑",
				"theme-blue": "主题蓝",
				qinglian: "青莲"
			},
			micro: {},
			feedback: {
				squish: "戳一戳，心情 +1 ✨",
				roll: "翻个 360° 跟头给你看！(≧∇≦)ﾉ ✨",
				feed: "嚼嚼嚼... 获得小鱼干能量！美味~ 🐟",
				patted: [
					"被摸摸头啦~ 暖洋洋的超开心 🥰",
					"呼噜呼噜... 再摸一下嘛 (´▽`)",
					"头顶暖暖的，眼睛都睁不开了~ 💤",
					"嘿嘿，被摸得好舒服 💖"
				],
				patTooFast: [
					"再摸就秃头了！😤",
					"头顶都要搓冒烟了，不给摸了！🔥",
					"哼，手这么重，我游远点 😤"
				],
				paletteApplied: (name) => `换上新皮肤「${name}」~ 🎨`,
				petApplied: (name) => `换成${name}啦~ 🐾`,
				pretendOn: "进入假装工作模式，开始表演敲代码 ⌨️💼",
				pretendOff: "下班！恢复真实状态~",
				tickerOn: "思考链已开启：思考时会在我头顶滚动 🧠",
				tickerOff: "思考链已关闭~",
				hidden: "我先藏到右下角啦，想我随时点 🐳",
				shown: "回来啦！想我了没~ 🐳",
				schedule1h: "好~ 1 小时后我会自己藏到右下角 🐳",
				scheduleDaily: "记下啦：每天 22:00 自动藏到右下角 🌙",
				scheduleCancel: "定时隐藏已取消~",
				errorCopied: "错误信息已复制到剪贴板，快去找主人帮忙 📋",
				errorCopyFailed: "复制失败，请检查浏览器的剪贴板权限",
				wake: "醒啦！随时准备开工~ ✨",
				sleep: "呼噜噜... 正在做深海美梦 (Zzz) 💤",
				avoid: "让一让~ 这里交给你啦 ✨",
				swim: [
					"游一游，活动一下~ 🐳",
					"换个角度看主人 ✨",
					"咕噜噜... 巡视领地中 🌊",
					"深潜探索一下海底世界~ 🫧",
					"摇摇尾巴，优雅地划水中 🐋"
				],
				swimOn: "游泳模式已开启，我会自己到处游啦 🐳🌊",
				swimOff: "游泳模式已关闭，我乖乖待命~",
				followAllOn: "别的会话有动静我也会告诉你~",
				followAllOff: "好，我只盯着眼前这个会话~",
				joy: [
					"嘻嘻，最喜欢主人啦~ 🥰",
					"好开心！能量充满啦~ ✨",
					"冒个爱心泡泡送给你 💖",
					"摇摇尾巴，心情极佳 🐋"
				],
				pokeDizzy: [
					"哎呀，轻轻戳嘛，有点小晕乎 @-@",
					"晕头转向了... 别戳太用力呀 🥺",
					"晃晃脑袋，差点被戳倒啦 ~"
				],
				pokeAnnoyed: [
					"喂喂喂，戳上瘾啦？(￣▽￣)\"",
					"再戳我就要游走咯 ~",
					"好啦好啦，知道你在了 🐳",
					"肚皮都要被戳凹了啦 >_<"
				],
				pokeSulk: [
					"哼，不理你了 (￣ε(#￣)",
					"鲸鱼罢工中，请稍后再试 💤",
					"生气了！要哄哄才理你 (｀へ´)"
				],
				comfort: [
					"呜... 谢谢你还在 (´;ω;`)",
					"被摸了摸头，好像又有力气了 ✨",
					"有你在就没关系啦，再来一次！🐋"
				],
				shaken: [
					"呜哇——太晕了！别甩啦 @_@",
					"天旋地转... 我要吐泡泡了 🫧",
					"停停停！海水都被你搅浑啦 >_<",
					"眼冒金星... 让我缓缓 (@_@;)"
				],
				bellyUp: [
					"翻个肚皮给你看~ 只对你哦 ♡",
					"哗啦——肚皮朝天，最舒服的姿势 (´∀｀)",
					"晒肚皮时间！别戳痒痒肉 🐳",
					"完全放松状态，可以随便摸 ✨"
				],
				dragIdle: [
					"举着不动... 手不酸吗 (・_・)",
					"要放我下来了吗，还是继续举着 ~",
					"悬在半空有点没安全感呀 🥺",
					"喂——还在吗？我还挂着呢 🐋"
				],
				squeezed: [
					"挤挤挤... 贴在墙上啦 >_<",
					"这边到头咯，再推就扁了 🫠",
					"呜，脸被压平了 (＞﹏＜)"
				],
				squashedTop: ["咚！撞到天花板了 >_<", "头顶被压扁啦，再按就成饼了 🫠"],
				squashedBottom: ["被按在海底了... 扁扁的 (＞﹏＜)", "压、压成鲸鱼饼了 🫓"],
				sizeSet: (name) => `变成${name}号啦~ 合适吗 🐳`,
				notifyOn: "好耶！你不在的时候我会在标签页上喊你 🔔",
				notifyOff: "不喊你了，安安静静的 🤫",
				sysNotifyOn: "系统通知已开启，跑到别的窗口也能收到 📢",
				sysNotifyOff: "系统通知已关闭 🔕",
				sysNotifyDenied: "浏览器不让我发通知，去地址栏左边的锁里放行一下 🥺",
				sedentarySet: (min) => `好，坐满 ${min} 分钟我就浮上来提醒你 ⏰`,
				sedentaryOff: "久坐提醒关掉啦，你随意 ~",
				restNudge: [
					"坐好久啦，起来动动肩膀吧 🐳",
					"喝口水？我陪你歇一会儿 ☕",
					"眼睛也要休息的，看看远处吧 ✨",
					"深海也需要浮上来换气呀，你也是 🫧"
				]
			},
			multi: {
				badge: (n) => `另外 ${n} 个会话正在跑`,
				doneOther: (title) => title === "" ? "另一个会话跑完啦 ✅" : `「${title}」那边跑完啦 ✅`,
				waitingOther: (title) => title === "" ? "另一个会话在等你确认 👀" : `「${title}」在等你确认 👀`,
				parallel: (n) => [`${n} 个会话一起跑，全速并发推进中！🌊`, `左鳍一个右鳍一个，${n} 路并发开工~ 💨`],
				overtime: (n) => [`${n} 个会话同时开工……这就是加班吗 😵`, `${n} 路并发？！以后再也不想加班了 😭`],
				allDone: ["好累啊……终于全部搞定了 🫠", "呼——全部收工！让我瘫一会儿 💦"]
			},
			notify: {
				titleDone: "完成了",
				bodyDone: "这一轮跑完啦，回来看看吧"
			},
			aria: {
				petName: (name) => `桌宠${name}`,
				mini: "显示桌宠小鲸鱼",
				miniTitle: (state) => `桌宠小鲸鱼（${state}）· 点我召回，可拖拽移动`
			}
		};
		const en = {
			status: {
				idle: [
					"Whale on standby~ Click me for a poke! 🐳",
					"Any new code tasks today? ✨",
					"Wagging my tail, ready to go!"
				],
				think: [
					"Diving deep into the knowledge base... 🌊",
					"Thinking through the architecture...",
					"Blub blub... exploring the deep sea of answers"
				],
				working: [
					"Typing code seriously! ⚡",
					"Clack clack, almost done~ ⌨️",
					"Calling agent tools to get things done!"
				],
				celebrate: [
					"Yay! Task completed~ 🎉",
					"All tests green, perfect delivery! ✨",
					"Bubbling with joy, check it out~"
				],
				error: [
					"Oops, something went wrong 🥺",
					"Caught an exception, trying to self-heal...",
					"Wahh, I hit a snag >_<"
				],
				wait: [
					"Hey, I need your confirmation here 🙋",
					"Waiting for your call—I will hold right here~",
					"Please take a look before I continue ✋"
				],
				disappointed: [
					"Aww... that did not go well, feeling a bit down 🥺",
					"Failure is the mother of success, give me a moment~",
					"I will do better next time..."
				]
			},
			bond: {
				tierName: [
					"Acquainted",
					"Close",
					"Inseparable"
				],
				levelUp: [
					"",
					"I think... we are getting close 🐋✨",
					"I cannot do without you now. Do not leave me (´∀｀)♡"
				],
				poke: [
					[
						"Bloop.",
						"...(tilts head at you)",
						"Mm. That tickles.",
						"(shuffles aside a little)"
					],
					[
						"Glub glub~ You poked my soft belly!",
						"That tickles~ haha (≧▽≦)",
						"Whale energy +10! Keep it up~",
						"Splashing my tail, feeling great ✨"
					],
					[
						"Poking me again~ I knew you could not sit still (´∀｀)",
						"Hehe, you came to play with me today too ♡",
						"Keep going, I really do not mind 🐳",
						"(rolls over to offer you the belly)"
					]
				],
				welcome: [
					"Hello. I am the whale who lives here 🐋",
					"Welcome back! Let us do our best today! 🐳✨",
					"You are here! I have been waiting 🐳✨"
				],
				chatter: [
					"Heh, I am right here 🐳",
					"(sneaks a glance at you)",
					"Together again today. Nice ✨",
					"(pokes you gently with the tail)",
					"Not interrupting, just saying hi 🫧"
				]
			},
			menu: {
				feed: "🐟 Feed fish snack",
				headpat: "✨ Headpat",
				soundOn: "🔊 Sound: On",
				soundOff: "🔇 Sound: Off",
				hide: "🙈 Hide to corner",
				more: "⚙ More settings…",
				copyError: "📋 Copy error"
			},
			panel: {
				title: "More Settings",
				appearance: "Appearance",
				pet: "🐾 Pet",
				colors: "🎨 Colors",
				behavior: "Behavior",
				stats: "Companion Stats",
				statsCompleted: (n) => `🏆 Completed Turns: ${n}`,
				statsInteractions: (n) => `💬 Interactions: ${n}`,
				statsErrors: (n) => `🛠 Errors Encountered: ${n}`,
				statsDays: (n) => `📅 Days Together: ${n} d`,
				statsBond: (name, pct) => pct < 0 ? `💞 Bond: ${name} (max)` : `💞 Bond: ${name} (next ${pct}%)`,
				size: (name) => `📐 Size: ${name}`,
				sizeNames: [
					"Small",
					"Standard",
					"Large",
					"Huge"
				],
				rest: "Rest",
				pretend: "💼 Pretend to work",
				thinkTicker: "🧠 Think ticker",
				swim: "🏊 Swimming",
				volume: (name) => `🔊 Volume: ${name}`,
				volumeOff: "Muted",
				volumeNames: [
					"Low",
					"Medium",
					"High"
				],
				followAll: "🫧 Follow all sessions",
				notify: "🔔 Finish alert",
				sysNotify: "📢 System notification",
				sedentary: (min) => min === 0 ? "⏰ Break reminder: off" : `⏰ Break reminder: ${min} min`,
				schedule: "🕐 Auto-hide",
				in1h: "Hide in 1 hour",
				daily: "Hide every day at 22:00",
				cancelSchedule: "Cancel auto-hide",
				hide: "🙈 Hide to corner",
				close: "⏹ Close pet",
				back: "← Back"
			},
			pet: {
				whale: "Whale",
				cat: "Cat",
				linger: "Ling'er"
			},
			palette: {
				terracotta: "Terracotta",
				ocean: "Ocean Blue",
				matcha: "Matcha Green",
				sakura: "Sakura Pink",
				ink: "Ink Gray",
				night: "Night Black",
				"theme-blue": "Theme Blue",
				qinglian: "Lotus Green"
			},
			micro: {},
			feedback: {
				squish: "Poke! Mood +1 ✨",
				roll: "A 360° flip just for you! (≧∇≦)ﾉ ✨",
				feed: "Munch munch... fish snack energy! Yummy~ 🐟",
				patted: [
					"Headpat received~ warm and happy 🥰",
					"Mmm... one more pat, please (´▽`)",
					"So cozy up here, my eyes are closing~ 💤",
					"Hehe, that feels so nice 💖"
				],
				patTooFast: [
					"Any more and I go bald! 😤",
					"My head is about to smoke. No more pats! 🔥",
					"Hmph, too rough. I am swimming away 😤"
				],
				paletteApplied: (name) => `New skin applied: ${name}~ 🎨`,
				petApplied: (name) => `Now playing as ${name}~ 🐾`,
				pretendOn: "Entering pretend-work mode, time to type ⌨️💼",
				pretendOff: "Off duty! Back to real state~",
				tickerOn: "Think ticker enabled: thoughts will scroll above me 🧠",
				tickerOff: "Think ticker disabled~",
				hidden: "I will hide in the corner. Call me anytime 🐳",
				shown: "Back again! Missed me~ 🐳",
				schedule1h: "Okay~ I will hide in the corner in 1 hour 🐳",
				scheduleDaily: "Got it: I will auto-hide at 22:00 every day 🌙",
				scheduleCancel: "Auto-hide cancelled~",
				errorCopied: "Error copied to clipboard, go ask for help 📋",
				errorCopyFailed: "Copy failed. Please check clipboard permission in your browser.",
				wake: "Awake! Ready to work~ ✨",
				sleep: "Zzz... dreaming in the deep sea (Zzz) 💤",
				avoid: "Let me make room for you~ ✨",
				swim: [
					"Swimming around a bit~ 🐳",
					"Looking at you from another angle ✨",
					"Blub blub... patrolling my territory 🌊",
					"Diving deep to explore the seabed~ 🫧",
					"Wagging my tail, gliding smoothly 🐋"
				],
				swimOn: "Swimming mode on: I will roam around by myself 🐳🌊",
				swimOff: "Swimming mode off: I will stay put~",
				followAllOn: "I will keep an eye on your other sessions too~",
				followAllOff: "Got it, just this session~",
				joy: [
					"Hehe, love you the most! 🥰",
					"So happy! Energy fully restored~ ✨",
					"A heart bubble just for you 💖",
					"Wagging my tail with joy 🐋"
				],
				pokeDizzy: [
					"Woah, gentle please! Feeling a bit dizzy @-@",
					"Spinning around... don't poke too hard 🥺",
					"Shaking my head, almost fell over~"
				],
				pokeAnnoyed: [
					"Hey, hooked on poking me? (￣▽￣)\"",
					"Poke again and I am swimming away~",
					"Alright alright, I know you are there 🐳",
					"My belly is getting dented >_<"
				],
				pokeSulk: [
					"Hmph. Not talking to you (￣ε(#￣)",
					"Whale on strike. Try again later 💤",
					"Now I am upset! Cheer me up first (｀へ´)"
				],
				comfort: [
					"Sniff... thanks for staying (´;ω;`)",
					"That head pat helped. I feel better ✨",
					"With you here it is fine. Let us try again! 🐋"
				],
				shaken: [
					"Whoaa - too dizzy! Stop shaking me @_@",
					"The room is spinning... I might blow bubbles 🫧",
					"Stop stop stop! You stirred up the whole sea >_<",
					"Seeing stars... give me a second (@_@;)"
				],
				bellyUp: [
					"Belly up, just for you ♡",
					"Whoosh - belly to the sky, the comfiest pose (´∀｀)",
					"Belly sunbathing time! Mind the ticklish spot 🐳",
					"Fully relaxed. Pet away ✨"
				],
				dragIdle: [
					"Still holding me up... arm not tired? (・_・)",
					"Are you putting me down, or is this the new normal~",
					"Dangling in midair feels a bit unsafe 🥺",
					"Helloo - still there? I am still hanging here 🐋"
				],
				squeezed: [
					"Squish... pressed against the wall >_<",
					"That is the edge. Push more and I go flat 🫠",
					"Ow, my face is flattened (＞﹏＜)"
				],
				squashedTop: ["Bonk! Hit the ceiling >_<", "My head got flattened. Any more and I am a pancake 🫠"],
				squashedBottom: ["Pinned to the seabed... so flat (＞﹏＜)", "Squashed into a whale pancake 🫓"],
				sizeSet: (name) => `Now I am ${name} size~ Does it fit? 🐳`,
				notifyOn: "Got it! I will shout from the tab title while you are away 🔔",
				notifyOff: "Staying quiet now 🤫",
				sysNotifyOn: "System notifications on — you will hear me from any window 📢",
				sysNotifyOff: "System notifications off 🔕",
				sysNotifyDenied: "The browser blocked notifications. Allow them from the lock icon 🥺",
				sedentarySet: (min) => `Alright, I will surface after ${min} minutes of sitting ⏰`,
				sedentaryOff: "Break reminder off. Do your thing~",
				restNudge: [
					"You have been sitting a while. Roll those shoulders 🐳",
					"Water break? I will rest with you ☕",
					"Eyes need rest too — look at something far away ✨",
					"Even the deep sea surfaces to breathe. So should you 🫧"
				]
			},
			multi: {
				badge: (n) => `${n} other session${n === 1 ? "" : "s"} running`,
				doneOther: (title) => title === "" ? "Another session just finished ✅" : `"${title}" just finished ✅`,
				waitingOther: (title) => title === "" ? "Another session needs your confirmation 👀" : `"${title}" needs your confirmation 👀`,
				parallel: (n) => [`${n} sessions at once — full-speed parallel push! 🌊`, `One per fin: ${n} running in parallel~ 💨`],
				overtime: (n) => [`${n} sessions at once... is this what overtime feels like 😵`, `${n} in parallel?! No more overtime, ever 😭`],
				allDone: ["So tired... finally got every last one done 🫠", "Phew — all wrapped up! Let me flop for a bit 💦"]
			},
			notify: {
				titleDone: "Done",
				bodyDone: "This round finished. Come take a look"
			},
			aria: {
				petName: (name) => `Desktop pet ${name}`,
				mini: "Show desktop pet whale",
				miniTitle: (state) => `Desktop whale (${state}) · Click to recall, draggable`
			}
		};
		const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
		/** 把宠物覆盖合并到基准文案上：对象递归，其余（数组/函数/字符串）整体替换。 */
		function mergeStrings(base, overrides) {
			if (!overrides) return base;
			const out = { ...base };
			for (const [key, value] of Object.entries(overrides)) {
				if (value === void 0) continue;
				const current = base[key];
				out[key] = isPlainObject(current) && isPlainObject(value) ? mergeStrings(current, value) : value;
			}
			return out;
		}
		/** 根据浏览器语言返回支持的语言，未命中默认 zh。 */
		function detectBrowserLocale() {
			if (typeof navigator === "undefined") return "zh";
			for (const tag of [...navigator.languages ?? [], navigator.language]) {
				const primary = String(tag ?? "").toLowerCase().split("-")[0];
				if (primary === "en") return "en";
				if (primary === "zh") return "zh";
			}
			return "zh";
		}
		/**
		* 取当前语言的文案。
		* `overrides` 是当前宠物的文案覆盖（PetModule.text[locale]）：只写要改的条目，
		* 其余回落到 i18n.ts 里的通用文案（以鲸鱼口吻为基准）。
		*/
		function getStrings(locale, overrides) {
			return mergeStrings(locale === "en" ? en : zh, overrides);
		}
		function paletteName(locale, id, fallback) {
			return getStrings(locale).palette[id] ?? fallback;
		}
		/** 宠物名字：i18n 里没写就回落到 PetModule 自带的名字，加新宠物不必立刻补文案。 */
		function petName(locale, id, fallback) {
			return getStrings(locale).pet[id] ?? fallback;
		}
		//#endregion
		//#region src/client/swim.ts
		const SWIM_STORAGE_KEY = "pet-whale:swim";
		const pick$1 = (list) => list[Math.floor(Math.random() * list.length)];
		const MAX_PARTICLES = 40;
		/** 获取或创建独立的全屏固定粒子层（挂在 body 下，避免随鲸鱼 root 位移） */
		function getOrCreateParticleLayer() {
			if (typeof document === "undefined") return null;
			let layer = document.querySelector("[data-dsh-whale-particles]");
			if (!layer) {
				layer = document.createElement("div");
				layer.setAttribute("data-dsh-whale-particles", "");
				layer.className = "pw-particle-layer";
				document.body.appendChild(layer);
			}
			return layer;
		}
		var WhaleSwimmer = class {
			ctx;
			enabled = false;
			rafId = 0;
			timerId;
			isSwimming = false;
			facing = "left";
			disposed = false;
			currentPos = {
				x: 0,
				y: 0
			};
			startPos = {
				x: 0,
				y: 0
			};
			targetPos = {
				x: 0,
				y: 0
			};
			cp1 = {
				x: 0,
				y: 0
			};
			cp2 = {
				x: 0,
				y: 0
			};
			startTime = 0;
			duration = 2400;
			currentMode = "cruise";
			particles = [];
			lastBubbleTime = 0;
			lastRippleTime = 0;
			lastStreamBubbleTime = 0;
			hasSplashedThisSession = false;
			constructor(ctx) {
				this.ctx = ctx;
				this.ctx.root.dataset.facing = this.facing;
				this.loadState();
			}
			get isEnabled() {
				return this.enabled;
			}
			setEnabled(value) {
				if (this.enabled === value) return;
				this.enabled = value;
				this.saveState();
				if (this.enabled) this.scheduleNext(1200);
				else this.stop();
			}
			toggle() {
				this.setEnabled(!this.enabled);
				return this.enabled;
			}
			get currentFacing() {
				return this.facing;
			}
			setFacing(f) {
				this.facing = f;
				this.ctx.root.dataset.facing = f;
				this.ctx.pet.style.transform = `scaleX(${f === "left" ? 1 : -1}) rotate(0deg)`;
			}
			loadState() {
				try {
					this.enabled = localStorage.getItem(SWIM_STORAGE_KEY) === "1";
				} catch {
					this.enabled = false;
				}
			}
			saveState() {
				try {
					localStorage.setItem(SWIM_STORAGE_KEY, this.enabled ? "1" : "0");
				} catch {}
			}
			/** agent 状态切换通知 */
			onStateChange(state) {
				if (state !== "idle") this.stop();
				else if (this.enabled) this.scheduleNext(2e3 + Math.random() * 2e3);
			}
			/** 用户开始拖拽/点击交互时立即中断游泳 */
			/** 被甩晕之后游不直，到这个时刻为止 */
			woozyUntil = 0;
			/** 晕了多久：期间的航迹会明显更歪 */
			setWoozy(ms) {
				this.woozyUntil = (typeof performance !== "undefined" ? performance.now() : Date.now()) + ms;
			}
			get isWoozy() {
				return (typeof performance !== "undefined" ? performance.now() : Date.now()) < this.woozyUntil;
			}
			interrupt() {
				this.stop();
				if (this.enabled) this.scheduleNext(5e3 + Math.random() * 3e3);
			}
			/** 停止当前正在进行的游泳与计时器，平稳复位 */
			stop() {
				if (this.rafId !== 0) {
					window.cancelAnimationFrame(this.rafId);
					this.rafId = 0;
				}
				if (this.timerId !== void 0) {
					window.clearTimeout(this.timerId);
					this.timerId = void 0;
				}
				this.clearParticles();
				this.ctx.pet.style.opacity = "1";
				if (this.isSwimming) {
					this.isSwimming = false;
					this.ctx.root.classList.remove("swimming");
					this.ctx.pet.classList.remove("swimming", "swimming-dive");
					this.ctx.root.dataset.facing = this.facing;
					this.ctx.pet.style.transform = `scaleX(${this.facing === "left" ? 1 : -1}) rotate(0deg)`;
					this.ctx.savePos();
				}
			}
			/** 调度下一次游泳 */
			scheduleNext(delay) {
				if (this.timerId !== void 0) {
					window.clearTimeout(this.timerId);
					this.timerId = void 0;
				}
				if (this.disposed || !this.enabled) return;
				const wait = delay ?? 3e3 + Math.random() * 3500;
				this.timerId = window.setTimeout(() => {
					this.timerId = void 0;
					if (!this.enabled) return;
					if (this.prefersReducedMotion()) {
						this.scheduleNext(6e3);
						return;
					}
					if (this.ctx.isBusy()) {
						this.scheduleNext(1500);
						return;
					}
					this.startSwimSession();
				}, wait);
			}
			prefersReducedMotion() {
				if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
				return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			}
			/** 启动一次自然游动或深潜 */
			startSwimSession() {
				this.stop();
				this.ctx.root.style.transition = "";
				const curX = parseFloat(this.ctx.root.style.left) || 0;
				const curY = parseFloat(this.ctx.root.style.top) || 0;
				this.startPos = {
					x: curX,
					y: curY
				};
				this.currentPos = {
					x: curX,
					y: curY
				};
				this.currentMode = Math.random() < .22 ? "dive" : "cruise";
				const { target, cp1, cp2, duration } = this.planTrajectory(this.startPos, this.currentMode);
				this.targetPos = target;
				this.cp1 = cp1;
				this.cp2 = cp2;
				this.duration = duration;
				this.startTime = performance.now();
				this.lastBubbleTime = this.startTime;
				this.lastRippleTime = this.startTime;
				this.lastStreamBubbleTime = this.startTime;
				this.hasSplashedThisSession = false;
				this.isSwimming = true;
				this.ctx.root.classList.add("swimming");
				this.ctx.pet.classList.add("swimming");
				if (this.currentMode === "dive") this.ctx.pet.classList.add("swimming-dive");
				if (Math.random() < .3) {
					const strings = this.ctx.getStrings();
					this.ctx.showDialog(pick$1(strings.feedback.swim));
				}
				this.rafId = window.requestAnimationFrame(this.step);
			}
			/** 规划贝塞尔曲线航迹 */
			planTrajectory(start, mode) {
				const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
				const vh = typeof window !== "undefined" ? window.innerHeight : 900;
				const dist = mode === "dive" ? 100 + Math.random() * 120 : 140 + Math.random() * 180;
				const cx = vw / 2;
				const cy = vh / 2;
				const toCenterAngle = Math.atan2(cy - start.y, cx - start.x);
				const wobble = this.isWoozy ? 2.2 : 1;
				const angle = toCenterAngle + (Math.random() * 1.8 - .9) * wobble;
				const rawTx = start.x + Math.cos(angle) * dist;
				const rawTy = start.y + Math.sin(angle) * dist + (mode === "dive" ? 30 + Math.random() * 40 : 0);
				const target = this.ctx.clampPos(rawTx, rawTy);
				const dx = target.x - start.x;
				const dy = target.y - start.y;
				const actualDist = Math.hypot(dx, dy) || 1;
				const nx = -dy / actualDist;
				const ny = dx / actualDist;
				const curveAmp = (mode === "dive" ? 45 : 30 + Math.random() * 35) * (Math.random() < .5 ? 1 : -1) * wobble;
				let cp1;
				let cp2;
				if (mode === "dive") {
					cp1 = {
						x: start.x + dx * .3 + nx * curveAmp * .5,
						y: start.y + dy * .2 + 55
					};
					cp2 = {
						x: start.x + dx * .7 + nx * curveAmp * .5,
						y: start.y + dy * .8 + 45
					};
				} else {
					cp1 = {
						x: start.x + dx * .33 + nx * curveAmp,
						y: start.y + dy * .33 + ny * curveAmp
					};
					cp2 = {
						x: start.x + dx * .67 + nx * curveAmp * .6,
						y: start.y + dy * .67 + ny * curveAmp * .6
					};
				}
				const duration = Math.max(1600, Math.min(3600, actualDist * 14 + (mode === "dive" ? 600 : 0)));
				return {
					target,
					cp1,
					cp2,
					duration
				};
			}
			/** 产生尾部扩散水纹圈（挂在全局粒子层，视口绝对坐标，留出自然拖尾） */
			spawnWaterRipple(x, y, isDive = false) {
				if (typeof document === "undefined" || this.prefersReducedMotion()) return;
				const layer = getOrCreateParticleLayer();
				if (!layer) return;
				const ripple = document.createElement("span");
				ripple.className = "pw-water-ripple";
				ripple.style.left = `${x}px`;
				ripple.style.top = `${y}px`;
				if (isDive) {
					ripple.style.width = "52px";
					ripple.style.height = "32px";
				} else {
					ripple.style.width = "38px";
					ripple.style.height = "24px";
				}
				layer.appendChild(ripple);
				this.addParticle(ripple);
			}
			/** 产生游动流线微水泡（挂在全局粒子层，自然随洋流向上/向后漂移） */
			spawnStreamBubble(x, y, isDive = false) {
				if (typeof document === "undefined" || this.prefersReducedMotion()) return;
				const layer = getOrCreateParticleLayer();
				if (!layer) return;
				const bubble = document.createElement("span");
				bubble.className = "pw-stream-bubble";
				const size = isDive ? 5 + Math.random() * 5 : 3.5 + Math.random() * 4;
				const dx = (this.facing === "left" ? 1 : -1) * (10 + Math.random() * 16);
				const dy = -(14 + Math.random() * 22);
				const dur = .9 + Math.random() * .45;
				bubble.style.left = `${x + (Math.random() * 12 - 6)}px`;
				bubble.style.top = `${y + (Math.random() * 10 - 5)}px`;
				bubble.style.width = `${size.toFixed(1)}px`;
				bubble.style.height = `${size.toFixed(1)}px`;
				bubble.style.setProperty("--pw-b-dx", `${dx.toFixed(1)}px`);
				bubble.style.setProperty("--pw-b-dy", `${dy.toFixed(1)}px`);
				bubble.style.setProperty("--pw-b-dur", `${dur.toFixed(2)}s`);
				layer.appendChild(bubble);
				this.addParticle(bubble);
			}
			/** 产生破浪出水/翻滚飞溅微水花 */
			spawnSplash(x, y, count = 5) {
				if (typeof document === "undefined" || this.prefersReducedMotion()) return;
				const layer = getOrCreateParticleLayer();
				if (!layer) return;
				for (let i = 0; i < count; i++) {
					const drop = document.createElement("span");
					drop.className = "pw-splash-drop";
					const size = 3 + Math.random() * 3.5;
					const dx = Math.random() * 36 - 18;
					const dy = -(18 + Math.random() * 26);
					const dur = .5 + Math.random() * .25;
					drop.style.left = `${x + (Math.random() * 14 - 7)}px`;
					drop.style.top = `${y}px`;
					drop.style.width = `${size.toFixed(1)}px`;
					drop.style.height = `${size.toFixed(1)}px`;
					drop.style.setProperty("--pw-sp-dx", `${dx.toFixed(1)}px`);
					drop.style.setProperty("--pw-sp-dy", `${dy.toFixed(1)}px`);
					drop.style.setProperty("--pw-sp-dur", `${dur.toFixed(2)}s`);
					layer.appendChild(drop);
					this.addParticle(drop);
				}
			}
			/** 产生悬空拖拽水滴下坠 */
			spawnDrip(x, y) {
				if (typeof document === "undefined" || this.prefersReducedMotion()) return;
				const layer = getOrCreateParticleLayer();
				if (!layer) return;
				const drip = document.createElement("span");
				drip.className = "pw-drag-drip";
				drip.style.left = `${x + (Math.random() * 10 - 5)}px`;
				drip.style.top = `${y}px`;
				drip.style.width = "4px";
				drip.style.height = "6.5px";
				layer.appendChild(drip);
				this.addParticle(drip);
			}
			/** 产生庆祝彩色纸屑粒子 */
			spawnConfetti(x, y, count = 18) {
				if (typeof document === "undefined" || this.prefersReducedMotion()) return;
				const layer = getOrCreateParticleLayer();
				if (!layer) return;
				const colors = [
					"#4D6BFE",
					"#8FB5FF",
					"#3BC46D",
					"#FFD15C",
					"#F0A0A0",
					"#B388FF",
					"#FF9F43"
				];
				for (let i = 0; i < count; i++) {
					const el = document.createElement("span");
					el.className = "pw-confetti";
					const w = 4.5 + Math.random() * 4;
					const h = 6 + Math.random() * 5;
					const color = pick$1(colors);
					const dx = Math.random() * 100 - 50;
					const dy = -(40 + Math.random() * 50);
					const dur = .95 + Math.random() * .35;
					el.style.left = `${x + (Math.random() * 16 - 8)}px`;
					el.style.top = `${y + (Math.random() * 8 - 4)}px`;
					el.style.setProperty("--pw-cf-w", `${w.toFixed(1)}px`);
					el.style.setProperty("--pw-cf-h", `${h.toFixed(1)}px`);
					el.style.setProperty("--pw-cf-bg", color);
					el.style.setProperty("--pw-cf-dx", `${dx.toFixed(1)}px`);
					el.style.setProperty("--pw-cf-dy", `${(Math.abs(dy) + 90 + Math.random() * 40).toFixed(1)}px`);
					el.style.setProperty("--pw-cf-dur", `${dur.toFixed(2)}s`);
					layer.appendChild(el);
					this.addParticle(el);
				}
			}
			addParticle(el) {
				this.particles.push(el);
				el.addEventListener("animationend", () => {
					this.removeParticle(el);
				}, { once: true });
				if (this.particles.length > MAX_PARTICLES) this.particles.shift()?.remove();
			}
			removeParticle(el) {
				const idx = this.particles.indexOf(el);
				if (idx !== -1) this.particles.splice(idx, 1);
				el.remove();
			}
			clearParticles() {
				for (const p of this.particles) p.remove();
				this.particles = [];
			}
			/** 动画帧主循环 */
			step = (now) => {
				if (!this.isSwimming) return;
				if (this.ctx.isBusy()) {
					this.stop();
					this.scheduleNext(2e3);
					return;
				}
				const elapsed = now - this.startTime;
				const progress = Math.min(1, elapsed / this.duration);
				const u = progress < .5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
				const u1 = 1 - u;
				const rawX = u1 * u1 * u1 * this.startPos.x + 3 * u1 * u1 * u * this.cp1.x + 3 * u1 * u * u * this.cp2.x + u * u * u * this.targetPos.x;
				const rawY = u1 * u1 * u1 * this.startPos.y + 3 * u1 * u1 * u * this.cp1.y + 3 * u1 * u * u * this.cp2.y + u * u * u * this.targetPos.y;
				const { x: curX, y: curY } = this.ctx.clampPos(rawX, rawY);
				const dX = 3 * u1 * u1 * (this.cp1.x - this.startPos.x) + 6 * u1 * u * (this.cp2.x - this.cp1.x) + 3 * u * u * (this.targetPos.x - this.cp2.x);
				const dY = 3 * u1 * u1 * (this.cp1.y - this.startPos.y) + 6 * u1 * u * (this.cp2.y - this.cp1.y) + 3 * u * u * (this.targetPos.y - this.cp2.y);
				if (Math.abs(dX) > .8) {
					const nextFacing = dX > 0 ? "right" : "left";
					if (this.facing !== nextFacing) {
						this.facing = nextFacing;
						this.ctx.root.dataset.facing = this.facing;
					}
				}
				const normalizedVy = dY / (Math.hypot(dX, dY) || 1);
				const maxPitch = this.currentMode === "dive" ? 24 : 14;
				let pitchDeg = 0;
				if (this.facing === "right") pitchDeg = Math.max(-maxPitch, Math.min(maxPitch, normalizedVy * maxPitch));
				else pitchDeg = Math.max(-maxPitch, Math.min(maxPitch, -normalizedVy * maxPitch));
				const wiggle = Math.sin(progress * Math.PI * 6) * (1 - progress * .4) * 2.2;
				pitchDeg += wiggle;
				let scaleDepth = 1;
				let depthOpacity = 1;
				const isDive = this.currentMode === "dive";
				if (isDive) {
					const diveArc = Math.sin(progress * Math.PI);
					scaleDepth = 1 - diveArc * .12;
					depthOpacity = 1 - diveArc * .22;
					if (progress > .72 && progress < .85 && !this.hasSplashedThisSession) {
						this.hasSplashedThisSession = true;
						const sz = this.ctx.petSize();
						this.spawnSplash(curX + sz.w / 2, curY + sz.h * .6, 5);
						this.spawnWaterRipple(curX + sz.w / 2, curY + sz.h * .6, true);
					}
				}
				const scaleX = (this.facing === "left" ? 1 : -1) * scaleDepth;
				const scaleY = scaleDepth;
				this.ctx.root.style.left = `${curX}px`;
				this.ctx.root.style.top = `${curY}px`;
				this.ctx.pet.style.transform = `scale(${scaleX}, ${scaleY}) rotate(${pitchDeg.toFixed(2)}deg)`;
				this.ctx.pet.style.opacity = `${depthOpacity.toFixed(3)}`;
				const size = this.ctx.petSize();
				const tailX = curX + size.w * (this.facing === "left" ? 112 / 137 : 25 / 137);
				const tailY = curY + size.h * 52 / 101;
				const rippleGap = isDive ? 220 : 300;
				if (now - this.lastRippleTime > rippleGap && progress > .08 && progress < .92) {
					this.lastRippleTime = now;
					this.spawnWaterRipple(tailX, tailY, isDive);
				}
				const streamGap = isDive ? 140 : 200;
				if (now - this.lastStreamBubbleTime > streamGap && progress > .05 && progress < .95) {
					this.lastStreamBubbleTime = now;
					this.spawnStreamBubble(tailX, tailY, isDive);
				}
				if (now - this.lastBubbleTime > (isDive ? 260 : 500)) {
					this.lastBubbleTime = now;
					this.ctx.popBubble();
				}
				if (progress < 1) this.rafId = window.requestAnimationFrame(this.step);
				else {
					this.rafId = 0;
					this.isSwimming = false;
					this.ctx.root.classList.remove("swimming");
					this.ctx.pet.classList.remove("swimming", "swimming-dive");
					this.ctx.root.dataset.facing = this.facing;
					this.ctx.pet.style.opacity = "1";
					this.ctx.pet.style.transform = `scaleX(${this.facing === "left" ? 1 : -1}) rotate(0deg)`;
					this.ctx.savePos();
					this.scheduleNext();
				}
			};
			/** 完全清理 */
			dispose() {
				if (this.disposed) return;
				this.disposed = true;
				this.stop();
				if (typeof document !== "undefined") document.querySelector("[data-dsh-whale-particles]")?.remove();
			}
		};
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"sessions",
			"locale",
			"uiConversation",
			"uiSession"
		];
		const STATES = [
			"idle",
			"think",
			"working",
			"celebrate",
			"error",
			"wait",
			"disappointed"
		];
		const POS_KEY = "pet-whale:pos";
		/** 隐藏状态：'1' 表示隐藏到右下角小按钮 */
		const HIDDEN_KEY = "pet-whale:hidden";
		const PRETEND_KEY = "pet-whale:pretend";
		const THINK_TICKER_KEY = "pet-whale:think-ticker";
		const MINI_POS_KEY = "pet-whale:mini-pos";
		const AUTO_HIDE_KEY = "pet-whale:auto-hide";
		/** 完成提醒：页面在后台时闪标签页标题 */
		const NOTIFY_KEY = "pet-whale:notify";
		/** 系统通知：需要浏览器授权，默认关 */
		const SYS_NOTIFY_KEY = "pet-whale:sys-notify";
		/** 久坐提醒阈值（分钟），0 表示关 */
		const SEDENTARY_KEY = "pet-whale:sedentary";
		const SEDENTARY_CHOICES = [
			0,
			45,
			60,
			90
		];
		/** 久坐计时的心跳间隔 */
		const SEDENTARY_TICK_MS = 6e4;
		/**
		* 熟悉度门槛：分数越过就进下一档。
		* 分数 = 互动次数 + 完成回合×2 + 共处天数×4——三个维度都算，
		* 免得只靠猛戳一天就刷满，"处得久"本身也该有分量。
		*/
		const BOND_THRESHOLDS = [
			0,
			80,
			400
		];
		/** 形影不离档才有的主动搭话：检查间隔，与真正开口的概率 */
		const CHATTER_TICK_MS = 45e3;
		const CHATTER_CHANCE = .18;
		/**
		* 抓住左右猛甩：靠"方向反转"计数，不看速度。
		* 一条腿走够 SHAKE_MIN_LEG 才算一次真甩动，免得手抖被当成甩；
		* 反转要挤在 SHAKE_WINDOW_MS 里，慢慢来回挪不该把它晃晕。
		*/
		const SHAKE_MIN_LEG = 26;
		const SHAKE_REVERSALS = 4;
		const SHAKE_WINDOW_MS = 1100;
		const SHAKEN_MS = 1600;
		/** 晕完还要缓一会儿，不然一路甩下去会连环触发 */
		const SHAKE_COOLDOWN_MS = 1400;
		/** 翻肚皮动画时长，与 pw-bellyUp 对齐 */
		const BELLY_UP_MS = 2e3;
		/** 拖着不放又不动多久开始不耐烦 */
		const DRAG_IDLE_MS = 2e3;
		/** 判定"贴边"的容差：拖到离边这么近就算压上去了 */
		const EDGE_SLACK = 2;
		/** 离开页面超过这么久，视为已经休息过，久坐计时清零 */
		const SEDENTARY_AWAY_RESET_MS = 6e5;
		const AUTO_HIDE_CHECK_MS = 3e4;
		/** 智能避让：只有 idle 且光标在身侧停留这么久才让开 */
		const AVOID_DWELL_MS = 900;
		const AVOID_MARGIN = 48;
		const AVOID_STEP = 120;
		/** 抓取/右键后 8 秒内不再避让，保证“想抓就能抓住” */
		const AVOID_COOLDOWN_MS = 8e3;
		const SLEEP_MS = 2e4;
		const DIALOG_MS = 2600;
		/** 自动音效最小间隔（防 think/working 抖动连响） */
		const SOUND_GAP_MS = 1200;
		const pick = (list) => list[Math.floor(Math.random() * list.length)];
		/** 跟随所有会话：别的会话在跑 / 跑完 / 等确认也让鲸鱼知道，'0' 表示只看当前会话 */
		const FOLLOW_ALL_KEY = "pet-whale:follow-all";
		/** 同时在跑的会话（含当前）到这个数就算"加班" */
		const OVERTIME_AT = 4;
		/**
		* 当前会话。0.1.5 的会话列表直接给 current；0.1.7 起导航归视图所有（列表里没有 current 了），
		* 主视图用 mainView 这个来源持有它正在显示的会话，看 retainedBy 就知道是哪个。
		*/
		function currentSessionId(list) {
			if ("current" in list) return list.current;
			const rows = list.byId ?? {};
			for (const id of Object.keys(rows)) if ((rows[id]?.retainedBy?.mainView ?? 0) > 0) return id;
		}
		function apply(ctx) {
			if (typeof document === "undefined") return () => {};
			const owner = document;
			owner.__petWhaleDispose?.();
			let disposed = false;
			const timers = /* @__PURE__ */ new Set();
			const later = (fn, ms) => {
				if (disposed) return 0;
				const id = window.setTimeout(() => {
					timers.delete(id);
					if (!disposed) fn();
				}, ms);
				timers.add(id);
				return id;
			};
			const cancelLater = (id) => {
				window.clearTimeout(id);
				if (id !== void 0) timers.delete(id);
			};
			document.querySelectorAll("[data-dsh-whale-mini], [data-dsh-whale-particles]").forEach((el) => el.remove());
			document.querySelectorAll("[data-dsh-whale]").forEach((el) => el.remove());
			document.getElementById("pet-whale-style")?.remove();
			document.getElementById("pet-whale-pet-style")?.remove();
			const style = document.createElement("style");
			style.id = "pet-whale-style";
			style.textContent = BASE_CSS;
			document.head.appendChild(style);
			const petStyle = document.createElement("style");
			petStyle.id = "pet-whale-pet-style";
			document.head.appendChild(petStyle);
			const localeService = ctx.locale;
			let locale = localeService ? localeService.getLocale().active === "en" ? "en" : "zh" : detectBrowserLocale();
			let activePet = petOf(loadPetId());
			/** 宠物显示名：i18n 优先，缺了就用 PetModule 自带的名字 */
			const petDisplayName = (p) => petName(locale, p.id, locale === "en" ? p.name.en : p.name.zh);
			/** 当前语言的文案：基准是鲸鱼口吻，宠物可以用 text 覆盖它（见 pets/cat/text.ts） */
			let strings = getStrings(locale, activePet.text?.[locale]);
			const root = document.createElement("div");
			root.setAttribute("data-dsh-whale", "");
			root.dataset.pet = activePet.id;
			root.innerHTML = `
    <span class="dsh-whale-shadow"></span>
    <span class="dsh-whale-wake"></span>
    <div class="dsh-whale-dialog"></div>
    <span class="dsh-whale-snack">🐟</span>
    <span class="dsh-whale-zzz">Zzz...</span>
    <div class="pet-official idle" role="img" aria-label="${strings.aria.petName(petDisplayName(activePet))}">${activePet.html}</div>
    <span class="dsh-whale-badge" hidden></span>
    <div class="dsh-whale-menu" role="menu"></div>
  `;
			const dialog = root.querySelector(".dsh-whale-dialog");
			const badge = root.querySelector(".dsh-whale-badge");
			const snack = root.querySelector(".dsh-whale-snack");
			const pet = root.querySelector(".pet-official");
			const menu = root.querySelector(".dsh-whale-menu");
			/**
			* 追光瞳孔：唯一被 JS 直接引用的 SVG 部件。切换宠物会重建 innerHTML，
			* 所以按需现取而不是缓存元素引用（代价只是一次 querySelector）。
			*/
			const petPupil = () => pet.querySelector(activePet.pupilSelector ?? ".pupil-highlight");
			/**
			* 切换宠物：换内联 SVG + 换宠物私有样式表 + 同步容器尺寸变量。
			* 不碰状态 class，所以新宠物立刻按当前状态动起来，不需要重放状态机。
			*/
			const applyPet = (id) => {
				const next = petOf(id);
				activePet = next;
				savePetId(next.id);
				root.dataset.pet = next.id;
				if (next.size) {
					root.style.setProperty("--pw-pet-w", `${next.size.w}px`);
					root.style.setProperty("--pw-pet-h", `${next.size.h}px`);
				} else {
					root.style.removeProperty("--pw-pet-w");
					root.style.removeProperty("--pw-pet-h");
				}
				strings = getStrings(locale, next.text?.[locale]);
				pet.innerHTML = next.html;
				pet.setAttribute("aria-label", strings.aria.petName(petDisplayName(next)));
				petStyle.textContent = next.css;
			};
			applyPet(activePet.id);
			const SCALE_KEY = "pet-whale:scale";
			/** 四档，对应 i18n 的 sizeNames */
			const SCALE_CHOICES = [
				.8,
				1,
				1.3,
				1.6
			];
			const loadScale = () => {
				try {
					const raw = Number(localStorage.getItem(SCALE_KEY));
					if (SCALE_CHOICES.includes(raw)) return raw;
				} catch {}
				return 1;
			};
			let scale = loadScale();
			const applyScale = (next) => {
				scale = next;
				root.style.setProperty("--pw-scale", String(next));
				try {
					localStorage.setItem(SCALE_KEY, String(next));
				} catch {}
				place();
				savePos();
			};
			const scaleName = () => strings.panel.sizeNames[SCALE_CHOICES.indexOf(scale)];
			/** 一倍大小时的占位，实际尺寸要乘当前缩放 */
			const BASE_W = 137;
			const BASE_H = 101;
			const PET_W = () => BASE_W * scale;
			const PET_H = () => BASE_H * scale;
			const petSize = () => ({
				w: PET_W(),
				h: PET_H()
			});
			const clampPos = (x, y) => {
				const maxX = Math.max(0, window.innerWidth - PET_W());
				const maxY = Math.max(0, window.innerHeight - PET_H());
				return {
					x: Math.min(Math.max(0, x), maxX),
					y: Math.min(Math.max(0, y), maxY)
				};
			};
			const loadPos = () => {
				try {
					const raw = localStorage.getItem(POS_KEY);
					if (raw !== null) {
						const parsed = JSON.parse(raw);
						if (typeof parsed.x === "number" && typeof parsed.y === "number") return clampPos(parsed.x, parsed.y);
					}
				} catch {}
				return clampPos(window.innerWidth - PET_W() - 16, window.innerHeight - PET_H() - 96);
			};
			const place = () => {
				const { x, y } = clampPos(parseFloat(root.style.left) || 0, parseFloat(root.style.top) || 0);
				root.style.left = `${x}px`;
				root.style.top = `${y}px`;
				return {
					x,
					y
				};
			};
			const pos = loadPos();
			root.style.left = `${pos.x}px`;
			root.style.top = `${pos.y}px`;
			document.body.appendChild(root);
			applyPalette(root, paletteOf(loadPaletteId()));
			root.style.setProperty("--pw-scale", String(scale));
			const readTheme = () => {
				const scheme = document.documentElement.style.colorScheme;
				if (scheme === "dark" || scheme === "light") return scheme;
				return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			};
			const applyTheme = () => {
				root.dataset.theme = readTheme();
			};
			const themeObserver = new MutationObserver(applyTheme);
			themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["style"]
			});
			applyTheme();
			const savePos = () => {
				try {
					localStorage.setItem(POS_KEY, JSON.stringify(place()));
				} catch {}
			};
			const onResize = () => {
				cancelAvoid();
				swimmer.stop();
				place();
				if (mini !== null) {
					const p = miniClamp(parseFloat(mini.style.right) || 0, parseFloat(mini.style.bottom) || 0);
					mini.style.right = `${p.right}px`;
					mini.style.bottom = `${p.bottom}px`;
				}
				if (ticker.classList.contains("show")) positionTicker();
				if (visualState === "idle") swimmer.scheduleNext();
			};
			let dialogTimer;
			const showDialog = (text) => {
				if (disposed || root.classList.contains("hidden")) return;
				dialog.textContent = text;
				dialog.classList.add("show");
				cancelLater(dialogTimer);
				dialogTimer = later(() => dialog.classList.remove("show"), DIALOG_MS);
			};
			const sounds = new WhaleSounds();
			sounds.installGestureUnlock();
			let lastAutoSound = 0;
			const autoSound = (state) => {
				if (root.classList.contains("hidden") || document.hidden) return;
				const now = performance.now();
				if (now - lastAutoSound < SOUND_GAP_MS) return;
				lastAutoSound = now;
				if (state === "think") sounds.play("bubble");
				else if (state === "working") sounds.play("work");
				else if (state === "celebrate") sounds.play("celebrate");
				else if (state === "error") sounds.play("error");
			};
			let visualState = "idle";
			let pretendOn = false;
			try {
				pretendOn = localStorage.getItem(PRETEND_KEY) === "1";
			} catch {}
			let tickerOn = true;
			try {
				tickerOn = localStorage.getItem(THINK_TICKER_KEY) !== "0";
			} catch {}
			let lastErrorText = "";
			const popBubble = () => {
				const bubbles = pet.querySelectorAll(".bubble");
				if (bubbles.length === 0) return;
				const b = bubbles[Math.floor(Math.random() * bubbles.length)];
				b.classList.remove("show");
				b.offsetWidth;
				b.classList.add("show");
				expireClass(b, "show", 950);
			};
			const swimmer = new WhaleSwimmer({
				root,
				pet,
				clampPos,
				savePos,
				popBubble,
				showDialog,
				getStrings: () => strings,
				petSize,
				isBusy: () => root.classList.contains(HIDDEN_CLASS) || dragStart !== null || pet.classList.contains("petting") || pet.classList.contains("belly-up") || document.hidden || menu.classList.contains("open") || sleeping || Date.now() < microSwimUntil || visualState !== "idle"
			});
			const STATS_KEY = "pet-whale:stats";
			const loadStats = () => {
				try {
					const raw = localStorage.getItem(STATS_KEY);
					if (raw !== null) {
						const parsed = JSON.parse(raw);
						return {
							completedRounds: typeof parsed.completedRounds === "number" ? parsed.completedRounds : 0,
							errorCount: typeof parsed.errorCount === "number" ? parsed.errorCount : 0,
							interactionCount: typeof parsed.interactionCount === "number" ? parsed.interactionCount : 0,
							firstDate: typeof parsed.firstDate === "string" ? parsed.firstDate : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
							bondTier: typeof parsed.bondTier === "number" ? parsed.bondTier : 0
						};
					}
				} catch {}
				const init = {
					completedRounds: 0,
					errorCount: 0,
					interactionCount: 0,
					firstDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
					bondTier: 0
				};
				try {
					localStorage.setItem(STATS_KEY, JSON.stringify(init));
				} catch {}
				return init;
			};
			const saveStats = (s) => {
				try {
					localStorage.setItem(STATS_KEY, JSON.stringify(s));
				} catch {}
			};
			const recordCelebrate = () => {
				const s = loadStats();
				s.completedRounds++;
				saveStats(s);
				checkBondUp();
			};
			const recordError = () => {
				const s = loadStats();
				s.errorCount++;
				saveStats(s);
			};
			const recordInteraction = () => {
				const s = loadStats();
				s.interactionCount++;
				saveStats(s);
				checkBondUp();
			};
			const calcDays = (s) => {
				try {
					const start = new Date(s.firstDate).getTime();
					const now = Date.now();
					if (Number.isNaN(start)) return 1;
					return Math.max(1, Math.floor((now - start) / 864e5) + 1);
				} catch {
					return 1;
				}
			};
			const bondScore = (s) => s.interactionCount + s.completedRounds * 2 + calcDays(s) * 4;
			const bondTierOf = (score) => {
				let tier = 0;
				for (let i = 0; i < BOND_THRESHOLDS.length; i++) if (score >= BOND_THRESHOLDS[i]) tier = i;
				return tier;
			};
			/** 距下一档的百分比；已经满档返回 -1 */
			const bondProgress = (score, tier) => {
				if (tier >= BOND_THRESHOLDS.length - 1) return -1;
				const from = BOND_THRESHOLDS[tier];
				const to = BOND_THRESHOLDS[tier + 1];
				return Math.max(0, Math.min(99, Math.round((score - from) / (to - from) * 100)));
			};
			const currentTier = () => bondTierOf(bondScore(loadStats()));
			/**
			* 升档播报。写回存储放在弹话之前——弹话没弹出来也不该让同一档反复恭喜。
			* 分数只增不减，所以这里不必处理回落。
			*/
			const checkBondUp = () => {
				const st = loadStats();
				const tier = bondTierOf(bondScore(st));
				if (tier <= st.bondTier) return;
				st.bondTier = tier;
				saveStats(st);
				later(() => showDialog(strings.bond.levelUp[tier]), 1500);
			};
			let stateInitialized = false;
			const setState = (next, changed) => {
				const effective = pretendOn ? "working" : next;
				if (effective !== "idle" && sulking) clearSulk();
				if (effective !== "idle") wake();
				for (const s of STATES) pet.classList.toggle(s, s === effective);
				if (effective === "error" && visualState !== "error") {
					endPat();
					clearReaction();
				}
				visualState = effective;
				syncMiniState(effective);
				if (changed || !stateInitialized) {
					swimmer.onStateChange(effective);
					if (effective === "idle") scheduleIdleMicro();
					else {
						clearIdleMicro();
						clearMicroAction();
					}
					stateInitialized = true;
				}
				if (changed) {
					showDialog(pick(strings.status[effective]));
					autoSound(effective);
					if (effective === "celebrate") {
						recordCelebrate();
						notifyDone();
						const curX = parseFloat(root.style.left) || 0;
						const curY = parseFloat(root.style.top) || 0;
						swimmer.spawnConfetti(curX + PET_W() / 2, curY + PET_H() * .35, 24);
					} else if (effective === "error") recordError();
				}
			};
			const reactionClasses = [
				"squish",
				"rolling",
				"dizzy",
				"joy",
				"annoyed",
				"shaken",
				"belly-up",
				"welcome"
			];
			const classTimers = /* @__PURE__ */ new Map();
			const expireClass = (el, name, ms) => {
				const key = el === pet ? name : `${name}:${Array.from(pet.querySelectorAll(".bubble")).indexOf(el)}`;
				cancelLater(classTimers.get(key));
				classTimers.set(key, later(() => {
					classTimers.delete(key);
					el.classList.remove(name);
				}, ms));
			};
			const clearReaction = () => {
				for (const name of reactionClasses) {
					cancelLater(classTimers.get(name));
					classTimers.delete(name);
					pet.classList.remove(name);
				}
			};
			const triggerSquish = () => {
				markActive();
				recordInteraction();
				popBubble();
				sounds.play("bubble");
				clearReaction();
				pet.classList.remove("squish", "dizzy", "joy");
				pet.offsetWidth;
				pet.classList.add("squish");
				expireClass(pet, "squish", 450);
				showDialog(pick(strings.bond.poke[currentTier()]));
			};
			const triggerRoll = () => {
				markActive();
				recordInteraction();
				sounds.play("trick");
				showDialog(strings.feedback.roll);
				clearReaction();
				pet.classList.remove("rolling", "dizzy", "joy");
				pet.offsetWidth;
				pet.classList.add("rolling", "spouting");
				const curX = parseFloat(root.style.left) || 0;
				const curY = parseFloat(root.style.top) || 0;
				swimmer.spawnSplash(curX + PET_W() / 2, curY + PET_H() * .64, 6);
				swimmer.spawnWaterRipple(curX + PET_W() / 2, curY + PET_H() * .64, false);
				popBubble();
				later(() => popBubble(), 200);
				expireClass(pet, "rolling", 1100);
				expireClass(pet, "spouting", 1100);
			};
			const triggerJoy = () => {
				if (root.classList.contains(HIDDEN_CLASS)) return;
				markActive();
				recordInteraction();
				clearReaction();
				pet.classList.remove("joy", "squish", "dizzy");
				pet.offsetWidth;
				pet.classList.add("joy");
				sounds.play("celebrate");
				showDialog(pick(strings.feedback.joy));
				popBubble();
				expireClass(pet, "joy", 1100);
			};
			const triggerDizzy = () => {
				markActive();
				recordInteraction();
				clearReaction();
				pet.classList.remove("dizzy", "squish", "joy");
				pet.offsetWidth;
				pet.classList.add("dizzy");
				sounds.play("bubble");
				showDialog(pick(strings.feedback.pokeDizzy));
				expireClass(pet, "dizzy", 900);
			};
			const POKE_ANNOYED_AT = 3;
			const POKE_SULK_AT = 6;
			/** 停手这么久，连戳计数清零 */
			const POKE_DECAY_MS = 2600;
			/** 闹脾气持续时长，期间再戳只会更闹 */
			const SULK_MS = 4200;
			let pokeStreak = 0;
			let pokeDecayTimer = 0;
			let sulking = false;
			let sulkTimer = 0;
			const clearSulk = () => {
				if (sulkTimer !== 0) {
					cancelLater(sulkTimer);
					sulkTimer = 0;
				}
				sulking = false;
				pet.classList.remove("sulking");
			};
			const bumpPokeStreak = () => {
				pokeStreak += 1;
				if (pokeDecayTimer !== 0) cancelLater(pokeDecayTimer);
				pokeDecayTimer = later(() => {
					pokeDecayTimer = 0;
					pokeStreak = 0;
				}, POKE_DECAY_MS);
			};
			const triggerAnnoyed = () => {
				markActive();
				recordInteraction();
				clearReaction();
				pet.classList.remove("annoyed", "squish", "dizzy", "joy");
				pet.offsetWidth;
				pet.classList.add("annoyed");
				sounds.play("bubble");
				showDialog(pick(strings.feedback.pokeAnnoyed));
				expireClass(pet, "annoyed", 520);
			};
			const triggerSulk = () => {
				markActive();
				recordInteraction();
				clearSulk();
				sulking = true;
				clearReaction();
				pet.classList.remove("annoyed", "squish", "dizzy", "joy", "rolling");
				pet.offsetWidth;
				pet.classList.add("sulking");
				sounds.play("bubble");
				showDialog(pick(strings.feedback.pokeSulk));
				sulkTimer = later(() => {
					sulkTimer = 0;
					clearSulk();
					pokeStreak = 0;
				}, SULK_MS);
			};
			/** 失落时被戳：当作安慰，提前结束自愈 */
			const triggerComfort = () => {
				markActive();
				recordInteraction();
				clearSulk();
				pokeStreak = 0;
				clearReaction();
				pet.classList.remove("joy", "squish", "dizzy", "annoyed");
				pet.offsetWidth;
				pet.classList.add("joy");
				sounds.play("celebrate");
				showDialog(pick(strings.feedback.comfort));
				popBubble();
				expireClass(pet, "joy", 1100);
			};
			let notifyOn = true;
			let sysNotifyOn = false;
			try {
				notifyOn = localStorage.getItem(NOTIFY_KEY) !== "0";
				sysNotifyOn = localStorage.getItem(SYS_NOTIFY_KEY) === "1";
			} catch {}
			const hasNotificationApi = typeof window !== "undefined" && "Notification" in window;
			let permissionRequest = 0;
			const notifications = /* @__PURE__ */ new Set();
			/** 我们改写标题前的原值；null 表示当前没在闪 */
			let titleBeforeFlash = null;
			let flashedTitle = "";
			const restoreTitle = () => {
				if (titleBeforeFlash === null) return;
				if (document.title === flashedTitle) document.title = titleBeforeFlash;
				titleBeforeFlash = null;
				flashedTitle = "";
			};
			const flashTitle = () => {
				if (titleBeforeFlash !== null) return;
				titleBeforeFlash = document.title;
				flashedTitle = `✅ ${strings.notify.titleDone} · ${titleBeforeFlash}`;
				document.title = flashedTitle;
			};
			const sendSystemNotification = () => {
				if (!sysNotifyOn || !hasNotificationApi) return;
				if (Notification.permission !== "granted") return;
				try {
					const n = new Notification(`${activePet.icon} ${strings.notify.titleDone}`, { body: strings.notify.bodyDone });
					notifications.add(n);
					later(() => {
						notifications.delete(n);
						n.close();
					}, 6e3);
				} catch {}
			};
			/** 回合完成时调用：只在页面不可见时才提醒 */
			const notifyDone = () => {
				if (!document.hidden) return;
				if (notifyOn) flashTitle();
				sendSystemNotification();
			};
			let sedentaryMin = 0;
			try {
				const raw = Number(localStorage.getItem(SEDENTARY_KEY));
				if (SEDENTARY_CHOICES.includes(raw)) sedentaryMin = raw;
			} catch {}
			let sittingMs = 0;
			let hiddenSince = 0;
			let sedentaryTimer = 0;
			const nudgeRest = () => {
				if (root.classList.contains(HIDDEN_CLASS)) return;
				pet.classList.remove("welcome");
				pet.offsetWidth;
				pet.classList.add("welcome", "spouting");
				showDialog(pick(strings.feedback.restNudge));
				sounds.play("bubble");
				expireClass(pet, "welcome", 1400);
				expireClass(pet, "spouting", 1400);
			};
			const sedentaryTick = () => {
				if (sedentaryMin === 0) return;
				if (document.hidden) return;
				sittingMs += SEDENTARY_TICK_MS;
				if (sittingMs >= sedentaryMin * 6e4) {
					sittingMs = 0;
					nudgeRest();
				}
			};
			const startSedentary = () => {
				if (sedentaryTimer !== 0) window.clearInterval(sedentaryTimer);
				sedentaryTimer = 0;
				sittingMs = 0;
				if (sedentaryMin === 0) return;
				sedentaryTimer = window.setInterval(sedentaryTick, SEDENTARY_TICK_MS);
			};
			startSedentary();
			const triggerWelcome = () => {
				if (root.classList.contains(HIDDEN_CLASS) || visualState !== "idle") return;
				clearReaction();
				pet.classList.remove("welcome");
				pet.offsetWidth;
				pet.classList.add("welcome");
				showDialog(strings.bond.welcome[currentTier()]);
				sounds.play("bubble");
				expireClass(pet, "welcome", 1200);
			};
			const HIDDEN_CLASS = "hidden";
			const MINI_SIZE = 46;
			let mini = null;
			let quitWhale = () => {};
			const syncMiniState = (state) => {
				if (mini === null) return;
				mini.dataset.state = state;
				mini.title = `${strings.aria.miniTitle(state)}`;
				mini.textContent = activePet.icon;
				mini.setAttribute("aria-label", strings.aria.mini);
			};
			const miniClamp = (right, bottom) => {
				const maxRight = Math.max(0, window.innerWidth - MINI_SIZE);
				const maxBottom = Math.max(0, window.innerHeight - MINI_SIZE);
				return {
					right: Math.min(Math.max(0, right), maxRight),
					bottom: Math.min(Math.max(0, bottom), maxBottom)
				};
			};
			const loadMiniPos = () => {
				try {
					const raw = localStorage.getItem(MINI_POS_KEY);
					if (raw !== null) {
						const parsed = JSON.parse(raw);
						if (typeof parsed.right === "number" && typeof parsed.bottom === "number") return miniClamp(parsed.right, parsed.bottom);
					}
				} catch {}
				return {
					right: 14,
					bottom: 14
				};
			};
			const saveMiniPos = () => {
				if (mini === null) return;
				try {
					localStorage.setItem(MINI_POS_KEY, JSON.stringify({
						right: parseFloat(mini.style.right) || 0,
						bottom: parseFloat(mini.style.bottom) || 0
					}));
				} catch {}
			};
			let miniDrag = null;
			let miniDragging = false;
			let miniSuppressClick = false;
			const onMiniPointerDown = (e) => {
				if (disposed || e.button !== 0 || e.isPrimary === false || mini === null || miniDrag !== null) return;
				miniSuppressClick = false;
				miniDrag = {
					pointerId: e.pointerId,
					x: e.clientX,
					y: e.clientY,
					right: parseFloat(mini.style.right) || 0,
					bottom: parseFloat(mini.style.bottom) || 0
				};
				try {
					mini.setPointerCapture(e.pointerId);
				} catch {}
			};
			const onMiniPointerMove = (e) => {
				if (miniDrag === null || mini === null || e.pointerId !== miniDrag.pointerId) return;
				const dx = e.clientX - miniDrag.x;
				const dy = e.clientY - miniDrag.y;
				if (!miniDragging && Math.abs(dx) + Math.abs(dy) > 4) {
					miniDragging = true;
					miniSuppressClick = true;
					mini.classList.add("dragging");
				}
				if (miniDragging) {
					const p = miniClamp(miniDrag.right - dx, miniDrag.bottom - dy);
					mini.style.right = `${p.right}px`;
					mini.style.bottom = `${p.bottom}px`;
				}
			};
			const onMiniDragEnd = (e) => {
				if (miniDrag === null || e && e.pointerId !== miniDrag.pointerId) return;
				const id = miniDrag.pointerId;
				miniDrag = null;
				try {
					mini?.releasePointerCapture(id);
				} catch {}
				if (miniDragging) {
					miniDragging = false;
					mini?.classList.remove("dragging");
					saveMiniPos();
				}
			};
			const removeMini = () => {
				onMiniDragEnd();
				mini?.remove();
				mini = null;
			};
			const createMini = () => {
				if (mini !== null) return;
				mini = document.createElement("button");
				mini.type = "button";
				mini.setAttribute("data-dsh-whale-mini", "");
				mini.setAttribute("aria-label", strings.aria.mini);
				mini.textContent = activePet.icon;
				const pos = loadMiniPos();
				mini.style.right = `${pos.right}px`;
				mini.style.bottom = `${pos.bottom}px`;
				syncMiniState(visualState);
				mini.addEventListener("click", () => {
					if (miniSuppressClick) return;
					showWhale();
				});
				mini.addEventListener("pointerdown", onMiniPointerDown);
				mini.addEventListener("lostpointercapture", onMiniDragEnd);
				document.body.appendChild(mini);
			};
			const showWhale = () => {
				removeMini();
				root.classList.remove(HIDDEN_CLASS);
				try {
					localStorage.removeItem(HIDDEN_KEY);
				} catch {}
				place();
				triggerSquish();
				showDialog(strings.feedback.shown);
				swimmer.scheduleNext(1500);
				onSnapshot();
				if (!badge.hidden) startFollow();
			};
			const hideWhale = () => {
				endDrag();
				endPat();
				hideTicker();
				clearIdleMicro();
				cancelAvoid();
				swimmer.stop();
				root.classList.add(HIDDEN_CLASS);
				if (followRaf !== 0) window.cancelAnimationFrame(followRaf);
				followRaf = 0;
				try {
					localStorage.setItem(HIDDEN_KEY, "1");
				} catch {}
				createMini();
			};
			const readAutoHide = () => {
				try {
					const raw = localStorage.getItem(AUTO_HIDE_KEY);
					if (raw === null) return null;
					const parsed = JSON.parse(raw);
					if (typeof parsed.at === "number" && typeof parsed.daily === "boolean") return parsed;
				} catch {}
				return null;
			};
			const saveAutoHide = (plan) => {
				try {
					localStorage.setItem(AUTO_HIDE_KEY, JSON.stringify(plan));
				} catch {}
			};
			const clearAutoHide = () => {
				try {
					localStorage.removeItem(AUTO_HIDE_KEY);
				} catch {}
			};
			const nextDailyAt = (hh, mm) => {
				const d = /* @__PURE__ */ new Date();
				d.setHours(hh, mm, 0, 0);
				if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
				return d.getTime();
			};
			const scheduleOnce = (ms) => {
				saveAutoHide({
					at: Date.now() + ms,
					daily: false,
					hh: 0,
					mm: 0
				});
			};
			const scheduleDaily = (hh, mm) => {
				saveAutoHide({
					at: nextDailyAt(hh, mm),
					daily: true,
					hh,
					mm
				});
			};
			const checkAutoHide = () => {
				const plan = readAutoHide();
				if (plan === null) return;
				if (Date.now() < plan.at) return;
				if (plan.daily) scheduleDaily(plan.hh, plan.mm);
				else clearAutoHide();
				if (!root.classList.contains(HIDDEN_CLASS)) hideWhale();
			};
			let autoHideTimer;
			const startAutoHide = () => {
				checkAutoHide();
				autoHideTimer = window.setInterval(checkAutoHide, AUTO_HIDE_CHECK_MS);
			};
			const THINK_TICKER_WIDTH = 360;
			const ticker = document.createElement("div");
			ticker.setAttribute("data-dsh-whale-think", "");
			ticker.innerHTML = "<span class=\"dsh-whale-think-label\">🧠</span><div class=\"dsh-whale-think-scroll\"><span class=\"dsh-whale-think-text\"></span></div>";
			root.appendChild(ticker);
			const tickerText = ticker.querySelector(".dsh-whale-think-text");
			let tickerOffset = 0;
			let tickerRaf = 0;
			const hideTicker = () => {
				ticker.classList.remove("show");
				if (tickerRaf !== 0) {
					window.cancelAnimationFrame(tickerRaf);
					tickerRaf = 0;
				}
			};
			const tickerTick = () => {
				if (document.hidden || root.classList.contains("hidden")) {
					hideTicker();
					return;
				}
				positionTicker();
				const max = Math.max(0, tickerText.scrollWidth - ticker.querySelector(".dsh-whale-think-scroll").clientWidth);
				tickerOffset += .5;
				if (tickerOffset > max + 40) tickerOffset = 0;
				tickerText.style.transform = `translateX(-${tickerOffset}px)`;
				if (ticker.classList.contains("show")) tickerRaf = window.requestAnimationFrame(tickerTick);
				else tickerRaf = 0;
			};
			const positionTicker = () => {
				const rect = root.getBoundingClientRect();
				const width = Math.min(THINK_TICKER_WIDTH, window.innerWidth - 24);
				const centerX = rect.left + rect.width / 2;
				const left = Math.min(Math.max(centerX, width / 2 + 12), window.innerWidth - width / 2 - 12);
				ticker.style.width = `${width}px`;
				ticker.style.left = `${left}px`;
				ticker.style.top = `${rect.top - 40}px`;
			};
			const updateTicker = (text) => {
				if (text.trim() === "" || pretendOn || document.hidden || root.classList.contains("hidden")) {
					hideTicker();
					return;
				}
				const nextText = text.slice(-200);
				if (tickerText.textContent !== nextText) tickerOffset = 0;
				tickerText.textContent = nextText;
				positionTicker();
				ticker.classList.add("show");
				if (!reduceMotion && tickerRaf === 0) tickerRaf = window.requestAnimationFrame(tickerTick);
			};
			const partialTextOf = (partial) => {
				if (partial === null || typeof partial !== "object") return "";
				const blocks = partial.blocks;
				if (!Array.isArray(blocks)) return "";
				const parts = [];
				for (const block of blocks) {
					if (block === null || typeof block !== "object") continue;
					const b = block;
					if ((b.kind === "text" || b.kind === "reasoning") && typeof b.text === "string") parts.push(b.text);
				}
				return parts.join(" ");
			};
			const partialHasToolCall = (partial) => {
				if (partial === null || typeof partial !== "object") return false;
				const blocks = partial.blocks;
				if (!Array.isArray(blocks)) return false;
				for (const block of blocks) if (block !== null && typeof block === "object" && block.kind === "tool-call") return true;
				return false;
			};
			const onVisibility = () => {
				document.hidden;
				root.classList.toggle("paused", document.hidden);
				mini?.classList.toggle("paused", document.hidden);
				if (document.hidden) {
					hiddenSince = Date.now();
					endDrag();
					onMiniDragEnd();
					endPat();
					hideTicker();
					swimmer.stop();
				} else {
					restoreTitle();
					if (hiddenSince !== 0 && Date.now() - hiddenSince >= SEDENTARY_AWAY_RESET_MS) sittingMs = 0;
					hiddenSince = 0;
					onSnapshot();
					if (visualState === "idle") swimmer.scheduleNext(2e3);
				}
			};
			document.addEventListener("visibilitychange", onVisibility);
			const petBody = pet.querySelector(".body");
			const reduceMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			let followRaf = 0;
			let baseX = NaN;
			let baseY = NaN;
			const FOLLOW_MAX = 18;
			const clampFollow = (v) => Math.max(-18, Math.min(FOLLOW_MAX, v));
			const followBody = () => {
				followRaf = 0;
				if (badge.hidden || document.hidden || root.classList.contains("hidden") || petBody === null) return;
				const b = petBody.getBoundingClientRect();
				const r = root.getBoundingClientRect();
				const x = b.left + b.width / 2 - r.left;
				const y = b.top + b.height / 2 - r.top;
				if (Number.isNaN(baseX)) {
					baseX = x;
					baseY = y;
				}
				baseX += (x - baseX) * .008;
				baseY += (y - baseY) * .008;
				badge.style.translate = `${clampFollow(x - baseX).toFixed(1)}px ${clampFollow(y - baseY).toFixed(1)}px`;
				followRaf = window.requestAnimationFrame(followBody);
			};
			const startFollow = () => {
				if (reduceMotion || followRaf !== 0) return;
				followRaf = window.requestAnimationFrame(followBody);
			};
			const onFollowVisibility = () => {
				if (!document.hidden && !badge.hidden) startFollow();
			};
			document.addEventListener("visibilitychange", onFollowVisibility);
			let menuMode = "main";
			const appendMenuBtn = (label, onClick, cls = "") => {
				const btn = document.createElement("button");
				btn.type = "button";
				if (cls) btn.className = cls;
				btn.textContent = label;
				btn.addEventListener("click", onClick);
				menu.appendChild(btn);
				return btn;
			};
			/** 切换开关后原地重画菜单：菜单不关、位置不动 */
			const reopenMenu = (mode) => {
				buildMenu(mode);
				menu.classList.add("open");
				positionMenu(lastMenuPos.x, lastMenuPos.y);
			};
			const buildMenu = (mode = "main") => {
				menuMode = mode;
				menu.textContent = "";
				const openMore = () => {
					buildMenu("more");
					menu.classList.add("open");
					positionMenu(lastMenuPos.x, lastMenuPos.y);
				};
				const openAppearance = () => {
					buildMenu("appearance");
					menu.classList.add("open");
					positionMenu(lastMenuPos.x, lastMenuPos.y);
				};
				const openBehavior = () => {
					buildMenu("behavior");
					menu.classList.add("open");
					positionMenu(lastMenuPos.x, lastMenuPos.y);
				};
				const openStats = () => {
					buildMenu("stats");
					menu.classList.add("open");
					positionMenu(lastMenuPos.x, lastMenuPos.y);
				};
				const openRest = () => {
					buildMenu("rest");
					menu.classList.add("open");
					positionMenu(lastMenuPos.x, lastMenuPos.y);
				};
				const backMain = () => {
					buildMenu("main");
					menu.classList.add("open");
					positionMenu(lastMenuPos.x, lastMenuPos.y);
				};
				const backMore = () => {
					buildMenu("more");
					menu.classList.add("open");
					positionMenu(lastMenuPos.x, lastMenuPos.y);
				};
				if (mode === "main") {
					const items = [
						[strings.menu.feed, () => {
							snack.classList.remove("drop");
							snack.offsetWidth;
							snack.classList.add("drop");
							sounds.play("snack");
							showDialog(strings.feedback.feed);
							later(() => {
								triggerJoy();
							}, 600);
						}],
						[strings.menu.headpat, () => {
							triggerPat();
						}],
						[`${strings.panel.pretend}${pretendOn ? " ✓" : ""}`, () => {
							pretendOn = !pretendOn;
							try {
								localStorage.setItem(PRETEND_KEY, pretendOn ? "1" : "0");
							} catch {}
							updateTicker("");
							stateInitialized = false;
							onSnapshot();
							showDialog(pretendOn ? strings.feedback.pretendOn : strings.feedback.pretendOff);
						}],
						[sounds.isMuted ? strings.menu.soundOff : strings.menu.soundOn, () => {
							const next = !sounds.isMuted;
							sounds.setMuted(next);
							buildMenu("main");
							menu.classList.add("open");
							positionMenu(lastMenuPos.x, lastMenuPos.y);
							if (next) sounds.play("bubble");
						}],
						[strings.menu.hide, () => {
							hideWhale();
						}],
						...lastErrorText !== "" ? [[strings.menu.copyError, () => {
							copyError();
						}]] : [],
						[strings.menu.more, openMore]
					];
					for (const [label, action] of items) appendMenuBtn(label, () => {
						closeMenu();
						action();
					});
					return;
				}
				if (mode === "more") {
					appendMenuBtn(`🎨 ${strings.panel.appearance} ▸`, openAppearance);
					appendMenuBtn(`🧠 ${strings.panel.behavior} ▸`, openBehavior);
					appendMenuBtn(`📊 ${strings.panel.stats} ▸`, openStats);
					appendMenuBtn(`🕐 ${strings.panel.rest} ▸`, openRest);
					appendMenuBtn(strings.panel.back, backMain, "pw-back");
					return;
				}
				if (mode === "stats") {
					const stats = loadStats();
					const days = calcDays(stats);
					const items = [
						strings.panel.statsCompleted(stats.completedRounds),
						strings.panel.statsInteractions(stats.interactionCount),
						strings.panel.statsErrors(stats.errorCount),
						strings.panel.statsDays(days),
						strings.panel.statsBond(strings.bond.tierName[bondTierOf(bondScore(stats))], bondProgress(bondScore(stats), bondTierOf(bondScore(stats))))
					];
					for (const it of items) {
						const itEl = document.createElement("div");
						itEl.className = "pw-stats-item";
						itEl.textContent = it;
						menu.appendChild(itEl);
					}
					appendMenuBtn(strings.panel.back, backMore, "pw-back");
					return;
				}
				if (mode === "appearance") {
					const petTitle = document.createElement("div");
					petTitle.className = "pw-panel-section-title";
					petTitle.textContent = strings.panel.pet;
					menu.appendChild(petTitle);
					for (const p of PETS) {
						const name = petDisplayName(p);
						const petBtn = document.createElement("button");
						petBtn.type = "button";
						petBtn.className = "pw-palette-btn";
						petBtn.appendChild(document.createTextNode(`${p.icon} ${name}${p.id === activePet.id ? " ✅" : ""}`));
						petBtn.addEventListener("click", () => {
							closeMenu();
							if (p.id === activePet.id) return;
							applyPet(p.id);
							syncMiniState(visualState);
							showDialog(strings.feedback.petApplied(name));
							sounds.play("bubble");
						});
						menu.appendChild(petBtn);
					}
					const colorTitle = document.createElement("div");
					colorTitle.className = "pw-panel-section-title";
					colorTitle.textContent = strings.panel.colors;
					menu.appendChild(colorTitle);
					for (const p of PALETTES) {
						const btn = document.createElement("button");
						btn.type = "button";
						btn.className = "pw-palette-btn";
						const dot = document.createElement("span");
						dot.className = "pw-swatch";
						dot.style.background = `linear-gradient(135deg, ${p.light}, ${p.main}, ${p.dark})`;
						btn.appendChild(dot);
						btn.appendChild(document.createTextNode(paletteName(locale, p.id, p.name)));
						btn.addEventListener("click", () => {
							closeMenu();
							applyPalette(root, p);
							savePaletteId(p.id);
							showDialog(strings.feedback.paletteApplied(paletteName(locale, p.id, p.name)));
							sounds.play("bubble");
						});
						menu.appendChild(btn);
					}
					appendMenuBtn(strings.panel.size(scaleName()), () => {
						const i = SCALE_CHOICES.indexOf(scale);
						applyScale(SCALE_CHOICES[(i + 1) % SCALE_CHOICES.length]);
						reopenMenu("appearance");
						showDialog(strings.feedback.sizeSet(scaleName()));
						sounds.play("bubble");
					});
					appendMenuBtn(strings.panel.back, backMore, "pw-back");
					return;
				}
				if (mode === "behavior") {
					appendMenuBtn(`${strings.panel.thinkTicker}${tickerOn ? " ✓" : ""}`, () => {
						tickerOn = !tickerOn;
						try {
							localStorage.setItem(THINK_TICKER_KEY, tickerOn ? "1" : "0");
						} catch {}
						updateTicker("");
						showDialog(tickerOn ? strings.feedback.tickerOn : strings.feedback.tickerOff);
						buildMenu("behavior");
						menu.classList.add("open");
						positionMenu(lastMenuPos.x, lastMenuPos.y);
					});
					appendMenuBtn(`${strings.panel.swim}${swimmer.isEnabled ? " ✓" : ""}`, () => {
						const next = swimmer.toggle();
						showDialog(next ? strings.feedback.swimOn : strings.feedback.swimOff);
						buildMenu("behavior");
						menu.classList.add("open");
						positionMenu(lastMenuPos.x, lastMenuPos.y);
					});
					appendMenuBtn(strings.panel.volume(sounds.isMuted ? strings.panel.volumeOff : strings.panel.volumeNames[VOLUME_LEVELS.indexOf(sounds.volume)]), () => {
						if (sounds.isMuted) {
							sounds.setMuted(false);
							sounds.setVolume("low");
						} else if (sounds.volume === "high") sounds.setMuted(true);
						else sounds.setVolume(VOLUME_LEVELS[VOLUME_LEVELS.indexOf(sounds.volume) + 1]);
						reopenMenu("behavior");
						sounds.play("bubble");
					});
					if (statusSource !== void 0) appendMenuBtn(`${strings.panel.followAll}${followAll ? " ✓" : " ✕"}`, () => {
						followAll = !followAll;
						try {
							localStorage.setItem(FOLLOW_ALL_KEY, followAll ? "1" : "0");
						} catch {}
						updateBadge();
						onSnapshot();
						showDialog(followAll ? strings.feedback.followAllOn : strings.feedback.followAllOff);
						reopenMenu("behavior");
					});
					appendMenuBtn(`${strings.panel.notify}${notifyOn ? " ✓" : " ✕"}`, () => {
						notifyOn = !notifyOn;
						try {
							localStorage.setItem(NOTIFY_KEY, notifyOn ? "1" : "0");
						} catch {}
						if (!notifyOn) restoreTitle();
						showDialog(notifyOn ? strings.feedback.notifyOn : strings.feedback.notifyOff);
						reopenMenu("behavior");
					});
					if (hasNotificationApi) appendMenuBtn(`${strings.panel.sysNotify}${sysNotifyOn ? " ✓" : " ✕"}`, () => {
						const turningOn = !sysNotifyOn;
						const request = ++permissionRequest;
						const commit = (granted) => {
							if (disposed || request !== permissionRequest) return;
							sysNotifyOn = turningOn && granted;
							try {
								localStorage.setItem(SYS_NOTIFY_KEY, sysNotifyOn ? "1" : "0");
							} catch {}
							showDialog(!turningOn ? strings.feedback.sysNotifyOff : granted ? strings.feedback.sysNotifyOn : strings.feedback.sysNotifyDenied);
							reopenMenu("behavior");
						};
						if (turningOn && Notification.permission === "default") {
							Notification.requestPermission().then((p) => commit(p === "granted"), () => commit(false));
							return;
						}
						commit(Notification.permission === "granted");
					});
					appendMenuBtn(strings.panel.sedentary(sedentaryMin), () => {
						const i = SEDENTARY_CHOICES.indexOf(sedentaryMin);
						sedentaryMin = SEDENTARY_CHOICES[(i + 1) % SEDENTARY_CHOICES.length];
						try {
							localStorage.setItem(SEDENTARY_KEY, String(sedentaryMin));
						} catch {}
						startSedentary();
						showDialog(sedentaryMin === 0 ? strings.feedback.sedentaryOff : strings.feedback.sedentarySet(sedentaryMin));
						reopenMenu("behavior");
					});
					appendMenuBtn(strings.panel.back, backMore, "pw-back");
					return;
				}
				if (mode === "rest") {
					appendMenuBtn(`🕐 ${strings.panel.in1h}`, () => {
						closeMenu();
						scheduleOnce(36e5);
						showDialog(strings.feedback.schedule1h);
					});
					appendMenuBtn(`🌙 ${strings.panel.daily}`, () => {
						closeMenu();
						scheduleDaily(22, 0);
						showDialog(strings.feedback.scheduleDaily);
					});
					appendMenuBtn(`🚫 ${strings.panel.cancelSchedule}`, () => {
						closeMenu();
						clearAutoHide();
						showDialog(strings.feedback.scheduleCancel);
					});
					appendMenuBtn(strings.panel.hide, () => {
						closeMenu();
						hideWhale();
					});
					appendMenuBtn(strings.panel.close, () => {
						closeMenu();
						quitWhale();
					});
					appendMenuBtn(strings.panel.back, backMore, "pw-back");
				}
			};
			let lastMenuPos = {
				x: 0,
				y: 0
			};
			const positionMenu = (clientX, clientY) => {
				const rect = root.getBoundingClientRect();
				const menuW = menu.offsetWidth || 140;
				const menuH = menu.offsetHeight || 130;
				const x = Math.min(Math.max(0, clientX - rect.left), Math.max(0, rect.width - menuW));
				const y = clientY + menuH + 8 > window.innerHeight ? clientY - rect.top - menuH - 10 : clientY - rect.top + 12;
				const minY = -rect.top + 8;
				const maxY = Math.max(minY, window.innerHeight - rect.top - menuH - 8);
				menu.style.left = `${x}px`;
				menu.style.top = `${Math.min(Math.max(minY, y), maxY)}px`;
			};
			const openMenu = (clientX, clientY) => {
				lastMenuPos = {
					x: clientX,
					y: clientY
				};
				buildMenu("main");
				menu.classList.add("open");
				positionMenu(clientX, clientY);
			};
			const closeMenu = () => menu.classList.remove("open");
			const onDocPointerDown = (e) => {
				if (!menu.contains(e.target)) closeMenu();
			};
			let dragging = false;
			let suppressClick = false;
			let avoidCooldownUntil = 0;
			let avoidTimer;
			const cancelAvoid = () => {
				cancelLater(avoidTimer);
				avoidTimer = void 0;
				root.style.transition = "";
			};
			const maybeAvoid = (e) => {
				if (root.classList.contains("hidden") || dragging || menu.classList.contains("open") || visualState !== "idle") return;
				if (performance.now() < avoidCooldownUntil) return;
				const rect = pet.getBoundingClientRect();
				if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
					cancelAvoid();
					return;
				}
				if (!(e.clientX >= rect.left - AVOID_MARGIN && e.clientX <= rect.right + AVOID_MARGIN && e.clientY >= rect.top - AVOID_MARGIN && e.clientY <= rect.bottom + AVOID_MARGIN)) {
					cancelAvoid();
					return;
				}
				if (avoidTimer !== void 0) return;
				avoidTimer = later(() => {
					avoidTimer = void 0;
					if (root.classList.contains("hidden") || dragging || menu.classList.contains("open") || visualState !== "idle") return;
					if (performance.now() < avoidCooldownUntil) return;
					swimmer.interrupt();
					const r = pet.getBoundingClientRect();
					if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return;
					const cx = r.left + r.width / 2;
					const cy = r.top + r.height / 2;
					const dx = e.clientX - cx;
					const dy = e.clientY - cy;
					const len = Math.hypot(dx, dy) || 1;
					const next = clampPos(cx - dx / len * AVOID_STEP - PET_W() / 2, cy - dy / len * AVOID_STEP - PET_H() / 2);
					root.style.transition = "left .35s ease, top .35s ease";
					root.style.left = `${next.x}px`;
					root.style.top = `${next.y}px`;
					later(() => {
						root.style.transition = "";
						savePos();
					}, 380);
					showDialog(strings.feedback.avoid);
				}, AVOID_DWELL_MS);
			};
			/** 两次掉头之间至少要走这么远，手抖不算 */
			const PAT_MIN_TRAVEL = 8;
			/** 停手这么久就算摸完了 */
			const PAT_IDLE_MS = 650;
			/** 每蹭这么多下冒一颗爱心 */
			const PAT_HEART_EVERY = 5;
			const PAT_SAY_COOLDOWN_MS = 4e3;
			/** 这么多下蹭在 PAT_TOO_FAST_MS 以内就是乱蹭：生气、游开 */
			const PAT_TOO_FAST_STROKES = 8;
			const PAT_TOO_FAST_MS = 1100;
			/** 生气后这段时间里再蹭也不理 */
			const PAT_GRUMPY_MS = 5e3;
			const PAT_FLEE_STEP = 160;
			let patStrokes = 0;
			let patStrokeTimes = [];
			let patBlockedUntil = 0;
			let patLastY = 0;
			let patDir = 0;
			let patTurnX = 0;
			let patLastX = 0;
			let patEndTimer = 0;
			let patSaidAt = -Infinity;
			const inHeadZone = (x, y) => {
				const r = pet.getBoundingClientRect();
				if (r.width === 0) return false;
				const fx = (x - r.left) / r.width;
				const fy = (y - r.top) / r.height;
				return (swimmer.currentFacing === "left" ? fx >= .05 && fx <= .6 : fx >= .4 && fx <= .95) && fy >= 0 && fy <= .45;
			};
			const patTimers = /* @__PURE__ */ new Set();
			const endPat = () => {
				for (const id of patTimers) cancelLater(id);
				patTimers.clear();
				cancelLater(patEndTimer);
				patEndTimer = 0;
				patStrokes = 0;
				patStrokeTimes = [];
				patDir = 0;
				pet.classList.remove("petting", "pat-press");
				root.classList.remove("patting");
			};
			const pressHead = () => {
				pet.classList.remove("pat-press");
				pet.offsetWidth;
				pet.classList.add("pat-press");
			};
			const popHeart = () => {
				const heart = pet.querySelector(".pat-heart");
				if (heart === null) return;
				heart.classList.remove("show");
				heart.offsetWidth;
				heart.classList.add("show");
			};
			/** 摸满一轮：冒爱心、说句话、算一次互动；失落时这一摸就是安慰 */
			const patReward = () => {
				popHeart();
				if (visualState === "disappointed" && driver.soothe()) {
					onSnapshot();
					triggerComfort();
					return;
				}
				recordInteraction();
				const now = performance.now();
				if (now - patSaidAt < PAT_SAY_COOLDOWN_MS) return;
				patSaidAt = now;
				sounds.play("bubble");
				showDialog(pick(strings.feedback.patted));
			};
			/** 乱蹭：吊眉、放狠话，朝远离光标的方向游开一段 */
			const patTooFast = () => {
				endPat();
				const now = performance.now();
				patBlockedUntil = now + PAT_GRUMPY_MS;
				avoidCooldownUntil = now + PAT_GRUMPY_MS;
				recordInteraction();
				clearSulk();
				sulking = true;
				pet.classList.remove("annoyed", "squish", "dizzy", "joy");
				pet.classList.add("sulking");
				sounds.play("bubble");
				showDialog(pick(strings.feedback.patTooFast));
				sulkTimer = later(() => {
					sulkTimer = 0;
					clearSulk();
				}, 2600);
				swimmer.interrupt();
				const r = pet.getBoundingClientRect();
				const cx = r.left + r.width / 2;
				const cy = r.top + r.height / 2;
				const dx = cx - patLastX;
				const dy = cy - patLastY;
				const len = Math.hypot(dx, dy) || 1;
				const next = clampPos(cx + dx / len * PAT_FLEE_STEP - PET_W() / 2, cy + dy / len * PAT_FLEE_STEP - PET_H() / 2);
				root.style.transition = "left .6s cubic-bezier(.2,.8,.3,1), top .6s cubic-bezier(.2,.8,.3,1)";
				root.style.left = `${next.x}px`;
				root.style.top = `${next.y}px`;
				swimmer.spawnSplash(cx, r.top + r.height * .79, 4);
				later(() => {
					root.style.transition = "";
					savePos();
				}, 650);
			};
			const onPatStroke = () => {
				markActive();
				const now = performance.now();
				patStrokeTimes.push(now);
				if (patStrokeTimes.length > PAT_TOO_FAST_STROKES) patStrokeTimes.shift();
				if (patStrokeTimes.length === PAT_TOO_FAST_STROKES && now - patStrokeTimes[0] < PAT_TOO_FAST_MS) {
					patTooFast();
					return;
				}
				patStrokes += 1;
				if (patStrokes >= 2) {
					if (!pet.classList.contains("petting")) {
						swimmer.interrupt();
						cancelAvoid();
						pet.classList.add("petting");
						root.classList.add("patting");
					}
					pressHead();
				}
				if (patStrokes % PAT_HEART_EVERY === 0) patReward();
			};
			const maybePat = (e) => {
				if (e.buttons !== 0 || dragging || menu.classList.contains("open") || root.classList.contains("hidden") || visualState === "error" || performance.now() < patBlockedUntil) {
					if (patStrokes > 0) endPat();
					return;
				}
				if (!inHeadZone(e.clientX, e.clientY)) {
					if (patStrokes > 0 || patDir !== 0) endPat();
					return;
				}
				const prevX = patLastX;
				patLastX = e.clientX;
				patLastY = e.clientY;
				const dx = e.clientX - prevX;
				if (dx === 0) return;
				const dir = dx > 0 ? 1 : -1;
				if (patDir === 0) {
					patDir = dir;
					patTurnX = prevX;
				} else if (dir !== patDir) {
					if (Math.abs(prevX - patTurnX) >= PAT_MIN_TRAVEL) onPatStroke();
					patDir = dir;
					patTurnX = prevX;
				}
				cancelLater(patEndTimer);
				patEndTimer = later(endPat, PAT_IDLE_MS);
			};
			/** 菜单「摸摸头」和长按：没有鼠标轨迹，就替你摸三下 */
			const triggerPat = () => {
				if (root.classList.contains("hidden") || visualState === "error" || performance.now() < patBlockedUntil) return;
				endPat();
				swimmer.interrupt();
				pet.classList.add("petting");
				root.classList.add("patting");
				[
					0,
					280,
					560
				].forEach((ms) => patTimers.add(later(pressHead, ms)));
				patTimers.add(later(() => {
					patSaidAt = -Infinity;
					patReward();
				}, 560));
				patEndTimer = later(endPat, 1500);
			};
			let idleMicroTimer;
			const clearIdleMicro = () => {
				cancelLater(idleMicroTimer);
				idleMicroTimer = void 0;
			};
			const microLook = () => {
				const pupil = petPupil();
				if (pupil === null) return;
				const dx = Math.random() * .4 - .2;
				const dy = Math.random() * .3 - .15;
				pupil.style.transition = "transform .45s ease";
				pupil.style.transform = `translate(${dx}px, ${dy}px)`;
				later(() => {
					pupil.style.transition = "";
					pupil.style.transform = "";
				}, 1500);
			};
			const microBubbles = () => {
				popBubble();
				later(popBubble, 260);
			};
			/** microSwim 的补间时长，也是"坐标不可信"的窗口 */
			const MICRO_SWIM_MS = 1450;
			let microSwimUntil = 0;
			const microSwim = (quiet = false) => {
				const ox = parseFloat(root.style.left) || 0;
				const oy = parseFloat(root.style.top) || 0;
				const target = clampPos(ox + (Math.random() * 200 - 100), oy + (Math.random() * 140 - 70));
				root.style.transition = "left 1.4s ease-in-out, top 1.4s ease-in-out";
				root.style.left = `${target.x}px`;
				root.style.top = `${target.y}px`;
				microSwimUntil = Date.now() + MICRO_SWIM_MS;
				later(() => {
					root.style.transition = "";
					microSwimUntil = 0;
					savePos();
				}, MICRO_SWIM_MS);
				if (!quiet && Math.random() < .35) showDialog(pick(strings.feedback.swim));
			};
			/** 单个动作占用的时长上限：宠物样式表里的动画要 ≤ 这个值（约定 2.2s，留 0.2s 余量） */
			const MICRO_ACTION_MS = 2400;
			/** 动作会说话的几率 */
			const MICRO_LINE_CHANCE = .6;
			let microActionTimer = 0;
			let microActionClass = "";
			let microActionLast = "";
			/** 洗牌袋：声明的动作打乱后依次取，取完重洗 → 短周期内不会连着重复同一个 */
			let microBag = [];
			const clearMicroAction = () => {
				if (microActionClass === "") return;
				pet.classList.remove(microActionClass);
				microActionClass = "";
			};
			const nextMicroAction = () => {
				const list = activePet.micro ?? [];
				if (list.length === 0) return "";
				if (microBag.length === 0) {
					microBag = [...list];
					for (let i = microBag.length - 1; i > 0; i--) {
						const j = Math.floor(Math.random() * (i + 1));
						const t = microBag[i];
						microBag[i] = microBag[j];
						microBag[j] = t;
					}
					if (microBag.length > 1 && microBag[0] === microActionLast) {
						const t = microBag[0];
						microBag[0] = microBag[1];
						microBag[1] = t;
					}
				}
				return microBag.shift() ?? "";
			};
			const playMicroAction = (id) => {
				if (id === "") return;
				clearMicroAction();
				microActionLast = id;
				microActionClass = `micro-${id}`;
				pet.classList.add(microActionClass);
				window.clearTimeout(microActionTimer);
				microActionTimer = window.setTimeout(clearMicroAction, MICRO_ACTION_MS);
				const pool = strings.micro[id];
				if (pool !== void 0 && pool.length > 0 && Math.random() < MICRO_LINE_CHANCE) showDialog(pick(pool));
			};
			const scheduleIdleMicro = () => {
				clearIdleMicro();
				idleMicroTimer = later(() => {
					if (visualState !== "idle" || sleeping || sulking || root.classList.contains("hidden") || dragging || document.hidden || menu.classList.contains("open")) {
						scheduleIdleMicro();
						return;
					}
					if (swimmer.isEnabled) if (Math.random() < .5) microLook();
					else microBubbles();
					else if ((activePet.micro?.length ?? 0) > 0 && Math.random() < .62) playMicroAction(nextMicroAction());
					else {
						const canDrift = activePet.idleDrift !== false;
						const roll = Math.random();
						if (canDrift && roll < .35) microSwim();
						else if (roll < (canDrift ? .7 : .55)) microLook();
						else microBubbles();
					}
					scheduleIdleMicro();
				}, 9e3 + Math.random() * 8e3);
			};
			/** 当前这条腿的方向，0 表示还没定下来 */
			let shakeDir = 0;
			/** 这条腿的起点；同向移动时跟着推进，等于一路记住最远处 */
			let shakeLegFrom = 0;
			let shakeCount = 0;
			let shakeWindowFrom = 0;
			/** 晕到什么时候为止，也当冷却用 */
			let shakenUntil = 0;
			const resetShake = () => {
				shakeDir = 0;
				shakeCount = 0;
			};
			const triggerShaken = () => {
				const now = performance.now();
				if (now < shakenUntil) return;
				shakeCount = 0;
				shakenUntil = now + SHAKEN_MS + SHAKE_COOLDOWN_MS;
				markActive();
				recordInteraction();
				clearReaction();
				pet.classList.remove("shaken", "dizzy", "squish", "joy", "annoyed");
				pet.offsetWidth;
				pet.classList.add("shaken");
				sounds.play("bubble");
				showDialog(pick(strings.feedback.shaken));
				swimmer.setWoozy(13600);
				expireClass(pet, "shaken", SHAKEN_MS);
			};
			/** 双击的专属反应：翻肚皮。翻着的时候不接别的动作，让这两秒完整演完 */
			let bellyUpUntil = 0;
			const triggerBellyUp = () => {
				const now = performance.now();
				if (now < bellyUpUntil) return;
				bellyUpUntil = now + BELLY_UP_MS;
				markActive();
				recordInteraction();
				pokeStreak = 0;
				if (pokeDecayTimer !== 0) {
					cancelLater(pokeDecayTimer);
					pokeDecayTimer = 0;
				}
				if (sulking) clearSulk();
				clearReaction();
				pet.classList.remove("squish", "dizzy", "joy", "annoyed", "shaken");
				pet.offsetWidth;
				pet.classList.add("belly-up");
				sounds.play("trick");
				showDialog(pick(strings.feedback.bellyUp));
				expireClass(pet, "belly-up", BELLY_UP_MS);
			};
			const trackShake = (x) => {
				const now = performance.now();
				const delta = x - shakeLegFrom;
				const dir = Math.sign(delta);
				if (dir === 0) return;
				if (shakeDir === 0) {
					if (Math.abs(delta) >= SHAKE_MIN_LEG) {
						shakeDir = dir;
						shakeLegFrom = x;
					}
					return;
				}
				if (dir === shakeDir) {
					shakeLegFrom = x;
					return;
				}
				if (Math.abs(delta) < SHAKE_MIN_LEG) return;
				shakeDir = dir;
				shakeLegFrom = x;
				if (now - shakeWindowFrom > SHAKE_WINDOW_MS) {
					shakeCount = 0;
					shakeWindowFrom = now;
				}
				shakeCount++;
				if (shakeCount >= SHAKE_REVERSALS) triggerShaken();
			};
			let dragStart = null;
			let longPressTimer;
			const onPetPointerDown = (e) => {
				if (disposed || e.button !== 0 || e.isPrimary === false || dragStart !== null) return;
				suppressClick = false;
				endPat();
				cancelAvoid();
				swimmer.interrupt();
				avoidCooldownUntil = performance.now() + AVOID_COOLDOWN_MS;
				markActive();
				dragStart = {
					pointerId: e.pointerId,
					x: e.clientX,
					y: e.clientY,
					ox: parseFloat(root.style.left) || 0,
					oy: parseFloat(root.style.top) || 0
				};
				resetShake();
				shakeLegFrom = e.clientX;
				shakeWindowFrom = performance.now();
				root.dataset.facing = swimmer.currentFacing;
				try {
					pet.setPointerCapture(e.pointerId);
				} catch {}
				cancelLater(longPressTimer);
				longPressTimer = later(() => {
					suppressClick = true;
					triggerPat();
				}, 700);
			};
			/**
			* 贴边挤扁。只在拖拽时判定——自己游到边上是贴着走，不是被人按上去的。
			* 台词有独立冷却，不然沿着边拖一路会一直喊。
			*/
			let squeezeSaidAt = 0;
			const updateEdge = (x, y) => {
				const maxX = Math.max(0, window.innerWidth - PET_W());
				const maxY = Math.max(0, window.innerHeight - PET_H());
				const onLeft = x <= EDGE_SLACK;
				const onRight = !onLeft && x >= maxX - EDGE_SLACK;
				const sideways = onLeft || onRight;
				const onTop = !sideways && y <= EDGE_SLACK;
				const onBottom = !sideways && y >= maxY - EDGE_SLACK;
				root.classList.toggle("edge-left", onLeft);
				root.classList.toggle("edge-right", onRight);
				root.classList.toggle("edge-top", onTop);
				root.classList.toggle("edge-bottom", onBottom);
				if (!sideways && !onTop && !onBottom) return;
				const now = performance.now();
				if (now - squeezeSaidAt < 4e3) return;
				squeezeSaidAt = now;
				if (sideways) {
					showDialog(pick(strings.feedback.squeezed));
					swimmer.spawnDrip(x + (onLeft ? PET_W() * .18 : PET_W() * .82), y + PET_H() * .87);
				} else {
					showDialog(pick(onTop ? strings.feedback.squashedTop : strings.feedback.squashedBottom));
					swimmer.spawnDrip(x + PET_W() * (Math.random() < .5 ? .25 : .75), y + PET_H() * .87);
				}
			};
			const clearEdge = () => {
				root.classList.remove("edge-left", "edge-right", "edge-top", "edge-bottom");
			};
			/** 拖着不放又不动：三秒后开始扭 */
			let dragIdleTimer = 0;
			/** fresh=true 表示这是人动了手才重排的，扭动该停；续问时不能清，否则刚扭就被抹掉 */
			const armDragIdle = (fresh = true) => {
				if (dragIdleTimer !== 0) cancelLater(dragIdleTimer);
				if (fresh) pet.classList.remove("impatient");
				dragIdleTimer = later(() => {
					if (!dragging) return;
					pet.classList.add("impatient");
					showDialog(pick(strings.feedback.dragIdle));
					armDragIdle(false);
				}, DRAG_IDLE_MS);
			};
			const disarmDragIdle = () => {
				if (dragIdleTimer !== 0) {
					cancelLater(dragIdleTimer);
					dragIdleTimer = 0;
				}
				pet.classList.remove("impatient");
			};
			let lastDripTime = 0;
			const onPetPointerMove = (e) => {
				if (dragStart === null || e.pointerId !== dragStart.pointerId) return;
				const dx = e.clientX - dragStart.x;
				const dy = e.clientY - dragStart.y;
				if (!dragging && Math.abs(dx) + Math.abs(dy) > 4) {
					endPat();
					dragging = true;
					suppressClick = true;
					root.classList.add("dragging");
					cancelLater(longPressTimer);
					armDragIdle();
				}
				if (dragging) {
					const p = clampPos(dragStart.ox + dx, dragStart.oy + dy);
					root.style.left = `${p.x}px`;
					root.style.top = `${p.y}px`;
					trackShake(e.clientX);
					updateEdge(p.x, p.y);
					armDragIdle();
					const now = performance.now();
					if (now - lastDripTime > 380) {
						lastDripTime = now;
						swimmer.spawnDrip(p.x + PET_W() / 2, p.y + PET_H() * .87);
					}
				}
			};
			const endDrag = (e) => {
				if (dragStart === null || e && e.pointerId !== dragStart.pointerId) return;
				const id = dragStart.pointerId;
				dragStart = null;
				try {
					pet.releasePointerCapture(id);
				} catch {}
				resetShake();
				disarmDragIdle();
				clearEdge();
				if (dragging) {
					dragging = false;
					root.classList.remove("dragging");
					const px = parseFloat(root.style.left) || 0;
					const py = parseFloat(root.style.top) || 0;
					swimmer.spawnSplash(px + PET_W() / 2, py + PET_H() * .79, 4);
					swimmer.spawnWaterRipple(px + PET_W() / 2, py + PET_H() * .79, false);
					savePos();
					root.dataset.facing = swimmer.currentFacing;
					pet.style.transform = `scaleX(${swimmer.currentFacing === "left" ? 1 : -1}) rotate(0deg)`;
				}
				cancelLater(longPressTimer);
				if (!e || e.type !== "pointerup") {
					suppressClick = true;
					endPat();
				}
			};
			let sleepTimer;
			let sleeping = false;
			const markActive = () => {
				cancelLater(sleepTimer);
				if (sleeping) {
					sleeping = false;
					root.classList.remove("sleeping");
					pet.classList.add("spouting");
					expireClass(pet, "spouting", 1400);
					showDialog(strings.feedback.wake);
					sounds.play("bubble");
				}
				sleepTimer = later(() => {
					if (visualState !== "idle" || dragging) {
						markActive();
						return;
					}
					sleeping = true;
					root.classList.add("sleeping");
					clearMicroAction();
					showDialog(strings.feedback.sleep);
				}, SLEEP_MS);
			};
			const wake = () => {
				if (sleeping) {
					sleeping = false;
					root.classList.remove("sleeping");
					pet.classList.add("spouting");
					expireClass(pet, "spouting", 1400);
				}
			};
			let eyeRaf = 0;
			const onMouseMove = (e) => {
				if (root.classList.contains("hidden")) return;
				markActive();
				maybeAvoid(e);
				maybePat(e);
				if (eyeRaf !== 0) return;
				const pupil = petPupil();
				if (pupil === null) return;
				eyeRaf = window.requestAnimationFrame(() => {
					eyeRaf = 0;
					const rect = pet.getBoundingClientRect();
					const cx = rect.left + rect.width / 2;
					const cy = rect.top + rect.height / 2;
					const dx = Math.max(-.18, Math.min(.18, (e.clientX - cx) / 500));
					const dy = Math.max(-.15, Math.min(.15, (e.clientY - cy) / 450));
					pupil.style.transform = `translate(${dx}px, ${dy}px)`;
				});
			};
			const copyError = async () => {
				const text = lastErrorText;
				let copied = false;
				try {
					if (navigator.clipboard !== void 0) {
						await navigator.clipboard.writeText(text);
						copied = true;
					}
				} catch {}
				if (!disposed && text === lastErrorText) showDialog(copied ? strings.feedback.errorCopied : strings.feedback.errorCopyFailed);
			};
			pet.addEventListener("click", () => {
				if (disposed || suppressClick || performance.now() < bellyUpUntil) return;
				if (visualState === "error" && lastErrorText !== "") {
					copyError();
					return;
				}
				if (visualState === "disappointed" && driver.soothe()) {
					onSnapshot();
					triggerComfort();
					return;
				}
				markActive();
				bumpPokeStreak();
				if (sulking) {
					recordInteraction();
					showDialog(pick(strings.feedback.pokeSulk));
					return;
				}
				if (pokeStreak >= POKE_SULK_AT) {
					triggerSulk();
					return;
				}
				if (pokeStreak >= POKE_ANNOYED_AT) {
					triggerAnnoyed();
					return;
				}
				const rand = Math.random();
				if (rand < .65) triggerSquish();
				else if (rand < .85) triggerRoll();
				else triggerDizzy();
			});
			pet.addEventListener("dblclick", () => {
				if (disposed || suppressClick || performance.now() < bellyUpUntil || visualState === "error") return;
				if (currentTier() >= BOND_THRESHOLDS.length - 1) triggerBellyUp();
				else triggerRoll();
			});
			pet.addEventListener("contextmenu", (e) => {
				e.preventDefault();
				cancelAvoid();
				avoidCooldownUntil = performance.now() + AVOID_COOLDOWN_MS;
				openMenu(e.clientX, e.clientY);
			});
			pet.addEventListener("pointerdown", onPetPointerDown);
			pet.addEventListener("lostpointercapture", endDrag);
			window.addEventListener("pointermove", onPetPointerMove);
			window.addEventListener("pointerup", endDrag);
			window.addEventListener("pointercancel", endDrag);
			window.addEventListener("pointermove", onMiniPointerMove);
			window.addEventListener("pointerup", onMiniDragEnd);
			window.addEventListener("pointercancel", onMiniDragEnd);
			const onBlur = () => {
				endDrag();
				onMiniDragEnd();
				endPat();
			};
			window.addEventListener("blur", onBlur);
			document.addEventListener("pointerdown", onDocPointerDown);
			document.addEventListener("keydown", markActive);
			document.addEventListener("wheel", markActive, { passive: true });
			window.addEventListener("mousemove", onMouseMove, { passive: true });
			window.addEventListener("resize", onResize);
			const driver = new WhaleDriver();
			const sessions = ctx.sessions;
			const uiConversation = ctx.uiConversation;
			let unsubList;
			let unsubSession;
			let unsubChat;
			let face;
			let chat;
			let boundSession;
			let prevSessionId = void 0;
			let isFirstSessionSync = true;
			const statusRaw = ctx.uiSession?.sessionStatus;
			const statusSource = typeof statusRaw?.getSnapshot === "function" ? statusRaw : void 0;
			/** 把两处订阅合成状态机需要的"最小快照面"。 */
			const composeSnapshot = () => {
				if (face === void 0) return void 0;
				const session = face.getSnapshot();
				const legacy = chat?.legacy;
				const partial = legacy?.partial ?? null;
				const status = prevSessionId === void 0 ? void 0 : statusSource?.getSnapshot().get(prevSessionId);
				return {
					running: session.running,
					partial,
					runningCalls: legacy?.runningCalls ?? [],
					partialToolCall: partialHasToolCall(partial),
					lastAgentError: session.lastAgentError,
					openError: session.openError,
					turnEnds: legacy?.turnEnds,
					pending: status?.pendingInteraction !== void 0 ? [status.pendingInteraction] : session.pending
				};
			};
			let followAll = true;
			try {
				followAll = localStorage.getItem(FOLLOW_ALL_KEY) !== "0";
			} catch {}
			let otherRunning = 0;
			let otherWaiting = 0;
			/** 别的会话的事，要在状态切换的那句台词之后再说，不然会被盖掉 */
			let otherNews = "";
			const prevOtherRunning = /* @__PURE__ */ new Map();
			const prevOtherWaiting = /* @__PURE__ */ new Map();
			let statusPrimed = false;
			const rowOf = (id) => (sessions?.list.getSnapshot().byId)?.[id];
			let badgeCount = 0;
			const updateBadge = () => {
				const n = followAll ? otherRunning : 0;
				badge.hidden = n === 0;
				badge.textContent = n > 9 ? "9+" : String(n);
				badge.title = n === 0 ? "" : strings.multi.badge(n);
				if (n > 0 && n !== badgeCount) {
					badge.classList.remove("pop");
					badge.offsetWidth;
					badge.classList.add("pop");
				}
				if (n > 0) startFollow();
				badgeCount = n;
			};
			const recountOthers = () => {
				if (statusSource === void 0) return;
				const snapshot = statusSource.getSnapshot();
				for (const id of prevOtherRunning.keys()) if (!snapshot.has(id) || rowOf(id)?.parentId !== void 0 || rowOf(id)?.origin === "subagent") {
					prevOtherRunning.delete(id);
					prevOtherWaiting.delete(id);
				}
				let running = 0;
				let waiting = 0;
				let done;
				let newlyWaiting;
				for (const [id, st] of snapshot) {
					const row = rowOf(id);
					if (row?.parentId !== void 0 || row?.origin === "subagent") continue;
					if (id === prevSessionId) {
						prevOtherRunning.delete(id);
						prevOtherWaiting.delete(id);
						continue;
					}
					const isRunning = st.running === true;
					const isWaiting = st.pendingInteraction !== void 0;
					if (isRunning) running++;
					if (isWaiting) waiting++;
					if (statusPrimed && prevOtherRunning.get(id) === true && st.running === false) done ??= id;
					if (statusPrimed && isWaiting && prevOtherWaiting.get(id) !== true) newlyWaiting ??= id;
					prevOtherRunning.set(id, isRunning);
					prevOtherWaiting.set(id, isWaiting);
				}
				statusPrimed = true;
				otherRunning = running;
				otherWaiting = waiting;
				updateBadge();
				if (followAll) {
					if (done !== void 0) {
						driver.celebrateOther(performance.now());
						otherNews = strings.multi.doneOther(rowOf(done)?.displayTitle ?? "");
					} else if (newlyWaiting !== void 0) otherNews = strings.multi.waitingOther(rowOf(newlyWaiting)?.displayTitle ?? "");
				}
			};
			const onStatus = () => {
				recountOthers();
				onSnapshot();
			};
			let wakeTimer = 0;
			const clearWake = () => {
				if (wakeTimer !== 0) {
					cancelLater(wakeTimer);
					wakeTimer = 0;
				}
			};
			const scheduleWake = () => {
				clearWake();
				const now = performance.now();
				const at = driver.nextDeadline(now);
				if (at === null) return;
				wakeTimer = later(() => {
					wakeTimer = 0;
					onSnapshot();
				}, Math.max(16, at - now + 24));
			};
			/** 当前会话闲着时，别的会话的状态顶上来：有人等确认 > 有人在跑 */
			const withOthers = (state) => {
				if (!followAll || state !== "idle") return state;
				if (otherWaiting > 0) return "wait";
				if (otherRunning > 0) return "working";
				return state;
			};
			let busyTier = 0;
			let peakRunning = 0;
			const trackConcurrency = (currentRunning) => {
				if (!followAll || statusSource === void 0) {
					busyTier = 0;
					peakRunning = 0;
					return;
				}
				const total = otherRunning + (currentRunning ? 1 : 0);
				const tier = total >= OVERTIME_AT ? 2 : total >= 2 ? 1 : 0;
				if (tier > busyTier) {
					otherNews = pick(tier === 2 ? strings.multi.overtime(total) : strings.multi.parallel(total));
					busyTier = tier;
				}
				peakRunning = Math.max(peakRunning, total);
				if (total === 0) {
					if (peakRunning >= 2) otherNews = pick(strings.multi.allDone);
					busyTier = 0;
					peakRunning = 0;
				}
			};
			let lastShown = null;
			const announceOtherNews = () => {
				if (otherNews === "") return;
				showDialog(otherNews);
				otherNews = "";
			};
			const onSnapshot = () => {
				if (disposed) return;
				const snapObj = composeSnapshot() ?? {
					running: false,
					lastAgentError: null,
					openError: null
				};
				lastErrorText = snapObj.lastAgentError ?? (snapObj.openError != null ? "open-error" : "");
				trackConcurrency(snapObj.running);
				const step = driver.step(snapObj, performance.now());
				const shown = withOthers(step.state);
				setState(shown, lastShown !== null && shown !== lastShown);
				lastShown = shown;
				announceOtherNews();
				updateTicker(tickerOn && step.state === "think" ? partialTextOf(snapObj.partial) : "");
				scheduleWake();
			};
			const syncSession = () => {
				const id = currentSessionId(sessions.list.getSnapshot());
				const binding = id === void 0 ? void 0 : sessions.binding(id);
				if (disposed) return;
				if (!isFirstSessionSync && id === prevSessionId && binding === boundSession) {
					recountOthers();
					onSnapshot();
					return;
				}
				unsubSession?.();
				unsubChat?.();
				unsubSession = void 0;
				unsubChat = void 0;
				face = void 0;
				chat = void 0;
				boundSession = binding;
				if (id !== void 0 && id !== prevSessionId && !isFirstSessionSync) triggerWelcome();
				const switched = id !== prevSessionId;
				if (switched && !isFirstSessionSync) driver.reset();
				prevSessionId = id;
				isFirstSessionSync = false;
				if (switched) recountOthers();
				if (id === void 0 || binding === void 0) {
					onSnapshot();
					return;
				}
				face = binding.session;
				unsubSession = face.subscribe(onSnapshot);
				try {
					const target = uiConversation.binding(binding).target("chat");
					unsubChat = target.subscribe(() => {
						chat = target.getSnapshot();
						onSnapshot();
					});
					chat = target.getSnapshot();
				} catch {
					chat = void 0;
				}
				onSnapshot();
			};
			let unsubStatus;
			if (sessions !== void 0) {
				unsubList = sessions.list.subscribe(syncSession);
				syncSession();
				unsubStatus = statusSource?.subscribe(onStatus);
				onStatus();
			}
			markActive();
			try {
				if (localStorage.getItem(HIDDEN_KEY) === "1") {
					root.classList.add("hidden");
					createMini();
				}
			} catch {}
			startAutoHide();
			let localeUnsub;
			const applyLocale = (nextLocale) => {
				if (locale === nextLocale) return;
				locale = nextLocale;
				strings = getStrings(locale, activePet.text?.[locale]);
				pet.setAttribute("aria-label", strings.aria.petName(petDisplayName(activePet)));
				if (mini !== null) mini.setAttribute("aria-label", strings.aria.mini);
				syncMiniState(visualState);
				if (menu.classList.contains("open")) {
					buildMenu(menuMode);
					positionMenu(lastMenuPos.x, lastMenuPos.y);
				}
			};
			localeUnsub = localeService?.subscribe(() => {
				const nextLocale = localeService.getLocale().active === "en" ? "en" : "zh";
				applyLocale(nextLocale);
			});
			const chatterTick = () => {
				if (currentTier() < BOND_THRESHOLDS.length - 1) return;
				if (visualState !== "idle" || document.hidden || sleeping || sulking || root.classList.contains(HIDDEN_CLASS) || menu.classList.contains("open")) return;
				if (Math.random() > CHATTER_CHANCE) return;
				showDialog(pick(strings.bond.chatter));
			};
			const chatterTimer = window.setInterval(chatterTick, CHATTER_TICK_MS);
			checkBondUp();
			const dispose = () => {
				if (disposed) return;
				disposed = true;
				endDrag();
				onMiniDragEnd();
				endPat();
				for (const id of timers) window.clearTimeout(id);
				timers.clear();
				classTimers.clear();
				removalObserver.disconnect();
				if (owner.__petWhaleDispose === dispose) delete owner.__petWhaleDispose;
				const api = document;
				delete api.__petWhalePets;
				delete api.__petWhaleActivePet;
				delete api.__petWhaleSetPet;
				pet.removeEventListener("pointerdown", onPetPointerDown);
				pet.removeEventListener("lostpointercapture", endDrag);
				window.removeEventListener("pointermove", onPetPointerMove);
				window.removeEventListener("pointerup", endDrag);
				window.removeEventListener("pointercancel", endDrag);
				window.removeEventListener("pointermove", onMiniPointerMove);
				window.removeEventListener("pointerup", onMiniDragEnd);
				window.removeEventListener("pointercancel", onMiniDragEnd);
				window.removeEventListener("blur", onBlur);
				cancelLater(sleepTimer);
				window.clearTimeout(microActionTimer);
				if (sedentaryTimer !== 0) window.clearInterval(sedentaryTimer);
				window.clearInterval(chatterTimer);
				if (dragIdleTimer !== 0) cancelLater(dragIdleTimer);
				restoreTitle();
				for (const notification of notifications) try {
					notification.close();
				} catch {}
				notifications.clear();
				if (pokeDecayTimer !== 0) cancelLater(pokeDecayTimer);
				if (sulkTimer !== 0) cancelLater(sulkTimer);
				cancelLater(dialogTimer);
				if (eyeRaf !== 0) window.cancelAnimationFrame(eyeRaf);
				unsubList?.();
				unsubStatus?.();
				unsubSession?.();
				unsubChat?.();
				clearWake();
				document.removeEventListener("pointerdown", onDocPointerDown);
				document.removeEventListener("keydown", markActive);
				document.removeEventListener("wheel", markActive);
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("resize", onResize);
				document.removeEventListener("visibilitychange", onVisibility);
				document.removeEventListener("visibilitychange", onFollowVisibility);
				if (followRaf !== 0) window.cancelAnimationFrame(followRaf);
				themeObserver.disconnect();
				clearIdleMicro();
				cancelAvoid();
				swimmer.dispose();
				sounds.dispose();
				localeUnsub?.();
				cancelLater(patEndTimer);
				if (autoHideTimer !== void 0) window.clearInterval(autoHideTimer);
				hideTicker();
				ticker.remove();
				removeMini();
				root.remove();
				style.remove();
				petStyle.remove();
			};
			const removalObserver = new MutationObserver(() => {
				if (!root.isConnected) dispose();
			});
			removalObserver.observe(document.body, { childList: true });
			owner.__petWhaleDispose = dispose;
			const petApi = document;
			petApi.__petWhalePets = PETS.map((p) => ({
				id: p.id,
				zh: p.name.zh,
				en: p.name.en,
				icon: p.icon
			}));
			petApi.__petWhaleActivePet = () => activePet.id;
			petApi.__petWhaleSetPet = (id) => {
				const next = petOf(id);
				applyPet(next.id);
				syncMiniState(visualState);
				return next.id;
			};
			quitWhale = dispose;
			onVisibility();
			return dispose;
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
