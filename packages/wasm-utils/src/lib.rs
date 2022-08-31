#![allow(dead_code)]
#![allow(clippy::unused_unit)]

extern crate ark_ff;
extern crate core;
extern crate wasm_bindgen;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod note;
pub mod proof;
pub mod types;
mod utils;
mod utxo;

use ark_bls12_381::Bls12_381;
use ark_bn254::Bn254;
use arkworks_setups::r1cs::mixer::MixerR1CSProver;
use arkworks_setups::r1cs::vanchor::VAnchorR1CSProver;

pub const ZERO_LEAF: [u8; 32] = [0u8; 32];
pub const DEFAULT_LEAF: [u8; 32] = [
	108, 175, 153, 72, 237, 133, 150, 36, 226, 65, 231, 118, 15, 52, 27, 130, 180, 93, 161, 235, 182, 53, 58, 52, 243,
	171, 172, 211, 96, 76, 229, 47,
];
pub const TREE_HEIGHT: usize = 30;
pub const ANCHOR_COUNT: usize = 2;

pub const ANCHOR_COUNT_2: usize = 2;
pub const ANCHOR_COUNT_16: usize = 16;
pub const ANCHOR_COUNT_32: usize = 32;

const INS_16: usize = 16;
const INS_2: usize = 2;
const OUTS_2: usize = 2;

pub type MixerR1CSProverBn254_30 = MixerR1CSProver<Bn254, TREE_HEIGHT>;
pub type MixerR1CSProverBls381_30 = MixerR1CSProver<Bls12_381, TREE_HEIGHT>;

pub type VAnchorR1CSProverBn254_30_2_2_2 = VAnchorR1CSProver<Bn254, TREE_HEIGHT, ANCHOR_COUNT_2, INS_2, OUTS_2>;
pub type VAnchorR1CSProverBn254_30_2_16_2 = VAnchorR1CSProver<Bn254, TREE_HEIGHT, ANCHOR_COUNT_2, INS_16, OUTS_2>;
pub type VAnchorR1CSProverBn254_30_16_2_2 = VAnchorR1CSProver<Bn254, TREE_HEIGHT, ANCHOR_COUNT_16, INS_2, OUTS_2>;
pub type VAnchorR1CSProverBn254_30_16_16_2 = VAnchorR1CSProver<Bn254, TREE_HEIGHT, ANCHOR_COUNT_16, INS_16, OUTS_2>;
