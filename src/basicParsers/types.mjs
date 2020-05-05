// @flow
export type ParserResultType<T> = [?T, number]
export type ParserType<T> = (source: string, pos?: number) => ParserResultType<T>
export type RegOptionsType = {
  ignoreCase?: boolean,
  dotAll?: boolean,
}
