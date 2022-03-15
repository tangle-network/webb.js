import { MixerWithdraw } from '../mixer/mixer-withdraw';
import { InternalChainId } from '../../chains';
import { Bridge } from '../../bridge';

export abstract class BridgeWithdraw<T> extends MixerWithdraw<T> {
  get tokens() {
    return Bridge.getTokens();
  }

  getTokensOfChain(chainId: InternalChainId) {
    return Bridge.getTokensOfChain(chainId);
  }
}
