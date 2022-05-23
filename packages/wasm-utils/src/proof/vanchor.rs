use core::convert::TryInto;

use ark_bn254::Fr as Bn254Fr;
use ark_crypto_primitives::Error;
use arkworks_setups::utxo::Utxo;
use arkworks_setups::{Curve as ArkCurve, VAnchorProver};
use rand::rngs::OsRng;

use crate::note::JsNote;
use crate::proof::{VAnchorProof, VAnchorProofPayload};
use crate::types::{Backend, Curve, HashFunction, NoteProtocol, NoteVersion, OpStatusCode, OperationError};
use crate::utxo::JsUtxo;
use crate::{VAnchorR1CSProverBn254_30_2_16_2, VAnchorR1CSProverBn254_30_2_2_2, DEFAULT_LEAF};

const SUPPORTED_INPUT_COUNT: [usize; 2] = [2, 16];
const SUPPORTED_ANCHOR_COUNT: [usize; 2] = [2, 16];

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
				version: NoteVersion::V2,
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
				amount: Some(c.amount_raw().to_string()),
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
			OperationError::new_with_message(OpStatusCode::Unknown, "Failed to generate the notes".to_string())
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
		output_config,
		ext_data_hash,
	} = vanchor_proof_input.clone();

	// Insure UTXO set has the required/supported input count
	let in_utxos: Vec<JsUtxo> = if SUPPORTED_INPUT_COUNT.contains(&secret.len()) {
		secret
	} else {
		let message = format!(
			"Input set has {} UTXOs while the supported set length should be one of {:?}",
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
      "Indices Array don't match with the Input size , supplied {} indices while there are {} utxos in the input ",
      indices.len(),
      in_utxos.len(),
    );
		return Err(OperationError::new_with_message(
			OpStatusCode::InvalidProofParameters,
			message,
		));
	}
	// Insure the Anchor count is supported
	if !SUPPORTED_ANCHOR_COUNT.contains(&roots.len()) {
		let message = format!(
			"Input set has {} roots while the supported set length should be one of {:?}",
			&roots.len(),
			&SUPPORTED_ANCHOR_COUNT,
		);
		return Err(OperationError::new_with_message(
			OpStatusCode::InvalidProofParameters,
			message,
		));
	};
	// Initialize the output notes vec
	let mut output_notes = vec![];
	let proof = match (backend, curve, roots.len()) {
		(Backend::Arkworks, Curve::Bn254, 2) => {
			let utxo_o_1 = VAnchorR1CSProverBn254_30_2_2_2::create_random_utxo(
				ArkCurve::Bn254,
				output_config[0].chain_id,
				output_config[0].amount,
				None,
				rng,
			)
			.unwrap();
			let utxo_o_2 = VAnchorR1CSProverBn254_30_2_2_2::create_random_utxo(
				ArkCurve::Bn254,
				output_config[1].chain_id,
				output_config[1].amount,
				None,
				rng,
			)
			.unwrap();
			let utxos_out = [utxo_o_1.clone(), utxo_o_2.clone()];
			output_notes = get_output_notes(&vanchor_proof_input, [
				JsUtxo::new_from_bn254_utxo(utxo_o_1),
				JsUtxo::new_from_bn254_utxo(utxo_o_2),
			])?
			.to_vec();
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
						"The proofing setup for backend {} curve {} width {} exp {} input size {} isn't implemented!",
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
				"The proofing setup for backend {} curve {} width {} exp {} input size {} isn't implemented!",
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
		let message = format!("Anchor {}", e);
		OperationError::new_with_message(OpStatusCode::InvalidProofParameters, message)
	})?;
	Ok(VAnchorProof {
		proof: proof.proof,
		public_inputs: proof.public_inputs_raw,
		output_notes: output_notes.to_vec(),
		input_utxos: in_utxos,
	})
}
