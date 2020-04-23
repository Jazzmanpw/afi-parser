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

const nameParser = seq(reg('[_a-zA-Z]\\w+'), reg(':\\s*'));
export function name(source: string, pos: number = 0): ParserResultType<string> {
  const [result, newPos] = nameParser(source, pos);
  if (result) {
    return [result[0], newPos];
  }
  return [null, pos];
}

const quote = text("'");
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

const hat = reg('\\s*\\^\\s*');
const atomicTemplate = union(textTemplate, regTemplate);
const repItemTemplate = union(repTemplate, atomicTemplate);
const repTemplateParser = seq(atomicTemplate, hat, repItemTemplate);
export function repTemplate(source: string, pos: number = 0): ParserResultType<RepResultType> {
  const [result, newPos] = repTemplateParser(source, pos);
  if (result) {
    return [{ type: 'rep', value: { template: result[0], separator: result[2] } }, newPos];
  }
  return [null, pos];
}

const spaces = reg('\\s+');
const seqItemTemplate = union(seqTemplate, repItemTemplate);
const seqTemplateParser = seq(atomicTemplate, spaces, seqItemTemplate);
export function seqTemplate(source: string, pos: number = 0): ParserResultType<SeqResultType> {
  const [result, newPos] = seqTemplateParser(source, pos);
  if (result) {
    return [{ type: 'seq', value: [result[0], result[2]] }, newPos]
  }
  return [null, pos];
}

const or = reg('\\s*\\|\\s*');
const unionItemTemplate = union(unionTemplate, seqItemTemplate);
const unionTemplateParser = seq(seqItemTemplate, or, unionItemTemplate);
export function unionTemplate(source: string, pos: number = 0): ParserResultType<UnionResultType> {
  const [result, newPos] = unionTemplateParser(source, pos);
  if (result) {
    return [{ type: 'union', value: [result[0], result[2]] }, newPos];
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
