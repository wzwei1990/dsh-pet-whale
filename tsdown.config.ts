/** pet-whale 双 half 构建：Node（esm）+ 官方 client bundle（cjs，__ModuleLoader__ 契约）。 */

export default [
  {
    entry: ['src/index.mjs'],
    format: 'esm',
    platform: 'node',
    target: 'es2024',
    outDir: 'lib',
    clean: true,
  },
  {
    // 状态机单独出一份，供 Node 单测（卡死兜底 / 瞬态回落）
    name: 'pet-whale/state',
    entry: { state: 'src/client/state.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'neutral',
    dts: false,
    clean: false,
    outputOptions: { entryFileNames: 'state.mjs' },
  },
  {
    // 纯逻辑模块单独出一份，供 Node 单测直接 import（不打进 client bundle 也行得通）
    name: 'pet-whale/pick',
    entry: { pick: 'src/client/pets/sprite/pick.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'neutral',
    dts: false,
    clean: false,
    outputOptions: { entryFileNames: 'pick.mjs' },
  },
  {
    name: 'pet-whale/multi',
    entry: { multi: 'src/client/multi.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'neutral',
    dts: false,
    clean: false,
    outputOptions: { entryFileNames: 'multi.mjs' },
  },
  {
    name: 'pet-whale/client',
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    clean: false,
    deps: { neverBundle: [/^@deepseek-ai\//] },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "pet-whale", factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
]
