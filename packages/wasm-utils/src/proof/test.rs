use ark_bn254::Bn254;
use ark_ff::{BigInteger, PrimeField};
use arkworks_setups::common::{setup_keys_unchecked, verify_unchecked_raw};
use arkworks_setups::Curve;
use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::JsValue;
use wasm_bindgen_test::*;

use crate::proof::test_utils::{
	generate_mixer_test_setup, generate_vanchor_test_setup_16_mixed_inputs,
	generate_vanchor_test_setup_16_non_default_inputs, generate_vanchor_test_setup_2_inputs, new_utxo_bn254_2_2,
	MixerTestSetup, VAnchorTestSetup, DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_V1_X5_5, generate_vanchor_utxo,
};
use crate::proof::{generate_proof_js, truncate_and_pad, JsProofInputBuilder, LeavesMapInput, MTBn254X5};
use crate::types::{Indices, Leaves, };
use crate::utxo::JsUtxo;
use crate::{VAnchorR1CSProverBn254_30_2_2_2, DEFAULT_LEAF};

const TREE_DEPTH: usize = 30;

#[wasm_bindgen_test]
fn mixer_js_setup() {
	let MixerTestSetup {
		relayer,
		recipient,
		proof_input_builder,
		leaf_bytes,
		..
	} = generate_mixer_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_V1_X5_5);

	let truncated_substrate_relayer_address = truncate_and_pad(&relayer);
	let truncated_substrate_recipient_address = truncate_and_pad(&recipient);

	let proof_input = proof_input_builder.build().unwrap();
	let mixer_input = proof_input.mixer_input().unwrap();

	assert_eq!(
		hex::encode(mixer_input.recipient),
		hex::encode(&truncated_substrate_recipient_address)
	);
	assert_eq!(
		hex::encode(mixer_input.relayer),
		hex::encode(&truncated_substrate_relayer_address)
	);

	assert_eq!(mixer_input.refund, 1);
	assert_eq!(mixer_input.fee, 5);

	assert_eq!(mixer_input.leaf_index, 0);
	assert_eq!(hex::encode(&mixer_input.leaves[0]), hex::encode(leaf_bytes));
}

#[wasm_bindgen_test]
fn generate_mixer_proof() {
	let MixerTestSetup {
		proof_input_builder,
		vk,
		..
	} = generate_mixer_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_V1_X5_5);

	let proof_input = proof_input_builder.build_js().unwrap();
	let proof = generate_proof_js(proof_input).unwrap().mixer_proof().unwrap();

	let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
	assert!(is_valid_proof);
}

#[wasm_bindgen_test]
fn should_generate_vanchor_proof_input() {
	let vanchor_utxo = generate_vanchor_utxo(10, 0, Some(0));
	let protocol = JsValue::from("vanchor").into();
	let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

	let leaf = vanchor_utxo.commitment();
	let leaves: Array = vec![leaf].into_iter().collect();

	let mut leaves_map = LeavesMapInput::new();
	leaves_map
		.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
		.unwrap();

	let indices: Array = vec![JsValue::from("0"), JsValue::from("0")].into_iter().collect();
	let roots: Array = vec![
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
	]
	.into_iter()
	.collect();
	proof_input_builder.set_leaves_map(leaves_map).unwrap();

	proof_input_builder
		.set_indices(Indices::from(JsValue::from(indices)))
		.unwrap();
	proof_input_builder
		.set_roots(Leaves::from(JsValue::from(roots)))
		.unwrap();

	proof_input_builder.set_pk(JsString::from("0000")).unwrap();
	proof_input_builder.public_amount(JsString::from("10")).unwrap();
	proof_input_builder.chain_id(JsString::from("0")).unwrap();
	proof_input_builder.set_ext_data_hash(JsString::from("1111")).unwrap();

	let input_utxos: Array = vec![JsValue::from(vanchor_utxo.clone())].into_iter().collect();

	let output_1 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 10, 0);
	let output_2 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 10, 3);

	proof_input_builder.set_input_utxos(input_utxos).unwrap();
	proof_input_builder.set_output_utxos(output_1, output_2).unwrap();
	let proof_builder = proof_input_builder.build_js().unwrap();
	let vanchor_proof_input_payload = proof_builder.inner.vanchor_input().unwrap();
	assert_eq!(vanchor_proof_input_payload.public_amount, 10);
	assert_eq!(vanchor_proof_input_payload.chain_id, 0);
	assert_eq!(vanchor_proof_input_payload.indices, [0u64, 0u64].to_vec());
	assert_eq!(
		hex::encode(&vanchor_proof_input_payload.roots[0]),
		hex::encode([0u8; 32].to_vec())
	);
	assert_eq!(vanchor_proof_input_payload.roots.len(), 2);
	assert_eq!(
		vanchor_proof_input_payload.backend.to_string(),
		"Arkworks"
	);
	assert_eq!(vanchor_proof_input_payload.exponentiation, 5);
	assert_eq!(vanchor_proof_input_payload.width, 3);
	assert_eq!(
		vanchor_proof_input_payload.curve.to_string(),
		"Bn254"
	);
	assert_eq!(hex::encode(vanchor_proof_input_payload.pk), "0000");
}

#[wasm_bindgen_test]
fn should_fail_to_generate_vanchor_proof_input_with_invalid_amounts() {
	let vanchor_utxo_str: String = generate_vanchor_utxo(15, 0, Some(0)).serialize().into();
	let protocol = JsValue::from("vanchor").into();
	let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

	let utxo = JsUtxo::deserialize(&vanchor_utxo_str).unwrap();
	let leaf = utxo.commitment();
	let leaves: Array = vec![leaf].into_iter().collect();

	let mut leaves_map = LeavesMapInput::new();
	leaves_map
		.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
		.unwrap();

	let indices: Array = vec![JsValue::from("0"), JsValue::from("0")].into_iter().collect();
	let roots: Array = vec![
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
	]
	.into_iter()
	.collect();
	proof_input_builder.set_leaves_map(leaves_map).unwrap();

	proof_input_builder
		.set_indices(Indices::from(JsValue::from(indices)))
		.unwrap();
	proof_input_builder
		.set_roots(Leaves::from(JsValue::from(roots)))
		.unwrap();

	proof_input_builder.set_pk(JsString::from("0000")).unwrap();
	proof_input_builder.public_amount(JsString::from("10")).unwrap();
	proof_input_builder.chain_id(JsString::from("0")).unwrap();
	proof_input_builder.set_ext_data_hash(JsString::from("1111")).unwrap();

	let input_utxos: Array = vec![JsValue::from(utxo.clone())].into_iter().collect();

	let output_1 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 10, 0);
	let output_2 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 10, 0);

	proof_input_builder.set_input_utxos(input_utxos).unwrap();
	proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

	let proof_builder = proof_input_builder.build();
	let mut message = "".to_string();
	if let Err(e) = proof_builder {
		message = e.error_message
	}
	let expected_error_message = "Output amount and input amount don't match input(25) != output(20)".to_string();
	assert_eq!(message, expected_error_message)
}

#[wasm_bindgen_test]
fn should_fail_to_generate_vanchor_proof_input_with_inconsistent_notes_chain_id() {
	let utxo1 = generate_vanchor_utxo(15, 0, Some(0));
	let utxo2 = generate_vanchor_utxo(15, 1, Some(1));
	let protocol = JsValue::from("vanchor").into();
	let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

	let leaf1 = utxo1.commitment();
	let leaf2 = utxo2.commitment();
	let leaves: Array = vec![leaf1, leaf2].into_iter().collect();

	let mut leaves_map = LeavesMapInput::new();
	leaves_map
		.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
		.unwrap();

	let indices: Array = vec![JsValue::from("0"), JsValue::from("1")].into_iter().collect();
	let roots: Array = vec![
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
	]
	.into_iter()
	.collect();
	proof_input_builder.set_leaves_map(leaves_map).unwrap();

	proof_input_builder
		.set_indices(Indices::from(JsValue::from(indices)))
		.unwrap();
	proof_input_builder
		.set_roots(Leaves::from(JsValue::from(roots)))
		.unwrap();

	proof_input_builder.set_pk(JsString::from("0000")).unwrap();
	proof_input_builder.public_amount(JsString::from("10")).unwrap();
	proof_input_builder.chain_id(JsString::from("0")).unwrap();
	proof_input_builder.set_ext_data_hash(JsString::from("1111")).unwrap();

	let input_utxos: Array = vec![JsValue::from(utxo1.clone()), JsValue::from(utxo2.clone())]
		.into_iter()
		.collect();

	let output_1 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 10, 0);
	let output_2 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 10, 3);

	proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

	proof_input_builder.set_input_utxos(input_utxos).unwrap();
	let proof_builder = proof_input_builder.build();
	let mut message = "".to_string();
	if let Err(e) = proof_builder {
		message = e.error_message
	}
	let expected_error_message =
		"Invalid UTXOs: utxo indices has invalid chain_id [1], non-default utxos with an duplicate index []"
			.to_string();
	assert_eq!(message, expected_error_message)
}

#[wasm_bindgen_test]
fn should_fail_to_generate_vanchor_proof_input_with_inconsistent_notes_indices() {
	let utxo1 = generate_vanchor_utxo(15, 0, Some(0));
	let utxo2 = generate_vanchor_utxo(15, 1, Some(0));
	let protocol = JsValue::from("vanchor").into();
	let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

	let leaves: Array = vec![utxo1.commitment(), utxo2.commitment()].into_iter().collect();

	let mut leaves_map = LeavesMapInput::new();
	leaves_map
		.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
		.unwrap();

	let indices: Array = vec![JsValue::from("0"), JsValue::from("1")].into_iter().collect();
	let roots: Array = vec![
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
	]
	.into_iter()
	.collect();
	proof_input_builder.set_leaves_map(leaves_map).unwrap();

	proof_input_builder
		.set_indices(Indices::from(JsValue::from(indices)))
		.unwrap();
	proof_input_builder
		.set_roots(Leaves::from(JsValue::from(roots)))
		.unwrap();

	proof_input_builder.set_pk(JsString::from("0000")).unwrap();
	proof_input_builder.public_amount(JsString::from("10")).unwrap();
	proof_input_builder.chain_id(JsString::from("0")).unwrap();
	proof_input_builder.set_ext_data_hash(JsString::from("1111")).unwrap();

	let input_utxos: Array = vec![JsValue::from(utxo1.clone()), JsValue::from(utxo2.clone())]
		.into_iter()
		.collect();

	let output_1 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 20, 0);
	let output_2 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 20, 3);

	proof_input_builder.set_input_utxos(input_utxos).unwrap();
	proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

	let proof_builder = proof_input_builder.build();
	let mut message = "".to_string();
	if let Err(e) = proof_builder {
		message = e.error_message
	}
	let expected_error_message =
		"Invalid UTXOs: utxo indices has invalid chain_id [1], non-default utxos with an duplicate index []"
			.to_string();
	assert_eq!(message, expected_error_message)
}

#[wasm_bindgen_test]
fn should_fail_to_proof_with_1_input() {
	let utxo = generate_vanchor_utxo(30, 0, Some(0));
	let protocol = JsValue::from("vanchor").into();
	let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

	let leaf = utxo.commitment();
	let leaves: Array = vec![leaf].into_iter().collect();

	let mut leaves_map = LeavesMapInput::new();
	leaves_map
		.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
		.unwrap();

	let indices: Array = vec![JsValue::from("0"), JsValue::from("0")].into_iter().collect();
	let roots: Array = vec![
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
	]
	.into_iter()
	.collect();
	proof_input_builder.set_leaves_map(leaves_map).unwrap();

	proof_input_builder
		.set_indices(Indices::from(JsValue::from(indices)))
		.unwrap();
	proof_input_builder
		.set_roots(Leaves::from(JsValue::from(roots)))
		.unwrap();

	proof_input_builder.set_pk(JsString::from("0000")).unwrap();
	proof_input_builder.public_amount(JsString::from("10")).unwrap();
	proof_input_builder.chain_id(JsString::from("0")).unwrap();
	proof_input_builder.set_ext_data_hash(JsString::from("1111")).unwrap();

	let input_utxos: Array = vec![JsValue::from(utxo.clone())].into_iter().collect();

	let output_1 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 20, 0);
	let output_2 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 20, 3);

	proof_input_builder.set_input_utxos(input_utxos).unwrap();
	proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

	let proof_input = proof_input_builder.build_js().unwrap();
	let proof = generate_proof_js(proof_input);
	let mut message = "".to_string();
	if let Err(e) = proof {
		message = e.as_string().unwrap();
	}
	let expected_error_message =
		"Code 24, message proof::vanchor: Input set has 1 UTXOs while the supported set length should be one of [2, 16], data {}"
			.to_string();
	assert_eq!(message, expected_error_message)
}

#[wasm_bindgen_test]
fn should_fail_to_proof_with_3_inputs() {
	let utxo1 = generate_vanchor_utxo(10, 0, Some(0));
	let utxo2 = generate_vanchor_utxo(10, 0, Some(0));
	let utxo3 = generate_vanchor_utxo(10, 0, Some(0));
	let protocol = JsValue::from("vanchor").into();
	let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

	let leaves: Array = vec![utxo1.commitment(), utxo2.commitment(), utxo3.commitment()].into_iter().collect();

	let mut leaves_map = LeavesMapInput::new();
	leaves_map
		.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
		.unwrap();

	let indices: Array = vec![JsValue::from("0"), JsValue::from("1")].into_iter().collect();
	let roots: Array = vec![
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
	]
	.into_iter()
	.collect();
	proof_input_builder.set_leaves_map(leaves_map).unwrap();

	proof_input_builder
		.set_indices(Indices::from(JsValue::from(indices)))
		.unwrap();
	proof_input_builder
		.set_roots(Leaves::from(JsValue::from(roots)))
		.unwrap();

	proof_input_builder.set_pk(JsString::from("0000")).unwrap();
	proof_input_builder.public_amount(JsString::from("10")).unwrap();
	proof_input_builder.chain_id(JsString::from("0")).unwrap();
	proof_input_builder.set_ext_data_hash(JsString::from("1111")).unwrap();

	let input_utxos: Array = vec![
		JsValue::from(utxo1.clone()),
		JsValue::from(utxo2.clone()),
		JsValue::from(utxo3.clone()),
	]
	.into_iter()
	.collect();

	let output_1 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 20, 0);
	let output_2 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 20, 3);

	proof_input_builder.set_input_utxos(input_utxos).unwrap();
	proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

	let proof_builder = proof_input_builder.build_js().unwrap();
	let proof = generate_proof_js(proof_builder);
	let mut message = "".to_string();
	if let Err(e) = proof {
		message = e.as_string().unwrap();
	}
	let expected_error_message =
		"Code 24, message proof::vanchor: Input set has 3 UTXOs while the supported set length should be one of [2, 16], data {}"
			.to_string();
	assert_eq!(message, expected_error_message)
}
#[wasm_bindgen_test]
fn generate_vanchor_proof_2_inputs() {
	let VAnchorTestSetup {
		proof_input_builder,
		roots_raw: _,
		notes: _,
		leaf_index: _,
		vk,
	} = generate_vanchor_test_setup_2_inputs();
	let proof_input = proof_input_builder.build_js().unwrap();
	let proof = generate_proof_js(proof_input).unwrap().vanchor_proof().unwrap();
	let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();

	assert!(is_valid_proof);
}

#[wasm_bindgen_test]
fn generate_vanchor_proof_16_inputs() {
	let VAnchorTestSetup {
		proof_input_builder,
		roots_raw: _,
		notes: _,
		leaf_index: _,
		vk,
	} = generate_vanchor_test_setup_16_non_default_inputs();
	let proof_input = proof_input_builder.build_js().unwrap();
	let proof = generate_proof_js(proof_input).unwrap().vanchor_proof().unwrap();
	let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();

	assert!(is_valid_proof);
}
#[wasm_bindgen_test]
fn generate_vanchor_proof_16_mixed_inputs() {
	let VAnchorTestSetup {
		proof_input_builder,
		roots_raw: _,
		notes: _,
		leaf_index: _,
		vk,
	} = generate_vanchor_test_setup_16_mixed_inputs();
	let proof_input = proof_input_builder.build_js().unwrap();
	let proof = generate_proof_js(proof_input).unwrap().vanchor_proof().unwrap();
	let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();

	assert!(is_valid_proof);
}

#[wasm_bindgen_test]
fn should_generate_a_valid_proof_for_already_used_merkle_tree() {
	let dummy_input_utxo = generate_vanchor_utxo(0, 0, Some(0));
	// Create 16 previously inserted UTXOs
	let mut existing_utxos = vec![];
	for i in 0..16 {
		let note = generate_vanchor_utxo(10, 0, Some(i));
		existing_utxos.push(note);
	}
	let leaves: Array = existing_utxos.iter().map(|n| n.commitment()).collect();
	// Create a spendable utxo (the output note)
	let new_utxo = generate_vanchor_utxo(10, 0, Some(16));
	let protocol = JsValue::from("vanchor").into();
	let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

	let leaf = new_utxo.commitment();
	leaves.push(&leaf);

	let mut leaves_map = LeavesMapInput::new();
	leaves_map
		.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
		.unwrap();
	// Create the tree
	let tree = MTBn254X5::new(Leaves::from(JsValue::from(leaves.clone())), JsString::from("0")).unwrap();
	let indices: Array = vec![JsValue::from("16"), JsValue::from("0")].into_iter().collect();
	let roots: Array = vec![
		Uint8Array::from(tree.inner.root().into_repr().to_bytes_be().as_slice()),
		Uint8Array::from([0u8; 32].to_vec().as_slice()),
	]
	.into_iter()
	.collect();
	proof_input_builder.set_leaves_map(leaves_map).unwrap();

	proof_input_builder
		.set_indices(Indices::from(JsValue::from(indices)))
		.unwrap();
	proof_input_builder
		.set_roots(Leaves::from(JsValue::from(roots)))
		.unwrap();

	proof_input_builder.set_pk(JsString::from("0000")).unwrap();
	proof_input_builder.public_amount(JsString::from("10")).unwrap();
	proof_input_builder.chain_id(JsString::from("0")).unwrap();
	proof_input_builder.set_ext_data_hash(JsString::from("1111")).unwrap();

	let notes: Array = vec![JsValue::from(new_utxo.clone()), JsValue::from(dummy_input_utxo)]
		.into_iter()
		.collect();

	let output_1 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 10, 0);
	let output_2 = new_utxo_bn254_2_2(crate::types::Curve::Bn254, 10, 3);

	proof_input_builder.set_input_utxos(notes).unwrap();
	proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

	let c = VAnchorR1CSProverBn254_30_2_2_2::setup_random_circuit(Curve::Bn254, DEFAULT_LEAF, &mut OsRng).unwrap();
	let (pk, vk) = setup_keys_unchecked::<Bn254, _, _>(c, &mut OsRng).unwrap();

	proof_input_builder.set_pk(JsString::from(hex::encode(pk))).unwrap();

	let proof_input = proof_input_builder.build_js().unwrap();

	let proof = generate_proof_js(proof_input).unwrap().vanchor_proof().unwrap();
	let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();

	assert!(is_valid_proof);
}
