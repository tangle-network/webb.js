import { load as loadTs, resolve as resolveTs } from 'ts-node/esm'
import * as tsConfigPaths from 'tsconfig-paths'
import { pathToFileURL, fileURLToPath } from 'url'
import path, { dirname } from 'path'

// A custom loader is used to register tsConfigPaths as well as
// run the typescript compiler via ts-node with its ESM.
// The below solution was found at https://github.com/TypeStrong/ts-node/discussions/1450#discussioncomment-1806115

const { absoluteBaseUrl, paths } = tsConfigPaths.loadConfig()
const matchPath = tsConfigPaths.createMatchPath(absoluteBaseUrl, paths)

export function resolve (specifier, ctx, defaultResolve) {
  const lastIndexOfIndex = specifier.lastIndexOf('/index.js')
  if (lastIndexOfIndex !== -1) {
    // Handle index.js
    const trimmed = specifier.substring(0, lastIndexOfIndex)
    const match = matchPath(trimmed)
    if (match) return resolveTs(pathToFileURL(`${match}/index.js`).href, ctx, defaultResolve)
  } else if (specifier.endsWith('.js')) {
    // Handle *.js
    const trimmed = specifier.substring(0, specifier.length - 3)
    const match = matchPath(trimmed)
    if (match) return resolveTs(pathToFileURL(`${match}.js`).href, ctx, defaultResolve)
  }
  return resolveTs(specifier, ctx, defaultResolve)
}

// specify a custom loader for node.js extension-less files
// to get mocha binary to work with ts-node esm loader: https://github.com/nodejs/node/issues/33226

export async function load(resolvedUrl, context, defaultLoad) {
  const url = new URL(resolvedUrl);
  const ext = path.extname(url.pathname);
  const parentDir = path
    .dirname(url.pathname)
    .split(path.sep)
    .at(-1);

  if (!ext && parentDir === 'bin') return await loadTs(resolvedUrl, {
    ...context,
    format: 'commonjs',
  });

  // For the types package, we should load with commonjs.
  if (url.pathname.includes('webb.js/packages/types')) {
    console.log('loading something from webb.js types: ', url.pathname);

    return await loadTs(resolvedUrl, {
      ...context,
      format: 'commonjs',
    });
  }

  const result = await loadTs(resolvedUrl, context, defaultLoad);

  return result;
}

export { transformSource } from 'ts-node/esm'
