// @flow

interface ISyntaxResult<T: string, V> {
  type: T,
  value: V,
}

export type TextResultType = ISyntaxResult<'text', string>
export type RegResultType = ISyntaxResult<'reg', string>
export type SeqResultType = ISyntaxResult<'seq', Array<TextResultType | RegResultType | SeqResultType>>
