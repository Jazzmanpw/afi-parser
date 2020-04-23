// @flow
import type { ParserType } from './types';

export function text(text: string): ParserType<string> {
  const { length } = text;
  return (source, pos = 0) => source.substr(pos, length) === text ? [text, pos + length] : [null, pos];
}

export function reg(pattern: string, ignoreCase?: boolean): ParserType<string> {
  const reg = new RegExp(pattern, ['y', ignoreCase && 'i'].filter(Boolean).join(''));
  return (source, pos = 0) => {
    reg.lastIndex = pos;
    const match = reg.exec(source);
    return match ? [match[0], reg.lastIndex] : [null, pos];
  };
}
