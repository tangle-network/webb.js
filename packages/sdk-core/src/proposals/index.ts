/*
 * Copyright 2022-2023 Webb Technologies Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Flags used to indicate the type of encoding to be used
// in various encoding functions.
//
// For example: `const nonce = new DataView(bytes.buffer).getUint32(36, BE);`
export const LE = true;
export const BE = false;

export * from './ProposalHeader.js';
export * from './ResourceId.js';
export * from './ProposalKinds.js';
