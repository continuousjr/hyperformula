import {absoluteCellAddress, cellAddressFromString, relativeCellAddress} from '../src/Cell'

describe('cellAddressFromString', () => {
  it('is zero based', () => {
    expect(cellAddressFromString('A1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(0, 0))
  })

  it('works for bigger rows', () => {
    expect(cellAddressFromString('A123', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(0, 122))
  })

  it('one letter', () => {
    expect(cellAddressFromString('Z1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(25, 0))
  })

  it('last letter is Z', () => {
    expect(cellAddressFromString('AA1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(26, 0))
  })

  it('works for many letters', () => {
    expect(cellAddressFromString('ABC1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(730, 0))
  })

  it('is not case sensitive', () => {
    expect(cellAddressFromString('abc1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(730, 0))
  })
})
