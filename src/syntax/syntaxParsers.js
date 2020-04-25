// @flow
import { reg, seq, text, union } from '../basicParsers';

import type { ParserResultType } from '../basicParsers';
import type {
  ExpressionType,
  GroupResultType,
  RegResultType,
  RepResultType,
  RuleResultType,
  SeqResultType,
  TextResultType,
  UnionResultType,
} from './types';

const quote = text('\'');
const textTemplateParser = seq(quote, reg('(\\\\.|[^\'\\\\])+'), quote);
export function textTemplate(source: string, pos: number = 0): ParserResultType<TextResultType> {
  const [result, newPos] = textTemplateParser(source, pos);
  if (result) {
    return [{ type: 'text', value: result[1] }, newPos];
  }
  return [null, pos];
}

const slash = text('/');
const regTemplateParser = seq(slash, reg('(\\\\.|[^/\\\\])+'), slash);
export function regTemplate(source: string, pos: number = 0): ParserResultType<RegResultType> {
  const [result, newPos] = regTemplateParser(source, pos);
  if (result) {
    return [{ type: 'reg', value: result[1] }, newPos];
  }
  return [null, pos];
}

const atomicTemplate = union(textTemplate, regTemplate, group);
const repItemTemplate = union(repTemplate, atomicTemplate);
const seqItemTemplate = union(seqTemplate, repItemTemplate);
const unionItemTemplate = union(unionTemplate, seqItemTemplate);

const repTemplateParser = seq(atomicTemplate, wrappedWithOptionalSpaces('\\^'), repItemTemplate);
export function repTemplate(source: string, pos: number = 0): ParserResultType<RepResultType> {
  const [result, newPos] = repTemplateParser(source, pos);
  if (result) {
    return [{ type: 'rep', value: { template: result[0], separator: result[2] } }, newPos];
  }
  return [null, pos];
}

const seqTemplateParser = seq(repItemTemplate, wrappedWithOptionalSpaces('\\s'), seqItemTemplate);
export function seqTemplate(source: string, pos: number = 0): ParserResultType<SeqResultType> {
  const [result, newPos] = seqTemplateParser(source, pos);
  if (result) {
    return [{ type: 'seq', value: [result[0], result[2]] }, newPos];
  }
  return [null, pos];
}

const unionTemplateParser = seq(seqItemTemplate, wrappedWithOptionalSpaces('\\|'), unionItemTemplate);
export function unionTemplate(source: string, pos: number = 0): ParserResultType<UnionResultType> {
  const [result, newPos] = unionTemplateParser(source, pos);
  if (result) {
    return [{ type: 'union', value: [result[0], result[2]] }, newPos];
  }
  return [null, pos];
}

function wrappedWithOptionalSpaces(c) {
  return reg(`\\s*${c}\\s*`);
}

const groupParser = seq(reg('\\(\\s*'), unionItemTemplate, reg('\\s*\\)'));
export function group(source: string, pos: number = 0): ParserResultType<GroupResultType> {
  const [result, newPos] = groupParser(source, pos);
  if (result) {
    return [{ type: 'group', value: result[1] }, newPos];
  }
  return [null, pos];
}

const nameParser = seq(reg('[_a-zA-Z]\\w+'), reg(':\\s*'));
export function name(source: string, pos: number = 0): ParserResultType<string> {
  const [result, newPos] = nameParser(source, pos);
  if (result) {
    return [result[0], newPos];
  }
  return [null, pos];
}

const ruleParser = seq(name, unionItemTemplate);
export default function rule(source: string, pos: number = 0): ParserResultType<RuleResultType> {
  const [result, newPos] = ruleParser(source, pos);
  if (result) {
    return [{ name: result[0], expression: normalizeTree(result[1]) }, newPos];
  }
  return [null, pos];
}

function normalizeTree({ type, value }: ExpressionType): ExpressionType {
  switch (type) {
    case 'text':
    case 'reg':
      return { type, value };
    case 'group':
      return normalizeTree(value);
    case 'seq':
    case 'union': {
      const normValue = flatNestedBinaries(type, value);
      return { type, value: normValue.map(normalizeTree) };
    }
    case 'rep': {
      const { template, separator } = value;
      return { type, value: { template: normalizeTree(template), separator: normalizeTree(separator) } };
    }
    default:
      throw new TypeError('Unknown type of result encountered during tree normalization')
  }
}

function flatNestedBinaries(type: string, value: Array): Array {
  let normValue = value;
  while (normValue.some(v => v.type === type)) {
    normValue = normValue.reduce((norm, v) => v.type === type ? [...norm, ...v.value] : [...norm, v], []);
  }
  return normValue;
}
