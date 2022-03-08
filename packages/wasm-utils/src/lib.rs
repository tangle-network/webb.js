#![allow(dead_code)]

extern crate ark_ff;
extern crate wasm_bindgen;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod note;
pub mod proof;
pub mod types;
mod utils;

use arkworks_setups::r1cs::mixer::MixerR1CSProver;
use arkworks_setups::r1cs::anchor::AnchorR1CSProver;
use ark_bls12_381::Bls12_381;
use ark_bn254::Bn254;

pub const DEFAULT_LEAF: [u8; 32] = [0u8; 32];
const TREE_HEIGHT: usize = 30;
const ANCHOR_COUNT: usize = 2;

pub type MixerR1CSProverBn254_30 = MixerR1CSProver<Bn254, TREE_HEIGHT>;
pub type MixerR1CSProverBls381_30 = MixerR1CSProver<Bls12_381, TREE_HEIGHT>;

pub type AnchorR1CSProverBn254_30_2 = AnchorR1CSProver<Bn254, TREE_HEIGHT, ANCHOR_COUNT>;
pub type AnchorR1CSProverBls381_30_2 = AnchorR1CSProver<Bls12_381, TREE_HEIGHT, ANCHOR_COUNT>;