// 公共样式（BASE_CSS）：与"哪只宠物"无关的部分——根变量与尺寸总闸、地面阴影、
// 水流尾波、右下角召回小按钮、思考滚动条、台词气泡框、投喂、打瞌睡、右键菜单、
// 固定粒子层与水纹特效，以及全部 @keyframes。
//
// 宠物私有的部件样式与状态动画放在 src/client/pets/<id>/styles.ts，由 pets/index.ts 注册；
// 运行时只有"当前宠物"那一张会挂上（见 index.ts 的 applyPet），所以宠物之间天然不会互相干扰。
// 注意：本文件里的 @keyframes pw-* 是鲸鱼与公共特效在用的；新宠物请用自己的前缀（如 cat-*）写在自己的表里。
export const BASE_CSS = `
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
`
