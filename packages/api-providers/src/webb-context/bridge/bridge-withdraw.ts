import { MixerWithdraw } from '../mixer/mixer-withdraw';
import { InternalChainId } from '../../chains';
import { Bridge } from './bridge';
import { WebbApiProvider } from '../webb-provider.interface';

export abstract class BridgeWithdraw<T extends WebbApiProvider<any>> extends MixerWithdraw<T> {
  get tokens() {
    return Bridge.getTokens(this.inner.config.currencies);
  }

  getTokensOfChain(chainId: InternalChainId) {
    return Bridge.getTokensOfChain(this.inner.config.currencies, chainId);
  }
}
