# pet-whale 🐳

A desktop pet plugin for the DeepSeek Harness (DSH) Web UI. A small whale floats in the bottom-right corner and reacts to your agent's state in real time.

It uses the official DeepSeek whale outline, pure DOM animations, zero runtime third-party dependencies, and WebAudio-synthesized sound effects (no audio files).

## Live Preview

Open the standalone preview page to try every state and interaction:

👉 **<https://nzl153.github.io/dsh-pet-whale/preview.html>**

The repository's [preview.html](preview.html) is the same page and can be opened locally.

## Features

| Capability | Description |
|---|---|
| State machine | idle / think (diving) / working (swimming + typing + code particles) / celebrate (leaping + bubbles) / error (shaking + black lines) / disappointed (a brief slump after an error) / wait (waiting for your input); priority: error > celebrate > think > working > idle |
| Turn semantics | Never idle while a turn is running: with tools = working, without tools (text or internal reasoning) = think diving; keyboard animation sticks for 2.5s during tool-heavy phases |
| Interactions | Click to poke, double-click 360° flip, drag with >_< eyes, right-click quick menu, mouse-follow eyes, 20s idle sleep |
| Quick menu & settings | Right-click opens a compact 5-item quick menu; "More settings" opens a grouped panel (appearance / behavior / rest) that scales as features grow |
| Pretend work | "Pretend to work" mode keeps the typing animation on; preference is persisted |
| Think ticker | While thinking, the latest reasoning text scrolls above the whale (can be toggled) |
| Smart avoidance | In idle, the whale moves aside when the cursor lingers nearby; grabbing/right-click cancels and cools down for 8s |
| Theme sync | Follows DSH light/dark theme for bubbles, dialogs, and shadows |
| Background power saving | Animations, sounds, and the think ticker pause when the page is hidden |
| Idle micro-movements | Random swimming, looking around, and bubble blowing |
| Error care | Click the whale during error state to copy the error text |
| Skins | 7 built-in palettes (default Theme Blue), extensible by adding one line in `src/client/palettes.ts` |
| Multiple pets | Right-click → "Appearance → 🐾 Pet" to switch between the whale, a cat and Ling'er; the choice persists. Each pet ships its own SVG, its own animation stylesheet and **its own lines** (the cat does not talk about diving), so they never interfere, while palettes and size stay shared. Humanoid pets can declare a portrait box via `size` (Ling'er is 87×160). Adding a pet = one new folder under `src/client/pets/<id>/` plus one registry line — see [docs/MULTI-PET.md](docs/MULTI-PET.md) |
| Idle micro-actions | Pets declare what they can perform while idle (`micro: ['spin', 'spell', …]`); the plugin shuffles through them and may pair a short line (`i18n.micro[id]`). Ling'er uses this when sword flight is off (a full turn on the spot, casting a spell with the formation ring under her feet, fanning herself with a folding fan, gazing afar…). Adding an action = declare an id + write one one-shot keyframes block |
| Hide/recall | Hide to a small 🐳 button; state persists across refresh |
| Scheduled hide | Hide after 1 hour or every day at 22:00 |
| Free swimming | Toggle "Swim" to let the whale roam the page along cubic Bezier paths, with banking, adaptive flipping, depth dives, wake ripples, and splashes; it yields while the agent is busy, and the preference is persisted |
| Poke escalation | Pokes 1-2 get the usual squish, 3-5 make it lean away annoyed, 6+ turn it away with an angry brow; the streak decays after 2.6s of no poking, and it drops the mood the moment the agent starts working |
| Comforting | Poking during the post-error disappointed state counts as comfort: a happy animation, a warm line, and the sulk ends early |
| Finish alert | When a turn completes while you are on another tab, the tab title becomes "✅ Done · <original>" and restores when you come back; an optional system notification is off by default and only asks for permission when you enable it |
| Break reminder | Set 45 / 60 / 90 minutes and the whale surfaces with a spout to nudge you; off by default, and leaving the page for over 10 minutes counts as a rest and resets the timer |
| Bond level | Interactions, completed turns and days together all feed one score, split into three tiers: Acquainted / Close / Inseparable. The tier changes poke lines and greetings, and at Inseparable the whale occasionally speaks up on its own; it announces each promotion, and the current tier and progress show up under Companion Stats |
| Shake dizzy | Grab it and swing it left and right - four direction changes within a second make it dizzy: the eyes go @@, it begs you to stop, and the body keeps wobbling after you let go; hand tremor and slow back-and-forth do not count. It stays woozy for the next dozen seconds too, with a visibly crooked swim path |
| Edge squish | Push it against a screen edge and it flattens against the glass; it springs back once you move away |
| Held too long | Hold it in midair for over 2 seconds and it starts squirming to ask if you are still there; moving stops the nagging |
| Belly up | The double-click reaction follows your bond: normally a 360 spin, but at Inseparable it rolls over and shows you its belly |
| Custom size | Right-click - Appearance - Size cycles through Small / Standard / Large / Huge (0.8x - 1.6x). Scaling also moves the collision bounds, splash origins and edge detection, not just the visual |
| Localization | Full Chinese and English copy, following the DSH locale service automatically; the standalone preview page detects the browser language and can be overridden manually |
| Stats | The settings panel keeps running counts of completions, interactions, errors, and days spent together |
| Sound | WebAudio-synthesized sounds, can be muted |
| Accessibility | Respects `prefers-reduced-motion` |

## i18n

- Chinese and English UI strings.
- In DSH, it follows the DSH language setting automatically.
- In the standalone preview, it follows the browser language and can be switched manually.

## Install

Requires DSH `>=0.1.5-alpha.2 <0.2.0` (web profile) and Node.js `^22.19.0 || >=24.0.0`.

| DSH release | Status | Basis |
|---|---|---|
| `0.1.5-rc.2` | compatible | Ran on a real host: new session, tool call, plain-text turn — zero console errors, `idle → think → working → celebrate → idle` all fired, and celebrate self-expires back to idle after 2.5s (no next message needed to unstick it) |
| `0.1.5-rc.1` | compatible | Not run. Per-file npm comparison: `dsh-api-session-controller`, `dsh-client-ui-conversation`, `dsh-client-locale`, `dsh-client-modules`, `dsh-cordis-client-runner` are **byte-identical** to rc.2; `dsh-client-ui-chat` differs only by a 15-character CSS tweak unrelated to the `legacy` projection this plugin reads |
| `0.1.5-alpha.2` | compatible | Not run. Same as above; the only difference is a doc-string line number (`contract.ts:23` → `:24`) in `dsh-cordis-client-runner` |

The previous 1.1.0 threw `TypeError: Cannot read properties of undefined (reading 'length')` on every session-snapshot
update under 0.1.5. The field-by-field mapping and the fix are documented at the top of `src/client/state.ts`.

```sh
# Local directory install (the repo already contains built lib/, no build needed)
dsh plugin --profile web add link:/path/to/pet-whale

# Or install directly from Git
dsh plugin --profile web add "github:nzl153/pet-whale#main"
```

After installation, restart `dsh web` (the host half is composed at startup; only host-side changes require a restart).
Client-side development changes do not require a restart or hard refresh — see "Development / Hot Reload" below.

## Build & Test

```sh
pnpm install
pnpm typecheck   # TypeScript type check
pnpm dev           # dev watch: rebuild lib/client.js on src/client changes; DSH HMR applies it automatically
pnpm build       # tsdown → lib/index.mjs + lib/client.js
pnpm test        # jsdom smoke test (state machine / interactions / skins / cleanup)
pnpm verify:hmr    # verify local repo <-> running DSH HMR wiring
```

## Development

- `src/client/palettes.ts` — palette extension point. Add one line for a new skin.
- `src/client/pets/` — pet extension point. A pet is one folder plus one line in `pets/index.ts`;
  `pets/cat/` is the minimal example to copy.
- `src/client/i18n.ts` + `pets/<id>/text.ts` — text extension point. The base strings are written in the
  whale's voice; a pet overrides just the entries it wants via `PetModule.text`.
- `preview.html` — hand-written interactive playground (pet/state switching, feed, roll, eye tracking,
  roaming). Its V1/V2 blocks are the whale's design source and the input of `extract-whale.mjs`; other pets
  are injected by `pnpm sync:preview` (`?pet=cat`, `?pet=linger` open a pet directly).
- `scripts/preview-pets.mjs` — generated check sheet (`pnpm preview`): every pet × every state in one grid.
- `scripts/extract-whale.mjs` — sync the V2 SVG from `preview.html` into `src/client/whale.ts`
  (run `git diff src/client/whale.ts` afterwards to confirm nothing else moved).
- `scripts/doctor.mjs` — fork health check (`pnpm pet:doctor`): base CSS free of pet rules, pets registered,
  preview page and `whale.ts` in sync, build artifact fresh. Run it after merging upstream.
- Merging upstream updates into this fork: see [docs/UPSTREAM-SYNC.md](docs/UPSTREAM-SYNC.md).
- `scripts/verify-live.mjs` — one-click live verification after restart.
- State source (dsh 0.1.5): session lifecycle comes from the `ctx.sessions` snapshot
  (`running` / `lastAgentError` / `openError`); `partial` / `runningCalls` / `turnEnds` come from the
  chat projection on `ctx.uiConversation` (`ChatSnapshot.legacy`). The field-by-field mapping lives at the
  top of `src/client/state.ts`.

### Hot Reload

Prerequisite: the DSH web profile installs this repo via `link:` (not a static GitHub/npm copy), and DSH `>=0.1.5-alpha.2`.

```sh
pnpm dev
```

`pnpm dev` watches `src/` and rebuilds `lib/client.js` (and the host half `lib/index.mjs`).
The built-in `@deepseek-ai/dsh-client-hmr` polls for rebuilds and broadcasts through `/plugins/events`;
the browser invalidates and reloads this plugin automatically. **Client-only changes do not require a DSH restart or a page refresh.**

- Hot-reloadable: `src/client/**` UI, styles, state machine, interactions.
- Still requires a DSH restart:
  - changes to `package.json` `dsh.client` / `dsh.bundle` / `exports` structure
  - `cordis.patch.yml` or host half `src/index.mjs` composition changes
  - installing/uninstalling dependencies, upgrading DSH, changing the profile bundle list
- Verify wiring with DSH running: `pnpm verify:hmr`.
- Common commands:
  - `pnpm dev` / `pnpm dev:client` — dev watch (currently equivalent; `dev:client` names the client hot-reload target)
  - `pnpm build` — one-shot full build before committing
  - `pnpm typecheck` / `pnpm test` — type check and smoke tests

## Notice

- The `灵儿 / Ling'er` pet is **non-commercial fan work**. Its character reference is
  **Zhao Ling'er** from *The Legend of Sword and Fairy* (Softstar / 大宇资讯). It was re-drawn
  from scratch as hand-written SVG with **no game assets** extracted or redistributed, and it
  **must not be used commercially**. This repository is unaffiliated with and unendorsed by the
  rights holder, the upstream plugin author, and the DSH project. See [NOTICE.md](NOTICE.md).
- The whale silhouette uses DeepSeek's official FishLogo path (brand asset — credit the source).
- Interaction design was inspired by [whale-girl](https://github.com/vlln/whale-girl) (MIT).

## Community forks

The whale itself is maintenance-first (see [CONTRIBUTING.md](CONTRIBUTING.md)). If you want more,
take a look at these forks:

- [wzwei1990/dsh-pet-whale](https://github.com/wzwei1990/dsh-pet-whale) — multi-pet architecture
  (switch between the whale, a cat and Ling'er, each with its own SVG, animations and lines),
  plus a `pnpm pet:doctor` health-check script

These forks are maintained independently and are not affiliated with this repository. Please read
their own documentation before using them.

## License

[MIT](LICENSE)
