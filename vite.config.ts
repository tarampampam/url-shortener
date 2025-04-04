/// <reference types="vite/client" />

import { readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { defineConfig, type ESBuildOptions, type PluginOption, type UserConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// resolve project root directory
const rootDir = resolve(__dirname)

// define paths for static and dist directories
const [staticDir, distDir] = [join(rootDir, 'static'), join(rootDir, 'dist')]

// define paths for server source and output directories
const [serverSrcDir, serverDistDir] = [join(rootDir, 'src', 'server'), join(distDir, 'server')]

// define paths for client source and output directories
const [clientSrcDir, clientDistDir] = [join(rootDir, 'src', 'client'), join(distDir, 'client')]

// check if the --watch flag is present in CLI arguments
const isWatchMode = ['--watch'].some((arg) => process.argv.slice(2).some((a) => a.indexOf(arg) !== -1))

// declare supported environment variables
enum EnvVars {
  PROJECT_NAME = 'PROJECT_NAME',
  KV_ID = 'KV_ID',
  AUTH_TOKEN = 'AUTH_TOKEN',
}

// vite plugin to dynamically modify and copy wrangler.json
const copyWranglerPlugin: PluginOption = {
  name: 'copy-wrangler',

  // log environment variable info once the config is resolved
  configResolved(config): void {
    config.logger.info(
      [
        'The following environment variables can be used to customize the build:',
        ...Object.values(EnvVars).map((s) => ` - ${s}`),
      ]
        .map((s) => '🏁 ' + s)
        .join('\n'),
      { clear: true }
    )
  },

  // modify and write wrangler.json after build output is written
  writeBundle(): void {
    const env: typeof process.env & Partial<Record<EnvVars, string>> = process.env

    // read and parse wrangler.json
    const config: {
      name?: string
      main?: string
      kv_namespaces: Array<{ binding: string; id: string }>
      assets: { directory: string }
      vars: Record<'AUTH_TOKEN', string>
    } = JSON.parse(readFileSync(join(rootDir, 'wrangler.json'), 'utf-8'))

    // override config values with environment vars if available
    config.name = env.PROJECT_NAME ?? config.name ?? 'url-shortener'
    config.main = ['.', 'server', 'worker.js'].join('/')
    config.kv_namespaces[0].id = env.KV_ID ?? config.kv_namespaces[0].id ?? 'SET_ME'
    config.assets.directory = ['.', 'client'].join('/')
    config.vars.AUTH_TOKEN = env.AUTH_TOKEN ?? config.vars.AUTH_TOKEN ?? 'SET_ME'

    // write the modified config to the dist directory
    writeFileSync(join(distDir, 'wrangler.json'), JSON.stringify(config, null, 2), { flag: 'w' })
  },
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }): UserConfig => {
  const esbuild: ESBuildOptions = {
    legalComments: 'none', // suppress esbuild license comments
  }

  switch (command) {
    case 'build':
      switch (mode) {
        // server build config for worker (vite build --mode server)
        case 'server':
          return {
            plugins: [copyWranglerPlugin],
            root: serverSrcDir,
            build: {
              emptyOutDir: !isWatchMode,
              lib: {
                entry: join(serverSrcDir, 'main.ts'),
                formats: ['es'],
              },
              outDir: serverDistDir,
              rollupOptions: {
                output: {
                  entryFileNames: 'worker.js',
                },
              },
              sourcemap: isWatchMode,
            },
            esbuild,
          }

        // client build config for browser (vite build --mode client)
        case 'client':
          return {
            plugins: [
              svelte({ preprocess: vitePreprocess() }),
              createHtmlPlugin({ minify: !isWatchMode }),
              !isWatchMode ? viteSingleFile({ removeViteModuleLoader: true }) : null,
            ].filter(Boolean),
            root: clientSrcDir,
            publicDir: staticDir,
            build: {
              emptyOutDir: !isWatchMode,
              outDir: clientDistDir,
              rollupOptions: {
                input: join(clientSrcDir, 'index.html'),
                output: {
                  chunkFileNames: 'assets/[name]-[hash].js',
                  assetFileNames: 'assets/[name]-[hash].[ext]',
                },
              },
              sourcemap: isWatchMode,
            },
            esbuild,
          }
      }

      // throw if unknown mode is passed during build
      throw new Error('Unknown build mode')
  }

  // return empty config for non-build commands
  return {}
})
