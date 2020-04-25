// @flow

interface ISyntaxResult<T: string, V> {
  type: T,
  value: V,
}

export type TextResultType = ISyntaxResult<'text', string>
export type RegResultType = ISyntaxResult<'reg', string>
export type RuleRefResultType = ISyntaxResult<'rule', string>
export type AtomicParserResultType = TextResultType | RegResultType | RuleRefResultType | GroupResultType

type RepValueType = { template: RepItemType, separator: RepItemType }
export type RepResultType = ISyntaxResult<'rep', RepValueType>
type RepItemType = AtomicParserResultType | RepResultType

export type SeqResultType = ISyntaxResult<'seq', Array<SeqItemType>>
type SeqItemType = RepItemType | SeqResultType

export type UnionResultType = ISyntaxResult<'union', Array<UnionItemType>>
type UnionItemType = SeqItemType | UnionResultType

export type ExpressionType = UnionItemType
export type GroupResultType = ISyntaxResult<'group', ExpressionType>

export type RuleResultType = {
  name: string,
  expression: ExpressionType,
}
