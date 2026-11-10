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
  {
    // Live2D 渲染器的**独立可执行副本**：只给本地联调页（scripts/live2d-check.html）用，
    // 让「不装进 DSH 也能验证渲染链路」这件事成立。正式路径仍然走上面的 client bundle。
    name: 'pet-whale/live2d-runtime',
    entry: { 'live2d-runtime': 'src/client/pets/live2d/runtime.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'browser',
    dts: false,
    clean: false,
    outputOptions: { entryFileNames: 'live2d-runtime.mjs' },
  },
]
