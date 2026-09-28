// 小猫：手写内联 SVG，用来验证"每只宠物自带 SVG + 自带动画"的扩展方式。
// 与鲸鱼同样的结构约定（详见 pets/types.ts 与 docs/MULTI-PET.md）：
//   .body / .tail / .eye-group（.eye / .pupil-highlight / .caught-eyes / .sleep-eyes /
//   .dizzy-eyes / .angry-eyes）/ .angry / .stars(.starL/.starR) / .spout-group /
//   .code-particle(.code-fx1/.code-fx2) / .keyboard-unit(.tap-k1/.tap-k2)
// 结尾那 6 个 .bubble / .bubble-blue 是 HTML span（绝对定位在容器上），与鲸鱼一致。
// 上色只用 CSS 变量，因此 palettes.ts 的 7 套配色对它同样生效。
export const CAT_HTML = `<svg viewBox="0 0 26 19" aria-hidden="true">
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
        <span class="bubble-blue bb3"></span>`
