const { reg, text } = require('./atomic');

describe('test', () => {
  const parseTest = text('test');
  const parseLaTeX = text('LaTeX');

  test('if text found, return it', () => {
    expect(parseTest('test string')[0]).toEqual('test');
  });

  test('if text found, increment position by its length', () => {
    expect(parseTest('test string')[1]).toEqual(4);
  });

  test('positive position incremented by match length', () => {
    expect(parseTest('passed test', 7)[1]).toEqual(11);
  });

  test('matching is case sensitive', () => {
    expect(parseLaTeX('LaTeX in nice')[0]).toEqual('LaTeX');
    expect(parseLaTeX('latex is wrong casing')[0]).toEqual(null);
  });

  test('if text is not in position, return null match', () => {
    expect(parseTest('failed test')[0]).toEqual(null);
  });

  test('if match on positive position fails, position is not moved', () => {
    expect(parseTest('also failed', 3)[1]).toEqual(3);
  });
});

describe('reg', () => {
  const parseReg = reg('ba[rz]');
  const parseVariousLengthReg = reg('\\s+');

  test('if reg matches, return matched string', () => {
    expect(parseReg('barby')[0]).toBe('bar');
    expect(parseReg('bazaar')[0]).toBe('baz');
  });

  test('if reg matches an empty string, don\'t fail match', () => {
    expect(reg('o?')('done')[0]).toBe('');
  });

  describe.each([
    ['ignoreCase', 'is case insensitive', 'is case sensitive', '10[GMT]B', '10gb'],
    ['dotAll', 'doesn\'t match "\\n" with dot', 'matches "\\n" with dot', 'abra.cadabra', 'abra\ncadabra'],
  ])('%s flag', (key, hasNoFlag, hasFlag, pattern, source) => {
    test(`if reg called with one argument, regexp ${hasNoFlag}`, () => {
      expect(reg(pattern)(source)[0]).toBe(null);
    });

    test.each(
      [false, null, undefined, 0, '', NaN]
    )(`if reg called with second argument with falsy '${key}' property, regexp ${hasNoFlag}`, value => {
      expect(reg(pattern, { [key]: value })(source)[0]).toBe(null);
    });

    test(`if reg called with second argument with '${key}: true', regexp ${hasFlag}`, () => {
      expect(reg(pattern, { [key]: true })(source)[0]).toBe(source);
    });
  });

  test('if reg matches, increment position by its length', () => {
    expect(parseVariousLengthReg(' one space')[1]).toBe(1);
    expect(parseVariousLengthReg('    four spaces')[1]).toBe(4);
  });

  test('positive position incremented by match length', () => {
    expect(parseReg('barbarian', 3)[1]).toBe(6);
    expect(parseVariousLengthReg('and      six spaces', 3)[1]).toBe(9);
  });

  test('if reg doesn\'t match, return null match', () => {
    expect(parseReg('no match at all')[0]).toBe(null);
  });

  test('if match not found in position, return null match', () => {
    expect(parseReg('embargo')[0]).toBe(null);
  });

  test('if reg doesn\'t matches, keep position', () => {
    expect(parseReg('still no match', 4)[1]).toBe(4);
  });
});
