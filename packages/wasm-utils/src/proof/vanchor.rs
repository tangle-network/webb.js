use core::convert::TryInto;

use ark_bn254::Fr as Bn254Fr;
use ark_crypto_primitives::Error;
use ark_ff::{BigInteger, PrimeField};
use ark_std::UniformRand;
use arkworks_setups::utxo::Utxo;
use arkworks_setups::{AnchorProver, Curve as ArkCurve, VAnchorProver};
use rand::rngs::OsRng;

use crate::proof::{AnchorProofPayload, Proof, VAnchorProofPayload};
use crate::types::{Backend, Curve, OpStatusCode, OperationError};
use crate::utxo::JsUtxo;
use crate::{
	AnchorR1CSProverBls381_30_2, AnchorR1CSProverBn254_30_2, VAnchorR1CSProverBn254_30_2_16_2,
	VAnchorR1CSProverBn254_30_2_2_2, DEFAULT_LEAF,
};

pub fn create_proof(anchor_proof_input: VAnchorProofPayload, rng: &mut OsRng) -> Result<Proof, OperationError> {
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
	} = anchor_proof_input;
	// Prepare in UTXOs
	let in_utxos: Vec<JsUtxo> = match secret.len() {
		2 | 16 => secret,
		length if length < 16 && length > 2 => {
			let mut utxos: Vec<JsUtxo> = secret;
			let utxo =
				VAnchorR1CSProverBn254_30_2_2_2::create_random_utxo(ArkCurve::Bn254, 0, 0, None, &mut OsRng).unwrap();
			// Create empty UTXOs to fill the list with  16 UTXOs
			let js_utxo = JsUtxo::new_from_bn254_utxo(utxo);
			loop {
				if utxos.len() == 16 {
					break;
				}
				utxos.push(js_utxo.clone())
			}
			utxos
		}
		1 => {
			let utxo =
				VAnchorR1CSProverBn254_30_2_2_2::create_random_utxo(ArkCurve::Bn254, 0, 0, None, &mut OsRng).unwrap();
			let utxo = JsUtxo::new_from_bn254_utxo(utxo);
			vec![secret[0].clone(), utxo]
		}
		length => {
			return Err(OperationError::new_with_message(
				OpStatusCode::InvalidNoteLength,
				format!("The number of supplied notes {} can't be used for prooving ", length),
			));
		}
	};
	// TODO : handle ext data
	let ext_data_hash = Bn254Fr::rand(rng).into_repr().to_bytes_le();

	let utxo_o_1 = VAnchorR1CSProverBn254_30_2_2_2::create_random_utxo(
		ArkCurve::Bn254,
		output_config[0].chain_id,
		output_config[0].amount,
		output_config[0].index,
		&mut OsRng,
	)
	.unwrap();
	let utxo_o_2 = VAnchorR1CSProverBn254_30_2_2_2::create_random_utxo(
		ArkCurve::Bn254,
		output_config[1].chain_id,
		output_config[1].amount,
		output_config[1].index,
		&mut OsRng,
	)
	.unwrap();
	let utxos_out = [utxo_o_1, utxo_o_2];

	let anchor_proof = match (backend, curve, exponentiation, width, in_utxos.len()) {
		(Backend::Arkworks, Curve::Bn254, 5, 5, 2) => {
			let mut utxos_in: [Utxo<Bn254Fr>; 2] = [in_utxos[0].get_bn254_utxo()?, in_utxos[1].get_bn254_utxo()?];
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
				utxos_out,
				utxos_in,
				pk,
				DEFAULT_LEAF,
				rng,
			)
		}
		(Backend::Arkworks, Curve::Bn254, 5, 5, 16) => {
			let in_utxos = in_utxos
				.into_iter()
				.map(|utxo| utxo.get_bn254_utxo())
				.collect::<Result<Vec<_>, _>>()?;
			let boxed_slice = in_utxos.into_boxed_slice();
			let boxed_array: Box<[Utxo<Bn254Fr>; 16]> =
				boxed_slice.try_into().map_err(|_| OpStatusCode::InvalidNoteSecrets)?;
			let utxos_slice = *boxed_array;
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
				in_utxos.len(),
			);
			Err(Error::from(message))
		}
	}
	.map_err(|e| {
		let mut error: OperationError = OpStatusCode::InvalidProofParameters.into();
		error.data = Some(format!("Anchor {}", e));
		error
	})?;
	Ok(Proof {
		proof: anchor_proof.proof.clone(),
		nullifier_hash: vec![],
		root: vec![],
		roots: vec![],
		public_inputs: anchor_proof.public_inputs_raw,
		leaf: vec![],
	})
}
