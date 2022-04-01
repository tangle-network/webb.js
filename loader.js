import { load as loadTs, resolve as resolveTs } from 'ts-node/esm'
import * as tsConfigPaths from 'tsconfig-paths'
import { pathToFileURL } from 'url'
import path from 'path'

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

// export function resolve (specifier, ctx, defaultResolve) {
//   const match = matchPath(specifier)
//   return match
//     ? resolveTs(pathToFileURL(`${match}`).href, ctx, defaultResolve)
//     : resolveTs(specifier, ctx, defaultResolve)
// }

// specify a custom loader for node.js extension-less files
// to get mocha binary to work with ESM: https://github.com/nodejs/node/issues/33226

export async function load(resolvedUrl, context, defaultLoad) {
  console.log('inside loader');
  const url = new URL(resolvedUrl);
  const ext = path.extname(url.pathname);
  const parentDir = path
    .dirname(url.pathname)
    .split(path.sep)
    .at(-1);

  if (!ext && parentDir === 'bin') return loadTs(resolvedUrl, {
    ...context,
    format: 'commonjs',
  });

  return loadTs(resolvedUrl, context, defaultLoad);
}

export { transformSource } from 'ts-node/esm'
