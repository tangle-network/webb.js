import { ChainType, ChainTypeId } from './chain-id.enum';
import { expect } from 'chai';
import { byteArrayToNum, numToByteArray, computeChainIdType, parseChainIdType } from './chain-utils';

// TODO: Move utils and tests to webb.js
describe('test various conversion functions', () => {
  test('byte array to num converts correctly', () => {
    const arr = [2, 0, 0, 0, 122, 105];
    const result = 2199023286889;
    expect(byteArrayToNum(arr)).to.deep.equal(result);
  });

  test('numToByteArray converts correctly', () => {
    const arrResult = [2, 0, 0, 0, 122, 105];
    const number = 2199023286889;
    expect(numToByteArray(number, 4)).to.deep.equal(arrResult);
  });

  test('numToByteArray converts hexstring values correctly', () => {
    const evmResult = [1, 0];
    expect(numToByteArray(ChainType.EVM, 2)).to.deep.equal(evmResult);
    const kusamaParachainResult = [3, 17];
    expect(numToByteArray(ChainType.KusamaParachain, 2)).to.deep.equal(kusamaParachainResult);
  });

  test('numToByteArray maintains minimum size with leading zeroes', () => {
    const arrResult = [0, 0, 122, 105];
    const number = 31337;
    expect(numToByteArray(number, 4)).to.deep.equal(arrResult);
  });

  test('computeChainIdType converts correctly', () => {
    const chainType = ChainType.Substrate;
    const chainId = 31337;
    const chainIdTypeResult = 2199023286889;
    expect(computeChainIdType(chainType, chainId)).to.deep.equal(chainIdTypeResult);
  });

  test('typeAndIdFromChainIdType converts correctly', () => {
    const chainIdType = 2199023286889;
    const chainTypeResult = ChainType.Substrate;
    const chainIdResult = 31337;

    const result: ChainTypeId = {
      chainType: chainTypeResult,
      chainId: chainIdResult
    };
    expect(parseChainIdType(chainIdType)).to.deep.equal(result);
  });
});
