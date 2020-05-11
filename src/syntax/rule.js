// @flow
import { reg, seq, text, union } from '../basicParsers';
import { GROUP, REG, REP, RULE, SEQ, TEXT, UNION } from './templateTypes';

import type { ParserResultType } from '../basicParsers';
import type {
  ExpressionType,
  GroupResultType,
  RegResultType,
  RepResultType, RuleRefResultType,
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
    return [{ type: TEXT, value: result[1] }, newPos];
  }
  return [null, pos];
}

const slash = text('/');
const regTemplateParser = seq(slash, reg('(\\\\.|[^/\\\\])+'), slash, reg('(?:([is])(?!.*\\1))*'));
export function regTemplate(source: string, pos: number = 0): ParserResultType<RegResultType> {
  const [result, newPos] = regTemplateParser(source, pos);
  if (result) {
    const flags = result[3];
    const ignoreCase = flags.includes('i');
    const dotAll = flags.includes('s');
    return [{ type: REG, value: { pattern: result[1], ignoreCase, dotAll } }, newPos];
  }
  return [null, pos];
}

export function ruleRef(source: string, pos: number = 0): ParserResultType<RuleRefResultType> {
  const [result, newPos] = name(source, pos);
  if (result) {
    return [{ type: RULE, value: result }, newPos];
  }
  return [null, pos];
}

const atomicTemplate = union(textTemplate, regTemplate, ruleRef, group);
const repItemTemplate = union(repTemplate, atomicTemplate);
const seqItemTemplate = union(seqTemplate, repItemTemplate);
const unionItemTemplate = union(unionTemplate, seqItemTemplate);

const repTemplateParser = seq(atomicTemplate, wrappedWithOptionalSpaces('\\^'), repItemTemplate);
export function repTemplate(source: string, pos: number = 0): ParserResultType<RepResultType> {
  const [result, newPos] = repTemplateParser(source, pos);
  if (result) {
    return [{ type: REP, value: { template: result[0], separator: result[2] } }, newPos];
  }
  return [null, pos];
}

const seqTemplateParser = seq(repItemTemplate, wrappedWithOptionalSpaces(' '), seqItemTemplate);
export function seqTemplate(source: string, pos: number = 0): ParserResultType<SeqResultType> {
  const [result, newPos] = seqTemplateParser(source, pos);
  if (result) {
    return [{ type: SEQ, value: [result[0], result[2]] }, newPos];
  }
  return [null, pos];
}

const unionTemplateParser = seq(seqItemTemplate, wrappedWithOptionalSpaces('\\|'), unionItemTemplate);
export function unionTemplate(source: string, pos: number = 0): ParserResultType<UnionResultType> {
  const [result, newPos] = unionTemplateParser(source, pos);
  if (result) {
    return [{ type: UNION, value: [result[0], result[2]] }, newPos];
  }
  return [null, pos];
}

function wrappedWithOptionalSpaces(c) {
  return reg(` *${c} *`);
}

const groupParser = seq(reg('\\( *'), unionItemTemplate, reg(' *\\)'));
export function group(source: string, pos: number = 0): ParserResultType<GroupResultType> {
  const [result, newPos] = groupParser(source, pos);
  if (result) {
    return [{ type: GROUP, value: result[1] }, newPos];
  }
  return [null, pos];
}

const nameParser = reg('[_a-zA-Z]\\w+');
export function name(source: string, pos: number = 0): ParserResultType<string> {
  const [result, newPos] = nameParser(source, pos);
  if (result) {
    return [result, newPos];
  }
  return [null, pos];
}

const ruleParser = seq(name, reg(': *'), unionItemTemplate);
export default function rule(source: string, pos: number = 0): ParserResultType<RuleResultType> {
  const [result, newPos] = ruleParser(source, pos);
  if (result) {
    return [{ name: result[0], expression: normalizeTree(result[2]) }, newPos];
  }
  return [null, pos];
}

function normalizeTree({ type, value }: ExpressionType): ExpressionType {
  switch (type) {
    case TEXT:
    case REG:
    case RULE:
      return { type, value };
    case GROUP:
      return normalizeTree(value);
    case SEQ:
    case UNION: {
      const normValue = flatNestedBinaries(type, value);
      return { type, value: normValue.map(normalizeTree) };
    }
    case REP: {
      const { template, separator } = value;
      return { type, value: { template: normalizeTree(template), separator: normalizeTree(separator) } };
    }
    default:
      throw new TypeError(
        'Unknown type of result encountered during tree normalization. ' +
        `type: ${type}, value: ${value}`
      );
  }
}

function flatNestedBinaries(type: string, value: Array): Array {
  let normValue = value;
  while (normValue.some(v => v.type === type)) {
    normValue = normValue.reduce((norm, v) => v.type === type ? [...norm, ...v.value] : [...norm, v], []);
  }
  return normValue;
}
