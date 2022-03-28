// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0
import { AppConfig } from '@webb-tools/api-providers';
import { ChainType, EVMChainId, InternalChainId, SubstrateChainId } from '@webb-tools/api-providers/chains';
import { ZERO, zeroAddress } from '@webb-tools/api-providers/contracts';
import { WebbCurrencyId } from '@webb-tools/api-providers/enums';
import { CurrencyRole, CurrencyType } from '@webb-tools/api-providers/types/currency-config.interface';

const anchorsConfig: AppConfig['anchors'] = {
  [WebbCurrencyId.webbWETH]: [
    {
      amount: '0.1',
      anchorTreeIds: {},
      anchorAddresses: {
        [InternalChainId.Ropsten]: '0x97747a4De7302Ff7Ee3334e33138879469BFEcf8',
        [InternalChainId.Rinkeby]: '0x09B722aA809A076027FA51902e431a8C03e3f8dF',
        [InternalChainId.Goerli]: '0x6aA5C74953F7Da1556a298C5e129E417410474E2',
        [InternalChainId.PolygonTestnet]: '0x12323BcABB342096669d80F968f7a31bdB29d4C4',
        [InternalChainId.OptimismTestnet]: '0xC44A4EcAC4f23b6F92485Cb1c90dBEd75a987BC8',
        [InternalChainId.ArbitrumTestnet]: '0xD8a8F9629a98EABFF31CfA9493f274A4D5e768Cd'
      }
    }
  ],
  [WebbCurrencyId.WEBB]: [
    {
      amount: '10',
      anchorTreeIds: {
        [InternalChainId.WebbDevelopment]: '3'
      },
      anchorAddresses: {}
    },
    {
      amount: '100',
      anchorTreeIds: {
        [InternalChainId.WebbDevelopment]: '4'
      },
      anchorAddresses: {}
    },
    {
      amount: '1000',
      anchorTreeIds: {
        [InternalChainId.WebbDevelopment]: '5'
      },
      anchorAddresses: {}
    }
  ],
  [WebbCurrencyId.webbDEV]: [
    {
      amount: '1',
      anchorTreeIds: {},
      anchorAddresses: {
        [InternalChainId.HermesLocalnet]: '0x510C6297cC30A058F41eb4AF1BFC9953EaD8b577',
        [InternalChainId.AthenaLocalnet]: '0x7758F98C1c487E5653795470eEab6C4698bE541b'
      }
    }
  ]
};
const chainsConfig: AppConfig['chains'] = {
  [InternalChainId.WebbDevelopment]: {
    chainType: ChainType.Substrate,
    id: InternalChainId.WebbDevelopment,
    group: 'webb',
    tag: 'dev',
    chainId: SubstrateChainId.Webb,
    logo: undefined,
    url: 'ws://127.0.0.1:9944',
    name: 'Webb Development',
    currencies: [WebbCurrencyId.WEBB],
    nativeCurrencyId: WebbCurrencyId.WEBB
  },
  // this is the EVM edgeware
  [InternalChainId.EdgewareTestNet]: {
    chainType: ChainType.EVM,
    group: 'edgeware',
    tag: 'test',
    id: InternalChainId.EdgewareTestNet,
    chainId: EVMChainId.Beresheet,
    name: 'Beresheet (Edgeware Testnet)',
    url: 'wss://beresheet1.edgewa.re',
    evmRpcUrls: ['https://beresheet.edgewa.re/evm'],
    logo: undefined,
    currencies: [WebbCurrencyId.TEDG],
    nativeCurrencyId: WebbCurrencyId.TEDG
  },
  // [ChainId.Edgeware]: {
  // chainType: ChainType,
  //   group: 'edgeware',
  //   tag: 'live',
  //   id: ChainId.Edgeware,
  //   evmId: EVMChain.Edgeware,
  //   name: 'Edgeware',
  //   evmRpcUrls: ['https://mainnet.edgewa.re/evm'],
  //   url: 'wss://mainnet1.edgewa.re',
  //   logo: undefined,
  //   currencies: [
  //     {
  //       currencyId: WebbCurrencyId.EDG,
  //       enabled: true,
  //     },
  //   ],
  //   nativeCurrencyId: WebbCurrencyId.EDG,
  // },

  [InternalChainId.Rinkeby]: {
    chainType: ChainType.EVM,
    group: 'eth',
    id: InternalChainId.Rinkeby,
    chainId: EVMChainId.Rinkeby,
    name: 'Rinkeby',
    url: 'https://rinkeby.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4',
    evmRpcUrls: ['https://rinkeby.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'],
    blockExplorerStub: 'https://rinkeby.etherscan.io',
    logo: undefined,
    tag: 'test',
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    nativeCurrencyId: WebbCurrencyId.ETH
  },
  [InternalChainId.Ropsten]: {
    chainType: ChainType.EVM,
    group: 'eth',
    id: InternalChainId.Ropsten,
    chainId: EVMChainId.Ropsten,
    name: 'Ropsten',
    url: 'https://ropsten.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4',
    evmRpcUrls: ['https://ropsten.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'],
    blockExplorerStub: 'https://ropsten.etherscan.io',
    logo: undefined,
    tag: 'test',
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    nativeCurrencyId: WebbCurrencyId.ETH
  },
  [InternalChainId.Goerli]: {
    chainType: ChainType.EVM,
    group: 'eth',
    id: InternalChainId.Goerli,
    chainId: EVMChainId.Goerli,
    name: 'Goerli',
    url: 'https://goerli.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4',
    evmRpcUrls: ['https://goerli.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'],
    blockExplorerStub: 'https://goerli.etherscan.io',
    logo: undefined,
    tag: 'test',
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    nativeCurrencyId: WebbCurrencyId.ETH
  },
  [InternalChainId.Kovan]: {
    chainType: ChainType.EVM,
    group: 'eth',
    id: InternalChainId.Kovan,
    chainId: EVMChainId.Kovan,
    name: 'Kovan',
    url: 'https://kovan.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4',
    evmRpcUrls: ['https://goerli.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'],
    blockExplorerStub: 'https://kovan.etherscan.io',
    logo: undefined,
    tag: 'test',
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    nativeCurrencyId: WebbCurrencyId.ETH
  },
  [InternalChainId.OptimismTestnet]: {
    chainType: ChainType.EVM,
    group: 'eth',
    id: InternalChainId.OptimismTestnet,
    chainId: EVMChainId.OptimismTestnet,
    name: 'Optimism Testnet',
    url: 'https://kovan.optimism.io',
    evmRpcUrls: ['https://kovan.optimism.io'],
    blockExplorerStub: 'https://kovan-optimistic.etherscan.io',
    logo: undefined,
    tag: 'test',
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    nativeCurrencyId: WebbCurrencyId.ETH
  },
  [InternalChainId.ArbitrumTestnet]: {
    chainType: ChainType.EVM,
    group: 'eth',
    id: InternalChainId.ArbitrumTestnet,
    chainId: EVMChainId.ArbitrumTestnet,
    name: 'Arbitrum Testnet',
    url: 'https://rinkeby.arbitrum.io/rpc',
    evmRpcUrls: ['https://rinkeby.arbitrum.io/rpc'],
    blockExplorerStub: 'https://testnet.arbiscan.io',
    logo: undefined,
    tag: 'test',
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    nativeCurrencyId: WebbCurrencyId.ETH
  },
  [InternalChainId.HarmonyTestnet1]: {
    chainType: ChainType.EVM,
    group: 'one',
    id: InternalChainId.HarmonyTestnet1,
    chainId: EVMChainId.HarmonyTestnet1,
    name: 'Harmony Testnet Shard 1',
    tag: 'test',
    url: 'https://api.s1.b.hmny.io',
    evmRpcUrls: ['https://api.s1.b.hmny.io'],
    logo: undefined,
    currencies: [WebbCurrencyId.ONE],
    nativeCurrencyId: WebbCurrencyId.ONE
  },
  // [ChainId.HarmonyTestnet0]: {
  // chainType: ChainType,
  //   group: 'one',
  //   id: ChainId.HarmonyTestnet0,
  //   evmId: EVMChain.HarmonyTestnet0,
  //   name: 'Harmony Testnet Shard 0',
  //   tag: 'test',
  //   url: 'https://api.s0.b.hmny.io',
  //   evmRpcUrls: ['https://api.s0.b.hmny.io'],
  //   logo: undefined,
  //   currencies: [
  //     {
  //       currencyId: WebbCurrencyId.ONE,
  //       enabled: true,
  //     },
  //   ],
  //   nativeCurrencyId: WebbCurrencyId.ONE,
  // },
  [InternalChainId.HarmonyMainnet0]: {
    chainType: ChainType.EVM,
    group: 'one',
    id: InternalChainId.HarmonyMainnet0,
    chainId: EVMChainId.HarmonyMainnet0,
    name: 'Harmony Mainnet Shard 0',
    tag: 'live',
    url: 'https://api.harmony.one',
    evmRpcUrls: ['https://api.harmony.one'],
    logo: undefined,
    currencies: [WebbCurrencyId.ONE],
    nativeCurrencyId: WebbCurrencyId.ONE
  },
  // [ChainId.EthereumMainNet]: {
  // chainType: ChainType,
  //   group: 'eth',
  //   id: ChainId.EthereumMainNet,
  //   evmId: EVMChain.EthereumMainNet,
  //   name: 'Ethereum mainnet',
  //   tag: 'live',
  //   url: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  //   evmRpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
  //   logo: undefined,
  //   currencies: [
  //     {
  //       currencyId: WebbCurrencyId.ETH,
  //       enabled: true,
  //     },
  //   ],
  //   nativeCurrencyId: WebbCurrencyId.ETH,
  // },
  [InternalChainId.Shiden]: {
    chainType: ChainType.EVM,
    group: 'sdn',
    id: InternalChainId.Shiden,
    chainId: EVMChainId.Shiden,
    name: 'Shiden',
    tag: 'live',
    url: 'https://shiden.api.onfinality.io/public',
    evmRpcUrls: ['https://shiden.api.onfinality.io/public'],
    blockExplorerStub: 'https://shiden.subscan.io',
    logo: undefined,
    currencies: [WebbCurrencyId.SDN],
    nativeCurrencyId: WebbCurrencyId.SDN
  },
  [InternalChainId.PolygonTestnet]: {
    chainType: ChainType.EVM,
    group: 'matic',
    id: InternalChainId.PolygonTestnet,
    chainId: EVMChainId.PolygonTestnet,
    name: 'Polygon Testnet',
    tag: 'test',
    url: 'https://rpc-mumbai.maticvigil.com/',
    evmRpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
    blockExplorerStub: 'https://mumbai.polygonscan.com/',
    logo: undefined,
    currencies: [WebbCurrencyId.MATIC, WebbCurrencyId.WETH],
    nativeCurrencyId: WebbCurrencyId.MATIC
  },
  [InternalChainId.HermesLocalnet]: {
    chainType: ChainType.EVM,
    group: 'eth',
    id: InternalChainId.HermesLocalnet,
    chainId: EVMChainId.HermesLocalnet,
    name: 'Hermes Localnet',
    tag: 'dev',
    url: 'http://127.0.0.1:5001',
    evmRpcUrls: ['http://127.0.0.1:5001'],
    logo: undefined,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.DEV],
    nativeCurrencyId: WebbCurrencyId.ETH
  },
  [InternalChainId.AthenaLocalnet]: {
    chainType: ChainType.EVM,
    group: 'eth',
    id: InternalChainId.AthenaLocalnet,
    chainId: EVMChainId.AthenaLocalnet,
    name: 'Athena Localnet',
    tag: 'dev',
    url: 'http://127.0.0.1:5002',
    evmRpcUrls: ['http://127.0.0.1:5002'],
    logo: undefined,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.DEV],
    nativeCurrencyId: WebbCurrencyId.ETH
  }
};
const bridgeConfigByAsset: AppConfig['bridgeByAsset'] = {
  [WebbCurrencyId.webbWETH]: {
    asset: WebbCurrencyId.webbWETH,
    anchors: anchorsConfig[WebbCurrencyId.webbWETH]
  },
  [WebbCurrencyId.WEBB]: {
    asset: WebbCurrencyId.WEBB,
    anchors: anchorsConfig[WebbCurrencyId.WEBB]
  },
  [WebbCurrencyId.webbDEV]: {
    asset: WebbCurrencyId.webbDEV,
    anchors: anchorsConfig[WebbCurrencyId.webbDEV]
  }
};
const currenciesConfig: AppConfig['currencies'] = {
  [WebbCurrencyId.EDG]: {
    name: 'Edgeware token',
    symbol: 'EDG',
    color: '',
    id: WebbCurrencyId.EDG,
    type: CurrencyType.ORML,
    role: CurrencyRole.Wrappable,
    icon: undefined,
    addresses: new Map()
  },
  [WebbCurrencyId.TEDG]: {
    name: 'Edgeware testnet token',
    symbol: 'tEDG',
    color: '',
    id: WebbCurrencyId.TEDG,
    type: CurrencyType.ORML,
    role: CurrencyRole.Wrappable,
    icon: undefined,
    addresses: new Map()
  },
  [WebbCurrencyId.ETH]: {
    name: 'Ethereum',
    symbol: 'ETH',
    color: '',
    id: WebbCurrencyId.ETH,
    type: CurrencyType.NATIVE,
    role: CurrencyRole.Wrappable,
    icon: undefined,
    addresses: new Map([
      [InternalChainId.Ropsten, zeroAddress],
      [InternalChainId.Rinkeby, zeroAddress],
      [InternalChainId.Goerli, zeroAddress],
      [InternalChainId.Kovan, zeroAddress],
      [InternalChainId.OptimismTestnet, zeroAddress],
      [InternalChainId.ArbitrumTestnet, zeroAddress],
      [InternalChainId.HermesLocalnet, zeroAddress],
      [InternalChainId.AthenaLocalnet, zeroAddress]
    ])
  },
  [WebbCurrencyId.ONE]: {
    name: 'Harmony',
    symbol: 'ONE',
    color: '',
    id: WebbCurrencyId.ONE,
    type: CurrencyType.NATIVE,
    role: CurrencyRole.Wrappable,
    icon: undefined,
    addresses: new Map([
      [InternalChainId.HarmonyMainnet0, zeroAddress],
      [InternalChainId.HarmonyTestnet0, zeroAddress],
      [InternalChainId.HarmonyTestnet1, zeroAddress]
    ])
  },
  [WebbCurrencyId.WEBB]: {
    // IS THIS AN EVM CHAIN?
    name: 'WEBB',
    symbol: 'WEBB',
    color: '',
    id: WebbCurrencyId.WEBB,
    type: CurrencyType.ORML,
    role: CurrencyRole.Governable,
    icon: undefined,
    addresses: new Map([[InternalChainId.WebbDevelopment, ZERO]])
  },
  [WebbCurrencyId.SDN]: {
    name: 'Shiden',
    symbol: 'SDN',
    color: '',
    id: WebbCurrencyId.SDN,
    type: CurrencyType.NATIVE,
    role: CurrencyRole.Wrappable,
    icon: undefined,
    addresses: new Map([[InternalChainId.Shiden, zeroAddress]])
  },
  [WebbCurrencyId.WETH]: {
    name: 'Wrapped Ethereum',
    symbol: 'WETH',
    color: '',
    id: WebbCurrencyId.WETH,
    type: CurrencyType.ERC20,
    role: CurrencyRole.Wrappable,
    imageUrl: 'https://www.polysa.finance/images/farms/weth.png',
    icon: undefined,
    addresses: new Map([
      [InternalChainId.Ropsten, '0xc778417E063141139Fce010982780140Aa0cD5Ab'],
      [InternalChainId.Rinkeby, '0xc778417E063141139Fce010982780140Aa0cD5Ab'],
      [InternalChainId.Goerli, '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'],
      [InternalChainId.Kovan, '0xd0A1E359811322d97991E03f863a0C30C2cF029C'],
      [InternalChainId.OptimismTestnet, '0xbC6F6b680bc61e30dB47721c6D1c5cde19C1300d'],
      [InternalChainId.ArbitrumTestnet, '0xEBbc3452Cc911591e4F18f3b36727Df45d6bd1f9'],
      [InternalChainId.PolygonTestnet, '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889']
    ])
  },
  [WebbCurrencyId.MATIC]: {
    name: 'Polygon',
    symbol: 'MATIC',
    color: '',
    id: WebbCurrencyId.MATIC,
    type: CurrencyType.NATIVE,
    role: CurrencyRole.Wrappable,
    icon: undefined,
    addresses: new Map([[InternalChainId.PolygonTestnet, zeroAddress]])
  },
  [WebbCurrencyId.webbWETH]: {
    name: 'webbETH-test-1',
    symbol: 'webbWETH',
    color: '',
    id: WebbCurrencyId.webbWETH,
    type: CurrencyType.ERC20,
    role: CurrencyRole.Governable,
    icon: undefined,
    addresses: new Map([
      [InternalChainId.Ropsten, '0x105779076d17FAe5EAADF010CA677475549F49E4'],
      [InternalChainId.Rinkeby, '0x4e7D4BEe028655F2865d9D147cF7B609c516d39C'],
      [InternalChainId.Goerli, '0x5257c558c246311552A824c491285667B3a445a2'],
      [InternalChainId.PolygonTestnet, '0x50A7b748F3C50F808a289cA041E48834A41A6d95'],
      [InternalChainId.OptimismTestnet, '0xEAF873F1F6c91fEf73d4839b5fC7954554BBE518'],
      [InternalChainId.ArbitrumTestnet, '0xD6F1E78B5F1Ebf8fF5a60C9d52eabFa73E5c5220']
    ])
  },
  [WebbCurrencyId.DEV]: {
    name: 'Development Token',
    symbol: 'DEV',
    color: '',
    id: WebbCurrencyId.DEV,
    type: CurrencyType.ERC20,
    role: CurrencyRole.Wrappable,
    icon: undefined,
    addresses: new Map([
      [InternalChainId.HermesLocalnet, '0x2946259E0334f33A064106302415aD3391BeD384'],
      [InternalChainId.AthenaLocalnet, '0xF2E246BB76DF876Cef8b38ae84130F4F55De395b']
    ])
  },
  [WebbCurrencyId.webbDEV]: {
    name: 'Webb Development Token',
    symbol: 'webbDEV',
    color: '',
    id: WebbCurrencyId.webbDEV,
    type: CurrencyType.ERC20,
    role: CurrencyRole.Governable,
    icon: undefined,
    addresses: new Map([
      [InternalChainId.HermesLocalnet, '0xD24260C102B5D128cbEFA0F655E5be3c2370677C'],
      [InternalChainId.AthenaLocalnet, '0xD30C8839c1145609E564b986F667b273Ddcb8496']
    ])
  }
};

const mixersConfig: AppConfig['mixers'] = {
  [InternalChainId.Edgeware]: {
    tornMixers: [
      {
        size: 10000,
        address: '0x2B9A7085Afba278BEc6bBfFb399A3C042ED05046',
        symbol: 'EDG',
        createdAtBlock: 8828000
      }
    ]
  },
  [InternalChainId.EdgewareTestNet]: {
    tornMixers: [
      {
        size: 10,
        address: '0xf0EA8Fa17daCF79434d10C51941D8Fc24515AbE3',
        symbol: 'tEDG',
        createdAtBlock: 299740
      },
      {
        size: 100,
        address: '0xc0d863EE313636F067dCF89e6ea904AD5f8DEC65',
        symbol: 'tEDG',
        createdAtBlock: 299740
      },
      {
        size: 1000,
        address: '0xc7c6152214d0Db4e161Fa67fB62811Be7326834A',
        symbol: 'tEDG',
        createdAtBlock: 299740
      },
      {
        size: 10000,
        address: '0xf0290d80880E3c59512e454E303FcD48f431acA3',
        symbol: 'tEDG',
        createdAtBlock: 299740
      }
    ]
  },
  [InternalChainId.Rinkeby]: {
    tornMixers: [
      {
        size: 0.1,
        address: '0x626FEc5Ffa7Bf1EE8CEd7daBdE545630473E3ABb',
        symbol: 'ETH',
        createdAtBlock: 8896800 // should be hardcoded to deployed block number
      },
      {
        size: 1,
        address: '0x979cBd4917e81447983ef87591B9E1ab21727a61',
        symbol: 'ETH',
        createdAtBlock: 8896800
      }
    ]
  },
  [InternalChainId.HarmonyTestnet1]: {
    tornMixers: [
      {
        size: 100,
        address: '0x7cd1F52e5EEdf753e99D945276a725CE533AaD1a',
        symbol: 'ONE',
        createdAtBlock: 12040000
      },
      {
        size: 1000,
        address: '0xD7f9BB9957100310aD397D2bA31771D939BD4731',
        symbol: 'ONE',
        createdAtBlock: 12892487
      },
      {
        size: 10000,
        address: '0xeE2eB8F142e48e5D1bDD34e0924Ed3B4aa0d4222',
        symbol: 'ONE',
        createdAtBlock: 12892648
      },
      {
        size: 100000,
        address: '0x7cd173094eF78FFAeDee4e14576A73a79aA716ac',
        symbol: 'ONE',
        createdAtBlock: 12892840
      }
    ]
  },
  [InternalChainId.HarmonyMainnet0]: {
    tornMixers: [
      {
        size: 100,
        address: '0x2B9A7085Afba278BEc6bBfFb399A3C042ED05046',
        symbol: 'ONE',
        createdAtBlock: 18796580
      },
      {
        size: 10000,
        address: '0x4b271E1E67B3eE56467599cd46f1F74A5a369c72',
        symbol: 'ONE',
        createdAtBlock: 18796580
      }
    ]
  },
  [InternalChainId.Shiden]: {
    tornMixers: [
      {
        size: 10,
        address: '0x2B9A7085Afba278BEc6bBfFb399A3C042ED05046',
        symbol: 'SDN',
        createdAtBlock: 566000
      },
      {
        size: 1000,
        address: '0x548555a3275B6fadD5d2B9740a7655cB7f856148',
        symbol: 'SDN',
        createdAtBlock: 568000
      }
    ]
  }
};
const walletsConfig: AppConfig['wallet'] = {};

export const mockAppConfig: AppConfig = {
  anchors: anchorsConfig,
  bridgeByAsset: bridgeConfigByAsset,
  chains: chainsConfig,
  currencies: currenciesConfig,
  mixers: mixersConfig,
  wallet: walletsConfig
};
