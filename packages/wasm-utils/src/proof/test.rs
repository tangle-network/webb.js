#[cfg(test)]
mod test {
	use ark_bn254::Bn254;
	use ark_std::UniformRand;
	use arkworks_setups::common::{
		prove, prove_unchecked, setup_keys, setup_keys_unchecked, verify, verify_unchecked_raw,
	};
	use js_sys::{Array, JsString, Uint8Array};
	use wasm_bindgen::JsValue;
	use wasm_bindgen_test::*;

	use crate::note::JsNote;
	use crate::proof::test_utils::{
		generate_anchor_test_setup, generate_mixer_test_setup, generate_vanchor_note,
		generate_vanchor_test_setup_16_mixed_inputs, generate_vanchor_test_setup_16_non_default_inputs,
		generate_vanchor_test_setup_2_inputs, new_utxobn_2_2, AnchorTestSetup, MixerTestSetup, VAnchorTestSetup,
		ANCHOR_NOTE_V1_X5_4, ANCHOR_NOTE_V2_X5_4, DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_V1_X5_5, VANCHOR_NOTE_V2_X5_4,
	};
	use crate::proof::{generate_proof_js, truncate_and_pad, JsProofInputBuilder, LeavesMapInput};
	use crate::types::{Indices, Leaves, WasmCurve, BE};
	use crate::utxo::JsUtxo;
	use crate::{VAnchorR1CSProverBn254_30_2_2_2, DEFAULT_LEAF};

	use super::*;

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
	fn anchor_js_setup() {
		let AnchorTestSetup {
			relayer,
			recipient,
			proof_input_builder,
			roots_raw,
			leaf_bytes,
			..
		} = generate_anchor_test_setup(
			DECODED_SUBSTRATE_ADDRESS,
			DECODED_SUBSTRATE_ADDRESS,
			ANCHOR_NOTE_V1_X5_4,
		);
		let anchor_input = proof_input_builder.build().unwrap().anchor_input().unwrap();
		let truncated_substrate_relayer_address = truncate_and_pad(&relayer);
		let truncated_substrate_recipient_address = truncate_and_pad(&recipient);
		assert_eq!(
			hex::encode(anchor_input.recipient),
			hex::encode(&truncated_substrate_recipient_address)
		);
		assert_eq!(
			hex::encode(anchor_input.relayer),
			hex::encode(&truncated_substrate_relayer_address)
		);

		assert_eq!(hex::encode(anchor_input.refresh_commitment), hex::encode([0u8; 32]));
		assert_eq!(hex::encode(&anchor_input.roots[0]), hex::encode(&roots_raw[0]));
		assert_eq!(anchor_input.roots.len(), roots_raw.len());

		assert_eq!(anchor_input.refund, 1);
		assert_eq!(anchor_input.fee, 5);

		assert_eq!(anchor_input.leaf_index, 0);
		assert_eq!(hex::encode(&anchor_input.leaves[0]), hex::encode(leaf_bytes));
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
	fn anchor_proving_v1() {
		let AnchorTestSetup {
			proof_input_builder,
			vk,
			..
		} = generate_anchor_test_setup(
			DECODED_SUBSTRATE_ADDRESS,
			DECODED_SUBSTRATE_ADDRESS,
			ANCHOR_NOTE_V1_X5_4,
		);

		let proof_input = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap().anchor_proof().unwrap();

		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}

	#[wasm_bindgen_test]
	fn anchor_proving_v2() {
		let AnchorTestSetup {
			proof_input_builder,
			vk,
			..
		} = generate_anchor_test_setup(
			DECODED_SUBSTRATE_ADDRESS,
			DECODED_SUBSTRATE_ADDRESS,
			ANCHOR_NOTE_V2_X5_4,
		);

		let proof_input = proof_input_builder.build_js().unwrap();

		let proof = generate_proof_js(proof_input.clone()).unwrap().anchor_proof().unwrap();
		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}

	#[wasm_bindgen_test]
	fn should_generate_vanchor_proof_input() {
		let vanchor_note_str: String = generate_vanchor_note(10, 0, 0, Some(0)).serialize().into();
		let protocol = JsValue::from("vanchor").into();
		let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

		let note = JsNote::deserialize(&vanchor_note_str).unwrap();
		let leaf = note.get_leaf_commitment().unwrap();
		let leaves: Array = vec![leaf].into_iter().collect();

		let mut tree_leaves = LeavesMapInput::new();
		tree_leaves
			.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
			.unwrap();

		let indices: Array = vec![JsValue::from("0"), JsValue::from("0")].into_iter().collect();
		let roots: Array = vec![
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
		]
		.into_iter()
		.collect();
		proof_input_builder.set_leaves_map(tree_leaves).unwrap();

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

		let notes: Array = vec![JsValue::from(note.clone())].into_iter().collect();

		let backend: BE = JsValue::from(note.backend.clone().unwrap().to_string()).into();

		let curve: WasmCurve = JsValue::from(note.curve.unwrap().to_string()).into();

		let output_1 = new_utxobn_2_2(note.curve.unwrap(), 10, 0);
		let output_2 = new_utxobn_2_2(note.curve.unwrap(), 10, 3);

		proof_input_builder.set_notes(notes).unwrap();
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
			note.backend.unwrap().to_string()
		);
		assert_eq!(vanchor_proof_input_payload.exponentiation, note.exponentiation.unwrap());
		assert_eq!(vanchor_proof_input_payload.width, note.width.unwrap());
		assert_eq!(
			vanchor_proof_input_payload.curve.to_string(),
			note.curve.unwrap().to_string()
		);
		assert_eq!(hex::encode(vanchor_proof_input_payload.pk), "0000");
	}

	#[wasm_bindgen_test]
	fn should_fail_to_generate_vanchor_proof_input_with_invalid_amounts() {
		let vanchor_note_str: String = generate_vanchor_note(15, 0, 0, Some(0)).serialize().into();
		let protocol = JsValue::from("vanchor").into();
		let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

		let note = JsNote::deserialize(&vanchor_note_str).unwrap();
		let leaf = note.get_leaf_commitment().unwrap();
		let leaves: Array = vec![leaf].into_iter().collect();

		let mut tree_leaves = LeavesMapInput::new();
		tree_leaves
			.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
			.unwrap();

		let indices: Array = vec![JsValue::from("0"), JsValue::from("0")].into_iter().collect();
		let roots: Array = vec![
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
		]
		.into_iter()
		.collect();
		proof_input_builder.set_leaves_map(tree_leaves).unwrap();

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

		let notes: Array = vec![JsValue::from(note.clone())].into_iter().collect();

		let output_1 = new_utxobn_2_2(note.curve.unwrap(), 10, 0);
		let output_2 = new_utxobn_2_2(note.curve.unwrap(), 10, 0);

		proof_input_builder.set_notes(notes).unwrap();
		proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

		let proof_builder = proof_input_builder.build();
		let mut message = "".to_string();
		if let Err(e) = proof_builder {
			message = e.error_message
		}
		let expected_error_message = "Output amount and input amount  don't match input(25) != output(20)".to_string();
		assert_eq!(message, expected_error_message)
	}

	#[wasm_bindgen_test]
	fn should_fail_to_generate_vanchor_proof_input_with_inconsistent_notes_chain_id() {
		let note = generate_vanchor_note(15, 0, 0, Some(0));
		let note2 = generate_vanchor_note(15, 1, 1, Some(1));
		let protocol = JsValue::from("vanchor").into();
		let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

		let leaf = note.get_leaf_commitment().unwrap();
		let leaf2 = note2.get_leaf_commitment().unwrap();
		let leaves: Array = vec![leaf, leaf2].into_iter().collect();

		let mut tree_leaves = LeavesMapInput::new();
		tree_leaves
			.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
			.unwrap();

		let indices: Array = vec![JsValue::from("0"), JsValue::from("1")].into_iter().collect();
		let roots: Array = vec![
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
		]
		.into_iter()
		.collect();
		proof_input_builder.set_leaves_map(tree_leaves).unwrap();

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

		let notes: Array = vec![JsValue::from(note.clone()), JsValue::from(note2.clone())]
			.into_iter()
			.collect();

		let backend: BE = JsValue::from(note.backend.clone().unwrap().to_string()).into();

		let curve: WasmCurve = JsValue::from(note.curve.unwrap().to_string()).into();

		let output_1 = new_utxobn_2_2(note.curve.unwrap(), 10, 0);
		let output_2 = new_utxobn_2_2(note.curve.unwrap(), 10, 3);

		proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

		proof_input_builder.set_notes(notes).unwrap();
		let proof_builder = proof_input_builder.build();
		let mut message = "".to_string();
		if let Err(e) = proof_builder {
			message = e.error_message
		}
		let expected_error_message =
			"Invalid UTXOs: utxo indices has invalid chain_id [1] ,non-default utxos with an duplicate index []"
				.to_string();
		assert_eq!(message, expected_error_message)
	}

	#[wasm_bindgen_test]
	fn should_fail_to_generate_vanchor_proof_input_with_inconsistent_notes_indices() {
		let note = generate_vanchor_note(15, 0, 0, Some(0));
		let note2 = generate_vanchor_note(15, 1, 1, Some(0));
		let protocol = JsValue::from("vanchor").into();
		let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

		let leaf = note.get_leaf_commitment().unwrap();
		let leaf2 = note2.get_leaf_commitment().unwrap();
		let leaves: Array = vec![leaf, leaf2].into_iter().collect();

		let mut tree_leaves = LeavesMapInput::new();
		tree_leaves
			.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
			.unwrap();

		let indices: Array = vec![JsValue::from("0"), JsValue::from("1")].into_iter().collect();
		let roots: Array = vec![
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
		]
		.into_iter()
		.collect();
		proof_input_builder.set_leaves_map(tree_leaves).unwrap();

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

		let notes: Array = vec![JsValue::from(note.clone()), JsValue::from(note2.clone())]
			.into_iter()
			.collect();

		let backend: BE = JsValue::from(note.backend.clone().unwrap().to_string()).into();

		let curve: WasmCurve = JsValue::from(note.curve.unwrap().to_string()).into();

		let output_1 = new_utxobn_2_2(note.curve.unwrap(), 20, 0);
		let output_2 = new_utxobn_2_2(note.curve.unwrap(), 20, 3);

		proof_input_builder.set_notes(notes).unwrap();
		proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

		let proof_builder = proof_input_builder.build();
		let mut message = "".to_string();
		if let Err(e) = proof_builder {
			message = e.error_message
		}
		let expected_error_message =
			"Invalid UTXOs: utxo indices has invalid chain_id [1] ,non-default utxos with an duplicate index []"
				.to_string();
		assert_eq!(message, expected_error_message)
	}

	#[wasm_bindgen_test]
	fn should_fail_to_proof_with_1_input() {
		let note = generate_vanchor_note(30, 0, 0, Some(0));
		let protocol = JsValue::from("vanchor").into();
		let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

		let leaf = note.get_leaf_commitment().unwrap();
		let leaves: Array = vec![leaf].into_iter().collect();

		let mut tree_leaves = LeavesMapInput::new();
		tree_leaves
			.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
			.unwrap();

		let indices: Array = vec![JsValue::from("0"), JsValue::from("0")].into_iter().collect();
		let roots: Array = vec![
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
		]
		.into_iter()
		.collect();
		proof_input_builder.set_leaves_map(tree_leaves).unwrap();

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

		let notes: Array = vec![JsValue::from(note.clone())].into_iter().collect();

		let backend: BE = JsValue::from(note.backend.clone().unwrap().to_string()).into();
		let curve: WasmCurve = JsValue::from(note.curve.unwrap().to_string()).into();

		let output_1 = new_utxobn_2_2(note.curve.unwrap(), 20, 0);
		let output_2 = new_utxobn_2_2(note.curve.unwrap(), 20, 3);

		proof_input_builder.set_notes(notes).unwrap();
		proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

		let proof_input = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input);
		let mut message = "".to_string();
		if let Err(e) = proof {
			message = e.as_string().unwrap();
		}
		let expected_error_message =
			"Code 24, message Input set has 1 UTXOs while the supported set length should be one of [2, 16], data {}"
				.to_string();
		assert_eq!(message, expected_error_message)
	}

	#[wasm_bindgen_test]
	fn should_fail_to_proof_with_3_inputs() {
		let note = generate_vanchor_note(10, 0, 0, Some(0));
		let note2 = generate_vanchor_note(10, 0, 0, Some(0));
		let note3 = generate_vanchor_note(10, 0, 0, Some(0));
		let protocol = JsValue::from("vanchor").into();
		let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

		let leaf = note.get_leaf_commitment().unwrap();
		let leaf2 = note2.get_leaf_commitment().unwrap();
		let leaf3 = note2.get_leaf_commitment().unwrap();
		let leaves: Array = vec![leaf, leaf2, leaf3].into_iter().collect();

		let mut tree_leaves = LeavesMapInput::new();
		tree_leaves
			.set_chain_leaves(0, Leaves::from(JsValue::from(leaves.clone())))
			.unwrap();

		let indices: Array = vec![JsValue::from("0"), JsValue::from("1")].into_iter().collect();
		let roots: Array = vec![
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
		]
		.into_iter()
		.collect();
		proof_input_builder.set_leaves_map(tree_leaves).unwrap();

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

		let notes: Array = vec![
			JsValue::from(note.clone()),
			JsValue::from(note2.clone()),
			JsValue::from(note3.clone()),
		]
		.into_iter()
		.collect();

		let backend: BE = JsValue::from(note.backend.clone().unwrap().to_string()).into();
		let curve: WasmCurve = JsValue::from(note.curve.unwrap().to_string()).into();

		let output_1 = new_utxobn_2_2(note.curve.unwrap(), 20, 0);
		let output_2 = new_utxobn_2_2(note.curve.unwrap(), 20, 3);

		proof_input_builder.set_notes(notes).unwrap();
		proof_input_builder.set_output_utxos(output_1, output_2).unwrap();

		let proof_builder = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_builder);
		let mut message = "".to_string();
		if let Err(e) = proof {
			message = e.as_string().unwrap();
		}
		let expected_error_message =
			"Code 24, message Input set has 3 UTXOs while the supported set length should be one of [2, 16], data {}"
				.to_string();
		assert_eq!(message, expected_error_message)
	}
	#[wasm_bindgen_test]
	fn generate_vanchor_proof_2_inputs() {
		let VAnchorTestSetup {
			proof_input_builder,
			roots_raw,
			notes,
			leaf_index,
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
			roots_raw,
			notes,
			leaf_index,
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
			roots_raw,
			notes,
			leaf_index,
			vk,
		} = generate_vanchor_test_setup_16_mixed_inputs();
		let proof_input = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap().vanchor_proof().unwrap();
		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();

		assert!(is_valid_proof);
	}
}
