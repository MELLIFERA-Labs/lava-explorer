import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import Layouts from 'vite-plugin-vue-layouts';
import DefineOptions from 'unplugin-vue-define-options/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Pages from 'vite-plugin-pages';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import inject from '@rollup/plugin-inject';
// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  define: {
    'process.env': {}
  },
  plugins: [
      vue(),
    // vue({
    //   template: {
    //     compilerOptions: {
    //       isCustomElement: (tag) =>
    //         [
    //           'ping-connect-wallet',
    //           'ping-token-convert',
    //           'ping-tx-dialog',
    //         ].includes(tag),
    //     },
    //   },
    // }),
    vueJsx(),
    Pages({
      dirs: ['./src/modules', './src/pages'],
      exclude: ['**/*.ts'], // only load .vue as modules
    }),
    Layouts({
      layoutsDirs: './src/layouts/',
    }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        '@vueuse/core',
        '@vueuse/math',
        'vue-i18n',
        'pinia',
      ],
      vueTemplate: true,
    }),
    VueI18nPlugin({
      runtimeOnly: true,
      compositionOnly: true,
      include: [
        fileURLToPath(
            new URL('./src/plugins/i18n/locales/**', import.meta.url)
        ),
      ],
    }),
    DefineOptions(),
      process.env.NODE_ENV !== 'production' && inject({ Buffer: ['buffer', 'Buffer'] }),
    {...nodePolyfills(), enforce: 'post'}
  ],
  build: {
    rollupOptions: {
      external: ['regex'],
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log'], // Remove specific function calls
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'regex': './node_modules/regex/dist/regex.min.js'
    },
  },
  optimizeDeps: {
    entries: ['./src/**/*.vue'],
  },
});
