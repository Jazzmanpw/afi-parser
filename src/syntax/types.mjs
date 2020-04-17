// @flow

interface ISyntaxResult<T: string, V> {
  type: T,
  value: V,
}

export type TextResultType = ISyntaxResult<'text', string>
export type RegResultType = ISyntaxResult<'reg', string>
export type AtomicParserResultType = TextResultType | RegResultType

export type SeqResultType = ISyntaxResult<'seq', Array<SeqItemType>>
type SeqItemType = AtomicParserResultType | SeqResultType

export type UnionResultType = ISyntaxResult<'union', Array<UnionItemType>>
type UnionItemType = SeqItemType | UnionResultType

export type RuleResultType = {
  name: string,
  expression: UnionItemType,
}
