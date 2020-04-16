// @flow
import type { ParserType, ParserResultType } from './types';

export function union(...parsers: Array<ParserType<mixed>>): ParserType<mixed> {
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

export function seq(...parsers: Array<ParserType<mixed>>): ParserType<Array<mixed>> {
  return (source, pos = 0) => parsers.reduce(
    ([prevResult, prevPos], parser): ParserResultType<Array<mixed>> => {
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
    if (!firstResult) {
      return [[], pos];
    }

    const result = [firstResult];
    let prevPos = firstPos;
    while (true) {
      const [newResult, newPos] = sepTemplateParser(source, prevPos);
      if (newResult) {
        result.push(newResult[1]);
        prevPos = newPos;
        continue;
      }
      return [result, prevPos]
    }
  }
}
