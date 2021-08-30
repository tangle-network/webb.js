import { Webbcircomlib } from './webb-circomlib.js';
const hash = Webbcircomlib.pedersenHash(new Uint8Array(32));
console.log(hash.toString());
