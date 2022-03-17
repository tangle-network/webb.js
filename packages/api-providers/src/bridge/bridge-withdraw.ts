import { Bridge, MixerWithdraw, WebbApiProvider } from '../webb-context';
import { InternalChainId } from '../chains';

export abstract class BridgeWithdraw<T extends WebbApiProvider<any>> extends MixerWithdraw<T> {
  get tokens() {
    return Bridge.getTokens(this.inner.config.currencies);
  }

  getTokensOfChain(chainId: InternalChainId) {
    return Bridge.getTokensOfChain(this.inner.config.currencies, chainId);
  }
}
