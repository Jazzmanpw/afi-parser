// @flow
import { reg, seq, text, union } from '../basicParsers';

import type { ParserResultType } from '../basicParsers';
import type {
  RegResultType,
  RepResultType,
  RuleResultType,
  SeqResultType,
  TextResultType,
  UnionResultType
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

const atomicTemplate = union(textTemplate, regTemplate);
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
    return [{ name: result[0], expression: result[1] }, newPos];
  }
  return [null, pos];
}

function wrappedWithOptionalSpaces(c) {
  return reg(`\\s*${c}\\s*`);
}
