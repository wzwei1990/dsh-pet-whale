// 灵儿（4.3 头身仙侠少女）：手写内联 SVG，结构约定与鲸鱼/猫完全一致（见 pets/types.ts）。
//
// 比例：画布 26×48，头高约 10.4 单位，人物约 4.3 头身（上一版是 3 头身，与参考图差距主要在比例）。
//       容器 size 由 index.ts 声明（26:48 的长宽比要一致）。
//
// 造型（对着参考图逐项对齐）：
//   发型：黑长发中分 + 平顺齐刘海；两侧偏外的双丫髻（绑出来的小发环）+ 蓝发绳与垂下的蓝丝带；
//         鬓发；搭在肩前、垂到腰际的长发；背后的及臀长发
//   服装：白色交领内衬（领口白色一路露到腰带）＋ 蓝色外袍（开口到腰带、浅色滚边）＋
//         大广袖（白、袖口蓝滚边、袖下露手）＋ 红色细腰带打结、两条细红飘带垂到裙中段
//   裙：白为主，蓝只做两侧窄片 + 裙摆滚边；浅蓝布鞋露在摆下
//   配色：--pw-body 蓝 / --pw-body-light 浅蓝 / --pw-body-dark 描边 / --pw-blush 红；
//         白袍固定白（专属变量 --pw-robe/--pw-robe-shade）
//
// 契约部件：.body / .eye-group(.eye/.pupil-highlight/.caught-eyes/.sleep-eyes/.dizzy-eyes/.angry-eyes)
//          / .angry / .stars(.starL/.starR) / .spout-group / .code-particle(.code-fx1/.code-fx2)
//          / .keyboard-unit(.tap-k1/.tap-k2) + 结尾 6 个气泡 span
// 专属部件：.sash / .skirt / .hair / .hair-front / .ribbon / .hand-seal / .sword
export const LINGER_HTML = `<svg viewBox="0 0 26 48" aria-hidden="true">
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
        <span class="bubble-blue bb3"></span>`
