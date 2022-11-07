import {toFixedHex} from "../big-number-utils.js";

describe('toFixedHex', ()=>{

  it('Should work without 0x prefix' , () =>{
    const hexString = `03ebdc6bff072a461c94a41fa0b3f726a5086a2ff7998e09eac6058f0b02abaa`;
    toFixedHex(hexString)
  })
  it('Should work with 0x prefix' ,()=>{
    const hexString = `03ebdc6bff072a461c94a41fa0b3f726a5086a2ff7998e09eac6058f0b02abaa`;
    toFixedHex(hexString)
  })

})
