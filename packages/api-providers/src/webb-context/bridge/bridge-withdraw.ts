import {Bridge, InternalChainId, MixerWithdraw, WebbApiProvider} from "@webb-tools/api-providers";

export abstract class BridgeWithdraw<T extends WebbApiProvider<any>> extends MixerWithdraw<T> {
  get tokens() {
    return Bridge.getTokens(this.inner.config.currencies);
  }

  getTokensOfChain(chainId: InternalChainId) {
    return Bridge.getTokensOfChain(this.inner.config.currencies, chainId);
  }
}
