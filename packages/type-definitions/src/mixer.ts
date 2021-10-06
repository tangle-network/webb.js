export default {
  rpc: {},
  types: {
    CurrencyId: 'u64',
    Amount: 'i128',
    AmountOf: 'Amount',
    CurrencyIdOf: 'CurrencyId',
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
      /// Id of the currency in the mixer
      currency_id: 'CurrencyIdOf'
    },
    WithdrawProof: {
      /// The mixer id this withdraw proof corresponds to
      mixer_id: 'TreeId',
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
    },

    ///////
    Element: 'Vec<u8>',
    NodeTemplateRuntimeElement: 'Vec<u8>',
    // Anchor
    PalletMixerMixerMetadata: {
      creator: 'AccountId',
      deposit_size: 'Balance',
      asset: 'AssetId'
    },
    PalletAnchorAnchorMetadata: {
      creator: 'AccountId',
      deposit_size: 'Balance'
    },
    PalletAnchorEdgeMetadata: {
      src_chain_id: 'ChainId',
      root: 'Element',
      height: 'BlockNumber'
    },
    // Anchor handler
    PalletAnchorHandlerUpdateRecord: {
      tree_id: 'TreeId',
      resource_id: 'ResourceId',
      edge_metadata: 'PalletAnchorEdgeMetadata'
    },
    // AssetRegistry
    PalletAssetRegistryAssetType: {
      _enum: ['Token', 'PoolShare']
    },
    PalletAssetRegistryAssetMetadata: {
      symbol: 'Vec<u8>',
      decimals: 'u8'
    },
    ResourceId: '[u8; 32]',
    PalletAssetRegistryAssetDetails: {
      name: 'Vec<u8>',
      asset_type: 'PalletAssetRegistryAssetType',
      existential_deposit: 'Balance',
      locked: 'bool'
    },
    // primitives
    DarkwebbPrimitivesDepositDetails: {
      depositor: 'AccountId',
      deposit: 'Balance'
    }
  },
  typesAlias: {}
};
