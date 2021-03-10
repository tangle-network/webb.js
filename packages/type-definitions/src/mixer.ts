export default {
  rpc: {},
  types: {
    EvmAddress: 'H160',
    TokenSymbol: {
      _enum: ['EDG']
    },
    CurrencyId: {
      _enum: {
        Token: 'TokenSymbol',
        DEXShare: '(TokenSymbol, TokenSymbol)',
        ERC20: 'EvmAddress'
      }
    },
    /// Scalar data type for field elements, 32 bytes are needed
    ScalarData: '[u8; 32]',
    /// Nullifiers for mixer deposits
    Nullifier: 'ScalarData',
    /// Commitment data type
    Commitment: 'ScalarData',
    MixerInfo: {
      /// Minimum duration the deposit has stayed in the mixer for a user
      minimum_deposit_length_for_reward: 'BlockNumber',
      /// Deposit size for the mixer
      fixed_deposit_size: 'Balance',
      /// All the leaves/deposits of the mixer
      leaves: 'Vec<ScalarData>'
    },
    WithdrawProof: {
      /// The mixer id this withdraw proof corresponds to
      mixer_id: 'GroupId',
      /// The cached block for the cached root being proven against
      cached_block: 'BlockNumber',
      /// The cached root being proven against
      cached_root: 'ScalarData',
      /// The individual scalar commitments (to the randomness and nullifier)
      comms: 'Vec<Commitment>',
      /// The nullifier hash with itself
      nullifier_hash: 'ScalarData',
      /// The proof in bytes representation
      proof_bytes: 'Vec<u8>',
      /// The leaf index scalar commitments to decide on which side to hash
      leaf_index_commitments: 'Vec<Commitment>',
      /// The scalar commitments to merkle proof path elements
      proof_commitments: 'Vec<Commitment>',
      /// The recipient to withdraw amount of currency to
      recipient: 'Option<AccountId>',
      /// The recipient to withdraw amount of currency to
      relayer: 'Option<AccountId>'
    }
  },
  typesAlias: {}
};
