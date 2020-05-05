// @flow
import { GROUP, REG, REP, RULE, SEQ, TEXT, UNION } from './templateTypes';

interface ISyntaxResult<T: string, V> {
  type: T,
  value: V,
}

export type TextResultType = ISyntaxResult<TEXT, string>

type RegValueType = {
  pattern: string,
  ignoreCase: boolean,
  dotAll: boolean,
}
export type RegResultType = ISyntaxResult<REG, RegValueType>

export type RuleRefResultType = ISyntaxResult<RULE, string>

export type AtomicParserResultType = TextResultType | RegResultType | RuleRefResultType | GroupResultType

type RepValueType = { template: RepItemType, separator: RepItemType }
export type RepResultType = ISyntaxResult<REP, RepValueType>
type RepItemType = AtomicParserResultType | RepResultType

export type SeqResultType = ISyntaxResult<SEQ, Array<SeqItemType>>
type SeqItemType = RepItemType | SeqResultType

export type UnionResultType = ISyntaxResult<UNION, Array<UnionItemType>>
type UnionItemType = SeqItemType | UnionResultType

export type ExpressionType = UnionItemType
export type GroupResultType = ISyntaxResult<GROUP, ExpressionType>

export type RuleResultType = {
  name: string,
  expression: ExpressionType,
}
