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
