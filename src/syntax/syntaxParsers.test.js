const { name, regTemplate, textTemplate } = require('./syntaxParsers');

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

describe('textTemplate', () => {
  test('text in single quotes parsed into `type: text`', () => {
    expect(textTemplate("'some template'")[0].type).toBe('text');
  });

  test('text in single quotes returns string in the quotes as match.value', () => {
    expect(textTemplate("'template'")[0].value).toBe('template');
  });

  test('quotes escaped with backslash', () => {
    expect(textTemplate("'\\'quoted\\''")[0].value).toBe("\\'quoted\\'");
  });

  test('positive position incremented to be after the last quote', () => {
    expect(textTemplate("name: 'template'", 6)[1]).toBe(16);
  });

  test('empty text template is not parsed', () => {
    expect(textTemplate("''")[0]).toBe(null);
  });

  test('if template is not closed with the second quote, return null match', () => {
    expect(textTemplate("'not closed")[0]).toBe(null);
  });
});

describe('regTemplate', () => {
  test('text in slashes parsed into `type: reg`', () => {
    expect(regTemplate('/(some|any)? ?regex/')[0].type).toBe('reg');
  });

  test('text in slashes returns string between them as match.value', () => {
    expect(regTemplate('/(some|any)? ?regex/')[0].value).toBe('(some|any)? ?regex');
  });

  test('regex escaping with backslash', () => {
    expect(regTemplate('/reg w\\/slash&\\$ymbols\\./')[0].value).toBe('reg w\\/slash&\\$ymbols\\.');
  });

  test('positive position incremented to be after the last slash', () => {
    expect(regTemplate('regular: /expressions?/', 9)[1]).toBe(23);
  });

  test('empty reg template is not parser', () => {
    expect(regTemplate('//')[0]).toBe(null);
  });

  test('tf template is not closed with the second slash, return null match', () => {
    expect(regTemplate('/close me')[0]).toBe(null);
  });
});
