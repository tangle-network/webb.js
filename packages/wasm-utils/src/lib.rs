#![allow(dead_code)]

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod note;
pub mod proof;
pub mod types;
mod utils;

#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;
