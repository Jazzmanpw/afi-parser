const { reg, text } = require('./atomic');
const { rep, seq, union } = require('./compound');

describe('union', () => {
  const parseUnion = union(text('ab'), text('cad'), text('boom'));
  const parseOverlappingUnion = union(text('par'), text('parse'));
  const parseUnionWithEmptyMatch = union(text('full'), reg('(not full)?'));

  test('if any of parsers match, return its match', () => {
    expect(parseUnion('abra')[0]).toBe('ab');
    expect(parseUnion('cadabra')[0]).toBe('cad');
    expect(parseUnion('boom!')[0]).toBe('boom');
  });

  test('first parsers have priority', () => {
    expect(parseOverlappingUnion('parser works')[0]).toBe('par');
  });

  test('if parser matches empty string, return it as match', () => {
    expect(parseUnionWithEmptyMatch('empty')[0]).toBe('');
  });

  test('if parser matches, increment position by match length', () => {
    expect(parseUnion('cadenza')[1]).toBe(3);
  });

  test('positive position incremented by match length', () => {
    expect(parseUnion('kaboom', 2)[1]).toBe(6);
  });

  test('if none of parsers matches, return null match', () => {
    expect(parseUnion('fails')[1]).toBe(0);
  });

  test('if match on position fails, position is not moved', () => {
    expect(parseUnion('one more fail', 5)[1]).toBe(5);
  });
});

describe('seq', () => {
  const parseSeq = seq(reg('par+s'), text('\'em'), text(' all'));
  const parseSeqWithEmptyMatch = seq(text('parse'), reg('r?'));

  test('if sequence matches, return match as array of all matches', () => {
    expect(parseSeq('parrrs\'em all')[0]).toEqual(['parrrs', '\'em', ' all']);
  });

  test('if parser matches empty string, return it as match', () => {
    expect(parseSeqWithEmptyMatch('parse')[0][1]).toBe('');
  });

  test('if sequence matches, increment position by all matches length', () => {
    expect(parseSeq('parrs\'em all')[1]).toBe(12);
  });

  test('positive position incremented by match length', () => {
    expect(parseSeq('we gonna pars\'em all', 9)[1]).toBe(20);
  });

  test('if one of parsers doesn\'t match, return null match', () => {
    expect(parseSeq('we\'ll pars\'em and')[0]).toBe(null);
    expect(parseSeq('parse well')[0]).toBe(null);
    expect(parseSeq('but not today')[0]).toBe(null);
  });

  test('if match on position fails, position is not moved', () => {
    expect(parseSeq('why I am here?', 4)[1]).toBe(4);
  });
});

describe('rep', () => {
  const parseRep = rep(text('ha'), text('-'));
  const parsePossiblyEmptyRep = rep(reg('(foo|bar)?'), reg('-?'));

  test('if template was not found, return empty array match', () => {
    expect(parseRep('boring')[0]).toEqual([]);
  });

  test('if template repeated one time, return array with one entry as match', () => {
    expect(parseRep('ha')[0]).toEqual(['ha']);
  });

  test('if template repeated three times joined by separator, return array with three entries as match', () => {
    expect(parseRep('ha-ha-ha')[0]).toEqual(['ha', 'ha', 'ha']);
  });

  test('if second separator was not found, return array with two entries as match', () => {
    expect(parseRep('ha-haha')[0]).toEqual(['ha', 'ha']);
  });

  test('if second template failed to match, return array with one entry as match', () => {
    expect(parseRep('ha-HA')[0]).toEqual(['ha']);
  });

  test('if template matches empty string, continue matching and return its match as empty string', () => {
    expect(parsePossiblyEmptyRep('foo--bar')[0]).toEqual(['foo', '', 'bar']);
  });

  test('if separator matches empty string, continue matching', () => {
    expect(parsePossiblyEmptyRep('foobar')[0]).toEqual(['foo', 'bar']);
  });

  test('if separator and then template match two empty strings in a row, end match', () => {
    expect(parsePossiblyEmptyRep('foo-barrack')[0]).toEqual(['foo', 'bar']);
  });

  test(`if template and then separator match two empty strings in a row, 
              end match and return the match with an empty string as the last value`, () => {
    expect(parsePossiblyEmptyRep('foo-bar-baz')[0]).toEqual(['foo', 'bar', '']);
  });

  test('set position after last matching template', () => {
    expect(parseRep('ha-ha')[1]).toBe(5);
  });

  test('positive position incremented to be after last template match', () => {
    expect(parseRep('laugh like "ha-ha"', 12)[1]).toBe(17);
  });

  test('if template was not found, keep previous position', () => {
    expect(parseRep('still boring')[1]).toBe(0);
  });

  test('if the second template failed to match, set position in the end of the first template', () => {
    expect(parseRep('ha-HA')[1]).toBe(2);
  });

  test('if the second separator was not found, set position after the second match', () => {
    expect(parseRep('ha-haha')[1]).toBe(5);
  });
});
