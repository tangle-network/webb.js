use core::convert::TryInto;
use js_sys::{Array, JsString, Uint8Array};
use wasm_bindgen::__rt::std::collections::btree_map::BTreeMap;
// https://github.com/rustwasm/wasm-bindgen/issues/2231#issuecomment-656293288
use wasm_bindgen::prelude::*;

use ark_bn254::Fr as Bn254Fr;
use ark_crypto_primitives::Error;
use ark_ff::{BigInteger, PrimeField};
use arkworks_setups::utxo::Utxo;
use arkworks_setups::{Curve as ArkCurve, VAnchorProver};
use rand::rngs::OsRng;

use crate::note::JsNote;
use crate::types::{Backend, Curve, HashFunction, NoteProtocol, NoteVersion, OpStatusCode, OperationError};
use crate::utxo::JsUtxo;
use crate::{VAnchorR1CSProverBn254_30_2_16_2, VAnchorR1CSProverBn254_30_2_2_2, DEFAULT_LEAF};

const SUPPORTED_INPUT_COUNT: [usize; 2] = [2, 16];
const SUPPORTED_VANCHOR_COUNT: [usize; 3] = [2, 8, 16];

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct VAnchorProof {
	#[wasm_bindgen(skip)]
	pub proof: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub public_inputs: Vec<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub output_notes: Vec<JsNote>,
	#[wasm_bindgen(skip)]
	pub input_utxos: Vec<JsUtxo>,
	#[wasm_bindgen(skip)]
	pub public_amount: [u8; 32],
}
#[wasm_bindgen]
impl VAnchorProof {
	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = publicInputs)]
	pub fn public_inputs_raw(&self) -> Array {
		let inputs: Array = self
			.public_inputs
			.iter()
			.map(|x| JsString::from(hex::encode(x)))
			.collect();
		inputs
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = outputNotes)]
	pub fn output_notes(&self) -> Array {
		let inputs: Array = self.output_notes.clone().into_iter().map(JsValue::from).collect();
		inputs
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = inputUtxos)]
	pub fn inputs_utxos(&self) -> Array {
		let inputs: Array = self.input_utxos.clone().into_iter().map(JsValue::from).collect();
		inputs
	}

	#[wasm_bindgen(getter)]
	pub fn proof(&self) -> JsString {
		JsString::from(hex::encode(&self.proof))
	}

	#[wasm_bindgen(js_name = publicAmount)]
	#[wasm_bindgen(getter)]
	pub fn public_amount(&self) -> Uint8Array {
		Uint8Array::from(self.public_amount.to_vec().as_slice())
	}
}

#[derive(Debug, Clone)]
pub struct VAnchorProofPayload {
	pub exponentiation: i8,
	pub width: usize,
	pub curve: Curve,
	pub backend: Backend,
	pub pk: Vec<u8>,
	pub leaves: BTreeMap<u64, Vec<Vec<u8>>>,
	pub ext_data_hash: Vec<u8>,
	/// get roots for linkable tree
	/// Available set can be of length 2 , 16 , 32
	pub roots: Vec<Vec<u8>>,
	// Notes for UTXOs
	pub secret: Vec<JsUtxo>,
	// Leaf indices
	pub indices: Vec<u64>,
	// Chain Id
	pub chain_id: u64,
	// Public amount
	pub public_amount: i128,
	// utxo config
	pub output_utxos: [JsUtxo; 2],
}

#[derive(Debug, Clone, Default)]
pub struct VAnchorProofInput {
	pub exponentiation: Option<i8>,
	pub width: Option<usize>,
	pub curve: Option<Curve>,
	pub backend: Option<Backend>,
	pub pk: Option<Vec<u8>>,
	pub leaves: Option<BTreeMap<u64, Vec<Vec<u8>>>>,
	pub ext_data_hash: Option<Vec<u8>>,
	/// get roots for linkable tree
	/// Available set can be of length 2 , 16 , 32
	pub roots: Option<Vec<Vec<u8>>>,
	// Notes for UTXOs
	pub secret: Option<Vec<JsUtxo>>,
	// Leaf indices
	pub indices: Option<Vec<u64>>,
	// Chain Id
	pub chain_id: Option<u128>,
	// Public amount
	pub public_amount: Option<i128>,
	// ouput utxos
	pub output_utxos: Option<[JsUtxo; 2]>,
}

impl VAnchorProofInput {
	pub fn build(self) -> Result<VAnchorProofPayload, OperationError> {
		let pk = self.pk.ok_or(OpStatusCode::InvalidProvingKey)?;
		let secret = self.secret.ok_or(OpStatusCode::InvalidNoteSecrets)?;
		let leaves = self.leaves.ok_or(OpStatusCode::InvalidLeaves)?;
		let ext_data_hash = self.ext_data_hash.ok_or(OpStatusCode::InvalidExtDataHash)?;
		let roots = self.roots.ok_or(OpStatusCode::InvalidRoots)?;
		let chain_id = self.chain_id.ok_or(OpStatusCode::InvalidChainId)?;
		let indices = self.indices.ok_or(OpStatusCode::InvalidIndices)?;
		let public_amount = self.public_amount.ok_or(OpStatusCode::InvalidPublicAmount)?;
		let output_utxos = self.output_utxos.ok_or(OpStatusCode::InvalidPublicAmount)?;

		let exponentiation = self.exponentiation.unwrap_or(5);
		let width = self.width.unwrap_or(3);
		let curve = self.curve.unwrap_or(Curve::Bn254);
		let backend = self.backend.unwrap_or(Backend::Arkworks);

		// Input UTXO should have the same chain_id
		// For default UTXOS the amount and the index should be `0`
		// Duplicate indices is ONLY allowed for the default UTXOs
		// chain_id of the first item in the list
		let mut invalid_utxo_chain_id_indices = vec![];
		let mut invalid_utxo_dublicate_nullifiers = vec![];
		let utxos_chain_id = secret[0].clone().chain_id_raw();
		// validate the all inputs share the same chain_id
		secret.iter().enumerate().for_each(|(index, utxo)| {
			if utxo.get_chain_id_raw() != utxos_chain_id {
				invalid_utxo_chain_id_indices.push(index)
			}
		});
		let non_default_utxo = secret
			.iter()
			.enumerate()
			.filter(|(_, utxo)| {
				// filter for non-default utxos
				utxo.get_amount_raw() != 0 && utxo.get_index().unwrap_or(0) != 0
			})
			.collect::<Vec<_>>();
		non_default_utxo.iter().for_each(|(index, utxo)| {
			let has_dublicate = non_default_utxo
				.iter()
				.find(|(root_index, root_utxo)| root_index != index && root_utxo.get_index() == utxo.get_index());
			if has_dublicate.is_some() {
				invalid_utxo_dublicate_nullifiers.push(index)
			}
		});
		if !invalid_utxo_chain_id_indices.is_empty() || !invalid_utxo_dublicate_nullifiers.is_empty() {
			let message = format!(
				"Invalid UTXOs: utxo indices has invalid chain_id {:?}, non-default utxos with an duplicate index {:?}",
				invalid_utxo_chain_id_indices, invalid_utxo_dublicate_nullifiers
			);
			let mut op: OperationError =
				OperationError::new_with_message(OpStatusCode::InvalidProofParameters, message);
			op.data = Some(format!(
				"{{ duplicateIndices:{:?} , invalidChainId:{:?} }}",
				invalid_utxo_chain_id_indices, invalid_utxo_dublicate_nullifiers
			));
			return Err(op);
		}

		// validate amounts
		let mut in_amount = public_amount;
		secret.iter().for_each(|utxo| {
			let utxo_amount: i128 = utxo
				.get_amount_raw()
				.try_into()
				.expect("Failed to convert utxo value to i128");
			in_amount += utxo_amount
		});
		let mut out_amount = 0u128;
		output_utxos
			.iter()
			.for_each(|output_config| out_amount += output_config.get_amount_raw());
		let out_amount: i128 = out_amount
			.try_into()
			.expect("Failed to convert accumulated in amounts  value to i128");
		if out_amount != in_amount {
			let message = format!(
				"Output amount and input amount don't match input({}) != output({})",
				in_amount, out_amount
			);
			let mut oe = OperationError::new_with_message(OpStatusCode::InvalidProofParameters, message);
			oe.data = Some(format!("{{ inputAmount:{} ,outputAmount:{}}}", in_amount, out_amount));
			return Err(oe);
		}
		Ok(VAnchorProofPayload {
			exponentiation,
			width,
			curve,
			backend,
			pk,
			leaves,
			ext_data_hash,
			roots,
			secret,
			indices,
			chain_id: chain_id.try_into().unwrap(),
			public_amount,
			output_utxos,
		})
	}
}

fn get_output_notes(
	anchor_proof_input: &VAnchorProofPayload,
	output_config: [JsUtxo; 2],
) -> Result<[JsNote; 2], OperationError> {
	output_config
		.into_iter()
		.map(|c| {
			let mut note = JsNote {
				scheme: NoteProtocol::VAnchor.to_string(),
				protocol: NoteProtocol::VAnchor,
				version: NoteVersion::V1,
				source_chain_id: c.chain_id_raw().to_string(),
				target_chain_id: c.chain_id_raw().to_string(),
				source_identifying_data: "".to_string(),
				target_identifying_data: "".to_string(),
				// Are set with the utxo mutation
				secrets: vec![],
				curve: Some(anchor_proof_input.curve),
				exponentiation: Some(anchor_proof_input.exponentiation),
				width: Some(anchor_proof_input.width),
				// TODO : fix the token_symbol
				token_symbol: Some("ANY".to_string()),
				amount: Some(c.get_amount_raw().to_string()),
				denomination: None,
				backend: Some(anchor_proof_input.backend),
				hash_function: Some(HashFunction::Poseidon),
				index: None,
			};
			note.update_vanchor_utxo(c)?;
			Ok(note)
		})
		.collect::<Result<Vec<JsNote>, OperationError>>()?
		.try_into()
		.map_err(|_| {
			OperationError::new_with_message(
				OpStatusCode::Unknown,
				"proof::vanchor: Failed to generate the notes".to_string(),
			)
		})
}

pub fn create_proof(vanchor_proof_input: VAnchorProofPayload, rng: &mut OsRng) -> Result<VAnchorProof, OperationError> {
	let VAnchorProofPayload {
		public_amount,
		backend,
		curve,
		width,
		secret,
		indices,
		leaves,
		exponentiation,
		roots,
		pk,
		chain_id,
		output_utxos,
		ext_data_hash,
	} = vanchor_proof_input.clone();
	let public_amount_bytes = Bn254Fr::from(public_amount)
		.into_repr()
		.to_bytes_be()
		.try_into()
		.expect("proof::vanchor: Failed to wrap public amount to bytes");
	// Insure UTXO set has the required/supported input count
	let in_utxos: Vec<JsUtxo> = if SUPPORTED_INPUT_COUNT.contains(&secret.len()) {
		secret
	} else {
		let message = format!(
			"proof::vanchor: Input set has {} UTXOs while the supported set length should be one of {:?}",
			&secret.len(),
			&SUPPORTED_INPUT_COUNT,
		);
		return Err(OperationError::new_with_message(
			OpStatusCode::InvalidProofParameters,
			message,
		));
	};
	// Insure the length of the indices
	if indices.len() != in_utxos.len() {
		let message = format!(
      "proof::vanchor: Indices Array don't match with the Input size , supplied {} indices while there are {} utxos in the input ",
      indices.len(),
      in_utxos.len(),
    );
		return Err(OperationError::new_with_message(
			OpStatusCode::InvalidProofParameters,
			message,
		));
	}
	// Insure the Anchor count is supported
	if !SUPPORTED_VANCHOR_COUNT.contains(&roots.len()) {
		let message = format!(
			"proof::vanchor: Input set has {} roots while the supported set length should be one of {:?}",
			&roots.len(),
			&SUPPORTED_VANCHOR_COUNT,
		);
		return Err(OperationError::new_with_message(
			OpStatusCode::InvalidProofParameters,
			message,
		));
	};
	// Initialize the output notes vec
	let output_notes = get_output_notes(&vanchor_proof_input, output_utxos.clone())?.to_vec();
	let proof = match (backend, curve, roots.len()) {
		(Backend::Arkworks, Curve::Bn254, 2) => {
			let utxos_out = output_utxos
				.iter()
				.map(|js_utx| js_utx.get_bn254_utxo())
				.collect::<Result<Vec<_>, OpStatusCode>>()?
				.try_into()
				.map_err(|_| OpStatusCode::InvalidProofParameters)?;
			match (exponentiation, width, in_utxos.len()) {
				(5, 5, 2) => {
					let utxos_in: [Utxo<Bn254Fr>; 2] = [in_utxos[0].get_bn254_utxo()?, in_utxos[1].get_bn254_utxo()?];
					let indices = indices.try_into().map_err(|_| OpStatusCode::InvalidIndices)?;
					let roots = roots.try_into().map_err(|_| OpStatusCode::InvalidRoots)?;
					VAnchorR1CSProverBn254_30_2_2_2::create_proof(
						ArkCurve::Bn254,
						chain_id,
						public_amount,
						ext_data_hash,
						roots,
						indices,
						leaves,
						utxos_in,
						utxos_out,
						pk,
						DEFAULT_LEAF,
						rng,
					)
				}
				(5, 5, 16) => {
					let in_utxos = in_utxos
						.iter()
						.map(|utxo| utxo.get_bn254_utxo())
						.collect::<Result<Vec<_>, _>>()?;
					let utxos_slice = in_utxos.try_into().map_err(|_| OpStatusCode::InvalidNoteSecrets)?;
					let indices = indices.try_into().map_err(|_| OpStatusCode::InvalidIndices)?;
					let roots = roots.try_into().map_err(|_| OpStatusCode::InvalidRoots)?;

					VAnchorR1CSProverBn254_30_2_16_2::create_proof(
						ArkCurve::Bn254,
						chain_id,
						public_amount,
						ext_data_hash,
						roots,
						indices,
						leaves,
						utxos_slice,
						utxos_out,
						pk,
						DEFAULT_LEAF,
						rng,
					)
				}
				_ => {
					let message = format!(
						"proof::vanchor: The proofing setup for backend {} curve {} width {} exp {} input size {} isn't implemented!",
						backend,
						curve,
						width,
						exponentiation,
						&in_utxos.len(),
					);
					Err(Error::from(message))
				}
			}
		}
		_ => {
			let message = format!(
				"proof::vanchor: The proofing setup for backend {} curve {} width {} exp {} input size {} isn't implemented!",
				backend,
				curve,
				width,
				exponentiation,
				&in_utxos.len(),
			);
			Err(Error::from(message))
		}
	}
	.map_err(|e| {
		let message = format!("proof::vanchor:  {}", e);
		OperationError::new_with_message(OpStatusCode::InvalidProofParameters, message)
	})?;
	Ok(VAnchorProof {
		proof: proof.proof,
		public_inputs: proof.public_inputs_raw,
		output_notes: output_notes.to_vec(),
		input_utxos: in_utxos,
		public_amount: public_amount_bytes,
	})
}
