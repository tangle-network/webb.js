#![allow(dead_code)]

extern crate ark_ff;
extern crate arkworks_circuits;
extern crate arkworks_utils;
extern crate wasm_bindgen;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod note;
pub mod proof;
pub mod types;
mod utils;
