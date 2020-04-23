// @flow
import type { ParserResultType, ParserType } from './types';

export function union(...parsers: Array<ParserType<any>>): ParserType<any> {
  return (source, pos = 0) => {
    for (const parser of parsers) {
      const result = parser(source, pos);
      if (result[0] !== null) {
        return result;
      }
    }
    return [null, pos];
  };
}

export function seq(...parsers: Array<ParserType<any>>): ParserType<Array<any>> {
  return (source, pos = 0) => parsers.reduce(
    ([prevResult, prevPos], parser): ParserResultType<Array<any>> => {
      if (prevResult) {
        const [newResult, newPos] = parser(source, prevPos);
        if (newResult) {
          return [[...prevResult, newResult], newPos];
        }
      }
      return [null, pos];
    },
    [[], pos],
  );
}

export function rep<T>(parser: ParserType<T>, separatorParser: ParserType<string>): ParserType<Array<T>> {
  const sepTemplateParser = seq(separatorParser, parser);
  return (source, pos = 0) => {
    const [firstResult, firstPos] = parser(source, pos);
    if (firstResult) {
      const result = [firstResult];
      let prevPos = firstPos;
      while (true) {
        const [newResult, newPos] = sepTemplateParser(source, prevPos);
        if (newResult) {
          result.push(newResult[1]);
          prevPos = newPos;
          continue;
        }
        return [result, prevPos];
      }
    }
    return [[], pos];
  };
}
