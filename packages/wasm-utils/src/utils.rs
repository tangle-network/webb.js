use wasm_bindgen::JsValue;

pub fn to_rust_string<T: Into<JsValue>>(js_castable: T) -> String {
	let js_value: JsValue = js_castable.into();
	js_value.as_string().unwrap()
}
