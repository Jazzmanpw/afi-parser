const {
  default: rule,
  name,
  regTemplate,
  repTemplate,
  seqTemplate,
  textTemplate,
  unionTemplate,
} = require('./syntaxParsers');

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
    expect(textTemplate('\'some template\'')[0].type).toBe('text');
  });

  test('text in single quotes returns string in the quotes as match.value', () => {
    expect(textTemplate('\'template\'')[0].value).toBe('template');
  });

  test('quotes escaped with backslash', () => {
    expect(textTemplate('\'\\\'quoted\\\'\'')[0].value).toBe('\\\'quoted\\\'');
  });

  test('positive position incremented to be after the last quote', () => {
    expect(textTemplate('name: \'template\'', 6)[1]).toBe(16);
  });

  test('empty text template is not parsed', () => {
    expect(textTemplate('\'\'')[0]).toBe(null);
  });

  test('if template is not closed with the second quote, return null match', () => {
    expect(textTemplate('\'not closed')[0]).toBe(null);
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

describe('repTemplate', () => {
  test('if atomic templates joined with hat, return `type: rep`', () => {
    const result = repTemplate('\'ha\'^\'-\'');
    expect(result[0].type).toBe('rep');
  });

  test(`if binary rep found, return object with 
              left hand expression, parsed as template, as match.value.template and
              right hand expression, parsed as template, as match.value.separator`, () => {
    const result = repTemplate('\'a\'^\'b\'');
    expect(result[0].value).toEqual({
      template: { type: 'text', value: 'a' },
      separator: { type: 'text', value: 'b' },
    });
  });

  test('if ternary rep found, return it as nested binary repetitions', () => {
    const result = repTemplate('\'a\'^\'b\'^\'c\'');
    expect(result[0].value).toEqual({
      template: { type: 'text', value: 'a' },
      separator: {
        type: 'rep',
        value: {
          template: { type: 'text', value: 'b' },
          separator: { type: 'text', value: 'c' },
        },
      },
    });
  });

  test('optional spaces around hat are allowed', () => {
    const result = repTemplate('/a/  ^ \'b\'');
    expect(result[0]).toEqual({
      type: 'rep',
      value: {
        template: { type: 'reg', value: 'a' },
        separator: { type: 'text', value: 'b' },
      },
    });
  });

  test('positive position incremented to be after the last child template', () => {
    const result = repTemplate('repeat: /[hH]o/ ^ \'!\'', 8);
    expect(result[1]).toBe(21);
  });
});

describe('seqTemplate', () => {
  test('if atomic templates joined with spaces found, return `type: seq`', () => {
    const result = seqTemplate('\'parse\' \'it\'');
    expect(result[0].type).toBe('seq');
  });

  test('if binary sequence found, return array of syntax results as match.value', () => {
    const result = seqTemplate('\'Parse\' \'It\'');
    expect(result[0].value).toEqual([
      { type: 'text', value: 'Parse' },
      { type: 'text', value: 'It' },
    ]);
  });

  test('if ternary sequence found, return it as nested binary sequences', () => {
    const result = seqTemplate('\'we \' /go(nna|ing to) / \'parse\'');
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
  });

  test('multiple spaces are allowed', () => {
    const result = seqTemplate('\'many\'   \'spaces\'');
    expect(result[0]).toEqual({
      type: 'seq',
      value: [
        { type: 'text', value: 'many' },
        { type: 'text', value: 'spaces' },
      ],
    });
  });

  test('positive position incremented to be after the last child template', () => {
    const result = seqTemplate('key: \'sequential\' /parser/', 5);
    expect(result[1]).toBe(26);
  });

  test('zero-spaces separator is not allowed', () => {
    expect(seqTemplate('\'cannot\'\'parse\'')[0]).toBe(null);
  });
});

describe('unionTemplate', () => {
  test('if atomic templates joined with pipe, return `type: union`', () => {
    expect(unionTemplate('\'this\'|\'that\'')[0].type).toBe('union');
  });

  test('if binary union found, return array of syntax results as match.value', () => {
    expect(unionTemplate('\'this\'|\'that\'')[0].value).toEqual([
      { type: 'text', value: 'this' },
      { type: 'text', value: 'that' },
    ]);
  });

  test('if ternary union found, return it as nested binary unions', () => {
    expect(unionTemplate('\'parse\'|\'translate\'|/read/')[0]).toEqual({
      type: 'union',
      value: [
        { type: 'text', value: 'parse' },
        {
          type: 'union',
          value: [
            { type: 'text', value: 'translate' },
            { type: 'reg', value: 'read' },
          ],
        },
      ],
    });
  });

  test('optional spaces around pipe are allowed', () => {
    expect(unionTemplate('\'connecting\'  |   \'people\'')[0]).toEqual({
      type: 'union',
      value: [
        { type: 'text', value: 'connecting' },
        { type: 'text', value: 'people' },
      ],
    });
  });

  test('positive position incremented to be after the last child template', () => {
    expect(unionTemplate('union: /reg(ex)?/ | \'regular expression\'', 7)[1]).toBe(40);
  });
});

describe('rule', () => {
  test('return parsed name as rule.name', () => {
    expect(rule('ruleName: \'simple rule\'')[0].name).toBe('ruleName');
  });

  test('return parsed expression AST as rule.expression', () => {
    expect(rule('ruleName: \'rule\' /\\s+/ \'expression\' | \'ruleExpression\'')[0].expression).toEqual({
      type: 'union',
      value: [
        {
          type: 'seq', value: [
            { type: 'text', value: 'rule' },
            { type: 'seq', value: [{ type: 'reg', value: '\\s+' }, { type: 'text', value: 'expression' }] },
          ],
        },
        { type: 'text', value: 'ruleExpression' },
      ],
    });
  });

  test('if name parsing fails, return null match', () => {
    expect(rule('na me: /reg/')[0]).toBe(null);
  });

  test('if one of templates fails, return null match', () => {
    expect(rule('broken: /close me')[0]).toBe(null);
  });
});
