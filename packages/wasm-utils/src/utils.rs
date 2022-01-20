use ark_ff::PrimeField;
use arkworks_utils::poseidon::PoseidonParameters;
use arkworks_utils::utils::common::{setup_params_x5_3, setup_params_x5_5, Curve};
use wasm_bindgen::JsValue;

pub fn get_hash_params_x5<T: PrimeField>(curve: Curve) -> (PoseidonParameters<T>, PoseidonParameters<T>) {
	(setup_params_x5_3::<T>(curve), setup_params_x5_5::<T>(curve))
}
pub fn to_rust_string<T: Into<JsValue>>(js_castable: T) -> String {
	let js_value: JsValue = js_castable.into();
	js_value.as_string().unwrap()
}
