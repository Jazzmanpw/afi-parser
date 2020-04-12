const { name, regTemplate, seqTemplate, textTemplate } = require('./syntaxParsers');

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
  test('set position after the trailing spaces after the semicolon', () => {
    expect(name('valid_name:   some value')[1]).toBe(14);
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

  test('if template is not closed with the second slash, return null match', () => {
    expect(regTemplate('/close me')[0]).toBe(null);
  });
});

describe('seqTemplate', () => {
  test('if atomic templates joined with spaces found, return `type: seq`', () => {
    const result = seqTemplate("'parse' 'it'");
    expect(result[0].type).toBe('seq');
  });

  test('if binary sequence found, return array of syntax results as match.value', () => {
    const result = seqTemplate("'Parse' 'It'");
    expect(result[0].value).toEqual([
      { type: 'text', value: 'Parse' },
      { type: 'text', value: 'It' },
    ]);
  });

  test('if ternary sequence found, return it as nested binary sequences', () => {
    const result = seqTemplate("'we ' /go(nna|ing to) / 'parse'");
    expect(result[0]).toEqual({
      type: 'seq',
      value: [
        { type: 'text', value: 'we ' },
        {
          type: 'seq',
          value: [
            { type: 'reg', value: 'go(nna|ing to) ' },
            { type: 'text', value: 'parse' },
          ]
        }
      ]
    });
  })

  test('multiple spaces are allowed', () => {
    const result = seqTemplate("'many'   'spaces'");
    expect(result[0]).toEqual({
      type: 'seq',
      value: [
        { type: 'text', value: 'many' },
        { type: 'text', value: 'spaces' },
      ],
    });
  });

  test('positive position incremented to be after the last child template', () => {
    const result = seqTemplate("key: 'sequential' /parser/", 5);
    expect(result[1]).toBe(26);
  });

  test('zero-spaces separator is not allowed', () => {
    expect(seqTemplate("'cannot''parse'")[0]).toBe(null);
  });
});
