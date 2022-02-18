use ark_bn254::{Bn254, Fr as Bn254Fr};
use ark_ff::{BigInteger, PrimeField};
use arkworks_circuits::setup::anchor::AnchorProverSetup;
use arkworks_utils::utils::common::{setup_params_x5_3, setup_params_x5_4, Curve as ArkCurve};
use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

use crate::note::JsNote;
use crate::proof::ProofInputBuilder;
use crate::types::Leaves;
use arkworks_circuits::setup::mixer::setup_keys_x5_5;

pub const MIXER_NOTE_X5_5:&str = "webb://v1:mixer/2:3/2:3/376530663462666132363364386239333835343737326339343835316330346233613961626133386162383038613864303831663666356265393735383131306237313437633339356565396266343935373334653437303362316636323230303963383137313235323064653062626435653761313032333763376438323962663662643664303732396363613737386564396236666231373262626231326230313932373235386163613765306136366664353639313534386638373137/?curve=Bn254&width=5&exp=5&hf=Poseidon&backend=Arkworks&token=EDG&denom=18&amount=0";
pub const ANCHOR_NOTE_X5_4:&str = "webb://v1:anchor/2:3/2:3/020000000001376530663462666132363364386239333835343737326339343835316330346233613961626133386162383038613864303831663666356265393735383131306237313437633339356565396266343935373334653437303362316636323230303963383137313235323064653062626435653761313032333763376438323962663662643664303732396363613737386564396236666231373262626231326230313932373235386163613765306136366664353639313534386638373137/?curve=Bn254&width=5&exp=5&hf=Poseidon&backend=Arkworks&token=EDG&denom=18&amount=0";

const TREE_DEPTH: usize = 30;
pub const M: usize = 2;
pub const DECODED_SUBSTRATE_ADDRESS: &str = "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129";

type AnchorSetup30_2 = AnchorProverSetup<Bn254Fr, M, TREE_DEPTH>;

pub struct MixerTestSetup {
	pub(crate) relayer: Vec<u8>,
	pub(crate) recipient: Vec<u8>,
	pub(crate) proof_input_builder: ProofInputBuilder,
	pub(crate) root: Vec<u8>,
	pub(crate) leaf_bytes: Vec<u8>,
	pub(crate) leaf_index: u64,
	pub(crate) vk: Vec<u8>,
}

pub struct AnchorTestSetup {
	pub(crate) relayer: Vec<u8>,
	pub(crate) recipient: Vec<u8>,
	pub(crate) proof_input_builder: ProofInputBuilder,
	pub(crate) roots_raw: [Vec<u8>; 2],
	pub(crate) leaf_bytes: Vec<u8>,
	pub(crate) leaf_index: u64,
	pub(crate) vk: Vec<u8>,
}

pub fn generate_mixer_test_setup(
	relayer_decoded_ss58: &str,
	recipient_decoded_ss58: &str,
	note: &str,
) -> MixerTestSetup {
	let keys = setup_keys_x5_5::<Bn254, _>(ArkCurve::Bn254, &mut OsRng).unwrap();
	let index = 0;
	let note = JsNote::js_deserialize(JsString::from(note)).unwrap();
	let leaf = note.get_leaf_commitment().unwrap();
	let leaf_bytes: Vec<u8> = leaf.to_vec();

	let leaves_ua: Array = vec![leaf].into_iter().collect();

	let mut js_builder = ProofInputBuilder::new();

	js_builder.set_leaf_index(JsString::from("0")).unwrap();
	js_builder.set_leaves(Leaves::from(JsValue::from(leaves_ua))).unwrap();

	js_builder.set_fee(JsString::from("5")).unwrap();
	js_builder.set_refund(JsString::from("1")).unwrap();

	js_builder.set_relayer(JsString::from(relayer_decoded_ss58)).unwrap();
	js_builder
		.set_recipient(JsString::from(recipient_decoded_ss58))
		.unwrap();

	js_builder.set_pk(JsString::from(hex::encode(&keys.pk))).unwrap();

	js_builder.set_note(&note).unwrap();

	MixerTestSetup {
		relayer: hex::decode(relayer_decoded_ss58).unwrap(),
		recipient: hex::decode(recipient_decoded_ss58).unwrap(),
		vk: keys.vk,
		root: vec![],
		leaf_bytes,
		proof_input_builder: js_builder,
		leaf_index: index,
	}
}

pub fn generate_anchor_test_setup(
	relayer_decoded_ss58: &str,
	recipient_decoded_ss58: &str,
	note: &str,
) -> AnchorTestSetup {
	use arkworks_circuits::setup::anchor::setup_keys_x5_4;
	let curve = ArkCurve::Bn254;
	let index = 0;

	let key = setup_keys_x5_4::<Bn254, _>(ArkCurve::Bn254, &mut OsRng).unwrap();

	let note = JsNote::js_deserialize(JsString::from(note)).unwrap();

	let leaf: Uint8Array = note.get_leaf_commitment().unwrap();
	let leaf_bytes: Vec<u8> = leaf.to_vec();
	let leaves_ua: Array = vec![leaf].into_iter().collect();

	let params3 = setup_params_x5_3::<Bn254Fr>(curve);
	let params4 = setup_params_x5_4::<Bn254Fr>(curve);

	let anchor_setup = AnchorSetup30_2::new(params3, params4);

	let leaves_f = vec![Bn254Fr::from_le_bytes_mod_order(&leaf_bytes)];
	let (tree, _) = anchor_setup.setup_tree_and_path(&leaves_f, index).unwrap();
	let roots_f = [tree.root().inner(); M];
	let roots_raw = roots_f.map(|x| x.into_repr().to_bytes_le());
	let roots_array: Array = roots_raw.iter().map(|i| Uint8Array::from(i.as_slice())).collect();

	let mut js_builder = ProofInputBuilder::new();
	js_builder.set_leaf_index(JsString::from(index.to_string())).unwrap();
	js_builder.set_leaves(Leaves::from(JsValue::from(leaves_ua))).unwrap();

	js_builder.set_fee(JsString::from("5")).unwrap();
	js_builder.set_refund(JsString::from("1")).unwrap();

	js_builder
		.set_recipient(JsString::from(recipient_decoded_ss58))
		.unwrap();

	js_builder.set_relayer(JsString::from(relayer_decoded_ss58)).unwrap();

	js_builder.set_note(&note).unwrap();

	js_builder.set_pk(JsString::from(hex::encode(key.pk))).unwrap();
	js_builder
		.set_commitment(JsString::from(hex::encode([0u8; 32])))
		.unwrap();
	js_builder.set_roots(Leaves::from(JsValue::from(roots_array))).unwrap();

	AnchorTestSetup {
		relayer: hex::decode(relayer_decoded_ss58).unwrap(),
		recipient: hex::decode(recipient_decoded_ss58).unwrap(),
		vk: key.vk,
		leaf_index: index,
		leaf_bytes,
		proof_input_builder: js_builder,
		roots_raw,
	}
}
