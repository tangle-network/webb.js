use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

extern "C" {}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct DepositNote {
	pub prefix: u32,
}
