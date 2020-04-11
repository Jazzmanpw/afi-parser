const { reg, text } = require('./atomic');
const { seq, union } = require('./compound');

describe('union', () => {
  const parseUnion = union(text('ab'), text('cad'), text('boom'));
  const parseOverlappingUnion = union(text('par'), text('parse'));

  test('if any of parsers match, return its match', () => {
    expect(parseUnion('abra')[0]).toBe('ab');
    expect(parseUnion('cadabra')[0]).toBe('cad');
    expect(parseUnion('boom!')[0]).toBe('boom');
  });

  test('first parsers have priority', () => {
    expect(parseOverlappingUnion('parser works')[0]).toBe('par');
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
  const parseSeq = seq(reg('par+s'), text("'em"), text(' all'));

  test('if sequence matches, return match as array of all matches', () => {
    expect(parseSeq('parrrs\'em all')[0]).toEqual(['parrrs', "'em", ' all']);
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
