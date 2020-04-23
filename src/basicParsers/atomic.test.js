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
  const parseCaseSensitiveReg = reg('[GMT]B', false);
  const parseCaseInsensitiveReg = reg('fo{2}', true);
  const parseAnotherCaseInsensitiveReg = reg('russia', 'I\'m truthy');

  test('if reg matches, return matched string', () => {
    expect(parseReg('barby')[0]).toBe('bar');
    expect(parseReg('bazaar')[0]).toBe('baz');
  });

  test('if second argument is falsy, test is case sensitive', () => {
    expect(parseReg('Barbara')[0]).toBe(null);
    expect(parseCaseSensitiveReg('10gb', 2)[0]).toBe(null);
  });

  test('if second argument is truthy, test is case insensitive', () => {
    expect(parseCaseInsensitiveReg('Football')[0]).toBe('Foo');
    expect(parseAnotherCaseInsensitiveReg('RuSsIaN StYlE')[0]).toBe('RuSsIa');
  });

  test('if reg matches, increment position by its length', () => {
    expect(parseVariousLengthReg(' one space')[1]).toBe(1);
    expect(parseVariousLengthReg('    four spaces')[1]).toBe(4);
  });

  test('positive position incremented by match length', () => {
    expect(parseReg('barbarian', 3)[1]).toBe(6);
    expect(parseVariousLengthReg('and      six spaces', 3)[1]).toBe(9);
  });

  test('reg doesn\'t match, return null match', () => {
    expect(parseReg('no match at all')[0]).toBe(null);
  });

  test('if match not found in position, return null match', () => {
    expect(parseReg('embargo')[0]).toBe(null);
  });

  test('if reg doesn\'t matches, keep position', () => {
    expect(parseReg('still no match', 4)[1]).toBe(4);
  });
});
