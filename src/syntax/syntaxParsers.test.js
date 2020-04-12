const { name } = require('./syntaxParsers');

describe('name', () => {
  test('match a name starting with a letter', () => {
    expect(name('abra:')[0]).toBe('abra');
  });

  test('match a name starting with a lodash', () => {
    expect(name('_cadabra:')[0]).toBe('_cadabra');
  });

  test('match a name with uppercase letters', () => {
    expect(name('LaTeX:')[0]).toBe('LaTeX');
  });

  test('match a name with lodash in the middle', () => {
    expect(name('ka_boom:')[0]).toBe('ka_boom');
  });

  test('match a name with numbers in the middle', () => {
    expect(name('road66:')[0]).toBe('road66');
  });

  test('match name on positive position', () => {
    expect(name('prefix^name:', 7)[0]).toBe('name');
  });

  test('set position after the semicolon', () => {
    expect(name('valid_name: some value')[1]).toBe(11);
  });

  test('don\'t match a name starting with a number', () => {
    expect(name('5nizza')[0]).toBe(null);
  });

  test('don\'t match a name with any symbol that is not \\w', () => {
    expect(name('li$tener')[0]).toBe(null);
  });

  test('don\'t match a name with a missing semicolon', () => {
    expect(name('noname')[0]).toBe(null);
  });
});
