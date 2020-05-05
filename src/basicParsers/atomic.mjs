// @flow
import type { ParserType, RegOptionsType } from './types';

export function text(text: string): ParserType<string> {
  const { length } = text;
  return (source, pos = 0) => source.substr(pos, length) === text ? [text, pos + length] : [null, pos];
}

// the name `dotAll` was selected according to this property of RegExp prototype
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/dotAll
export function reg(pattern: string, { ignoreCase, dotAll }: RegOptionsType = {}): ParserType<string> {
  const reg = new RegExp(pattern, ['y', ignoreCase && 'i', dotAll && 's'].filter(Boolean).join(''));
  return (source, pos = 0) => {
    reg.lastIndex = pos;
    const match = reg.exec(source);
    return match ? [match[0], reg.lastIndex] : [null, pos];
  };
}
