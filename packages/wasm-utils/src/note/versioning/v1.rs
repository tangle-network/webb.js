use crate::note::*;
use crate::types::{OpStatusCode, OperationError};

pub fn note_from_str(s: &str) -> Result<JsNote, OperationError> {
	let parts: Vec<&str> = s.split(':').collect();
	let prefix = parts[0];
	let prefix_parts = prefix.split('.').collect::<Vec<&str>>();
	let protocol = if prefix_parts[1] == "bridge" || prefix_parts[1] == "anchor" {
		NoteProtocol::Anchor
	} else {
		NoteProtocol::Mixer
	};

	let version: NoteVersion = parts[1].parse()?;
	let target_chain_id = parts[2].to_string();
	let source_chain_id = parts[3].to_string();
	let backend: Backend = parts[4].parse()?;
	let curve: Curve = parts[5].parse()?;
	let hash_function: HashFunction = parts[6].parse()?;
	let token_symbol = parts[7].to_owned();
	let denomination = parts[8].parse().unwrap();
	let amount = parts[9].to_string();
	let exponentiation = parts[10].parse().unwrap();
	let width = parts[11].parse().unwrap();
	let note_val = parts[12];

	if note_val.is_empty() {
		return Err(OperationError::new_with_message(
			OpStatusCode::InvalidNoteSecrets,
			format!("Note value is empty"),
		));
	}
	let secrets: Vec<u8> = hex::decode(&note_val.replace("0x", "")).map_err(|_| {
		OperationError::new_with_message(
			OpStatusCode::HexParsingFailed,
			format!("Failed to parse note secrets value"),
		)
	})?;

	Ok(JsNote {
		scheme: prefix_parts[0].to_string(),
		protocol,
		version,
		source_identifying_data: source_chain_id.clone(),
		target_identifying_data: target_chain_id.clone(),
		source_chain_id,
		target_chain_id,
		token_symbol: Some(token_symbol),
		curve: Some(curve),
		hash_function: Some(hash_function),
		backend: Some(backend),
		denomination: Some(denomination),
		amount: Some(amount),
		exponentiation: Some(exponentiation),
		width: Some(width),
		secrets: vec![secrets],
	})
}
