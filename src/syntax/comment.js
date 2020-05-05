// @flow
import { reg, seq, text } from '../basicParsers';

import type { ParserResultType } from '../basicParsers';
import type { CommentResultType } from './types';

const commentParser = seq(text('#'), reg('.*'), reg('\\n|\\r(\\n|)|$'));
export default function comment(source: string, pos: number = 0): ParserResultType<CommentResultType> {
  const [result, newPos] = commentParser(source, pos);
  if (result) {
    return [{ comment: true }, newPos];
  }
  return [null, pos];
}
