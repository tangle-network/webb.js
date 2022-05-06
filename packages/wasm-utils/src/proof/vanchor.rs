use ark_bn254::Bn254;
use core::convert::TryInto;

use arkworks_setups::utxo::Utxo;
use arkworks_setups::{AnchorProver, Curve as ArkCurve, VAnchorProver};
use rand::rngs::OsRng;

use crate::proof::{AnchorProofInput, Proof, VAnchorProofInput};
use crate::types::{Backend, Curve, OpStatusCode, OperationError};
use crate::utxo::JsUtxo;
use crate::{AnchorR1CSProverBls381_30_2, AnchorR1CSProverBn254_30_2, VAnchorR1CSProverBn254_30_2_2_2, DEFAULT_LEAF};

pub fn create_proof(anchor_proof_input: VAnchorProofInput, rng: &mut OsRng) -> Result<Proof, OperationError> {
	let VAnchorProofInput {
		public_amount,
		notes,
		backend,
		curve,
		width,

		indices,
		leaves,
		exponentiation,
		roots,
		pk,
		chain_id,
	} = anchor_proof_input;
	let in_utxos: Vec<JsUtxo> = match notes.len() {
		2 | 16 => {
			//notes.iter().map(|note| note.get_utxo())
			unreachable!();
		}
		length if length > 16 && length < 2 => {
			// Create empty utxos to fill the list with  16 utxos
			unreachable!();
		}
		1 => {
			// create one empty utxo to fill the list with 2 utxo
			unreachable!();
		}
		length => {
			return Err(OperationError::new_with_message(
				OpStatusCode::InvalidNoteLength,
				format!("The number of supplied notes {} can't be used for prooving ", length),
			));
		}
	};
	//TODO: match on the root set length for getting the anchor count
	// TODO: use the anchor count,the Ins count,Curve=bn254 Outs count =2, to get
	// the corresponding
	// VAnchorR1CSProver${curve=bn254}_${tree_height=32}_${anchor_count}_${ins_count}_${outs_count=2}
	let utxo = VAnchorR1CSProverBn254_30_2_2_2::create_random_utxo(ArkCurve::Bn254, 0, 0, None, &mut OsRng).unwrap();
	let utxos_in = [utxo.clone(), utxo.clone()];
	let utxos_out = [utxo.clone(), utxo.clone()];
	let anchor_proof = match (backend, curve, exponentiation, width) {
		(Backend::Arkworks, Curve::Bn254, 5, 4) => VAnchorR1CSProverBn254_30_2_2_2::create_proof(
			ArkCurve::Bn254,
			chain_id,
			public_amount,
			Default::default(),
			[vec![], vec![]],
			Default::default(),
			leaves,
			utxos_out,
			utxos_in,
			pk,
			DEFAULT_LEAF,
			rng,
		),
		_ => return Err(OpStatusCode::InvalidProofParameters.into()),
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
