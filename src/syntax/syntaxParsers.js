// @flow
import { reg, seq, text } from '../basicParsers';

import type { ParserResultType } from '../basicParsers';

const nameParser = seq(reg('[_a-zA-Z]\\w+'), text(':'));
export function name(source: string, pos: number = 0): ParserResultType<string> {
  const [result, newPos] = nameParser(source, pos);
  if (result && typeof result[0] === 'string') {
    return [result[0], newPos];
  }
  return [null, pos];
}

const quote = text("'");
const textTemplateParser = seq(quote, reg('(\\\\.|[^\'\\\\])+'), quote);
export function textTemplate(source: string, pos: number = 0): ParserResultType<{ type: 'text', value: string }> {
  const [result, newPos] = textTemplateParser(source, pos);
  if (result) {
    return [{ type: 'text', value: result[1] }, newPos];
  }
  return [null, pos];
}

const slash = text('/');
const regTemplateParser = seq(slash, reg('(\\\\.|[^/\\\\])+'), slash);
export function regTemplate(source: string, pos: number = 0): ParserResultType<{ type: 'reg', value: string }> {
  const [result, newPos] = regTemplateParser(source, pos);
  if (result) {
    return [{ type: 'reg', value: result[1] }, newPos];
  }
  return [null, pos];
}
