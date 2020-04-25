const {
  default: rule,
  group,
  name,
  regTemplate,
  repTemplate,
  ruleRef,
  seqTemplate,
  textTemplate,
  unionTemplate,
} = require('./syntaxParsers');

describe('name', () => {
  test('match a name starting with a letter', () => {
    expect(name('abra')[0]).toBe('abra');
  });

  test('match a name starting with a lodash', () => {
    expect(name('_cadabra')[0]).toBe('_cadabra');
  });

  test('match a name with uppercase letters', () => {
    expect(name('LaTeX')[0]).toBe('LaTeX');
  });

  test('match a name with lodash in the middle', () => {
    expect(name('ka_boom')[0]).toBe('ka_boom');
  });

  test('match a name with numbers in the middle', () => {
    expect(name('road66')[0]).toBe('road66');
  });

  test('match name on positive position', () => {
    expect(name('prefix^name', 7)[0]).toBe('name');
  });
  test('set position after the last \\w char of the name', () => {
    expect(name('valid_name:   some value')[1]).toBe(10);
  });

  test('don\'t match a name starting with a number', () => {
    expect(name('5nizza')[0]).toBe(null);
  });

  test('stop match on any symbol that is not \\w', () => {
    expect(name('li$tener')[0]).toBe('li');
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

describe('ruleRef', () => {
  const result = ruleRef('/reg/ ruleName', 6);

  test('if name found, return type: \'rule\'', () => {
    expect(result[0].type).toBe('rule');
  });

  test('if name found, return it as match.value', () => {
    expect(result[0].value).toBe('ruleName');
  });

  test('positive position incremented to be after the name', () => {
    expect(result[1]).toBe(14);
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

describe('group', () => {
  describe.each([
    ['text', '(\'group\')', { type: 'text', value: 'group' }],
    ['reg', '(/group/)', { type: 'reg', value: 'group' }],
    ['rep', '(\'group\' ^ \'and\')', {
      type: 'rep',
      value: {
        template: { type: 'text', value: 'group' },
        separator: { type: 'text', value: 'and' },
      },
    }],
    ['seq', '(\'long\' \'group\')', {
      type: 'seq', value: [
        { type: 'text', value: 'long' },
        { type: 'text', value: 'group' },
      ],
    }],
    ['union', '(\'group\' | \'group anyway\')', {
      type: 'union', value: [
        { type: 'text', value: 'group' },
        { type: 'text', value: 'group anyway' },
      ],
    }],
  ])('if %sTemplate wrapped in parentheses found', (_type, source, value) => {
    let result;
    beforeAll(() => {
      result = group(source);
    });
    afterAll(() => {
      result = null;
    });

    test('return `type: group`', () => {
      expect(result[0].type).toBe('group');
    });

    test('return inner template result as match.value', () => {
      expect(result[0].value).toEqual(value);
    })
  });

  test('group may include more than two templates', () => {
    const result = group('(/a/ \'b\' ^ \'c\')');
    expect(result[0]).toEqual({
      type: 'group',
      value: {
        type: 'seq', value: [
          { type: 'reg', value: 'a' },
          { type: 'rep', value: {
            template: { type: 'text', value: 'b' },
            separator: { type: 'text', value: 'c'},
            },
          },
        ],
      },
    });
  });

  test('nested groups are allowed', () => {
    const result = group('((\'a\' ^ \'b\') ^ \'c\')');
    expect(result[0]).toEqual({
      type: 'group',
      value: {
        type: 'rep',
        value: {
          template: {
            type: 'group',
            value: {
              type: 'rep',
              value: {
                template: { type: 'text', value: 'a' },
                separator: { type: 'text', value: 'b' },
              },
            },
          },
          separator: { type: 'text', value: 'c' },
        }
      }
    })
  });

  test('optional spaces inside of parentheses are allowed', () => {
    const result = group('(  \'I \'  \'love \'  \'spaces!!!\'     )');
    expect(result[0]).toEqual({
      type: 'group',
      value: {
        type: 'seq',
        value: [
          { type: 'text', value: 'I ' },
          { type: 'seq', value: [{ type: 'text', value: 'love ' }, { type: 'text', value: 'spaces!!!' }] },
        ],
      },
    });
  });

  test('positive position incremented to be after the last parenthesis', () => {
    const result = group('littleGroup: (/little group/)', 13);
    expect(result[1]).toBe(29);
  });

  test.each([
    ['text', '(\'test (passes)\')', 'test (passes)'],
    ['reg', '(/passes (too|) (=\\))?/)', 'passes (too|) (=\\))?'],
  ])('parentheses need not to be escaped inside of %sTemplate', (type, source, value) => {
    const result = group(source);
    expect(result[0]).toEqual({ type: 'group', value: { type, value } });
  });

  test('empty group template is not allowed', () => {
    expect(group('()')[0]).toBe(null);
  });

  test('if template is not closed with the second parenthesis, return null match', () => {
    expect(group('(\'kill \' \'me\'')[0]).toBe(null);
  });
});

describe('rule', () => {
  test('return parsed name as rule.name', () => {
    expect(rule('ruleName: \'simple rule\'')[0].name).toBe('ruleName');
  });

  test('return parsed expression AST as rule.expression', () => {
    const result = rule('ruleName: \'ruleExpression\'');
    expect(result[0].expression).toEqual({ type: 'text', value: 'ruleExpression' });
  });

  test('allow multiple spaces after the semicolon', () => {
    expect(rule('name:    \'space\' /fever/')[0]).toEqual({
      name: 'name',
      expression: {
        type: 'seq',
        value: [
          { type: 'text', value: 'space' },
          { type: 'reg', value: 'fever' },
        ],
      },
    });
  });

  test('if name parsing fails, return null match', () => {
    expect(rule('na me: /reg/')[0]).toBe(null);
  });

  test('if one of templates fails, return null match', () => {
    expect(rule('broken: /close me')[0]).toBe(null);
  });

  test('n sequences in a row return as one seq with array of length n as match.value', () => {
    const result = rule('name: /this/ /is/ \'a\' /sequence/');
    expect(result[0].expression).toEqual({
      type: 'seq',
      value: [
        { type: 'reg', value: 'this' },
        { type: 'reg', value: 'is' },
        { type: 'text', value: 'a' },
        { type: 'reg', value: 'sequence' },
      ],
    });
  });

  test('n unions in a row return as one union with array of length n as match.value', () => {
    const result = rule('name: \'union\' | \'values\' | /any/ | /set/');
    expect(result[0].expression).toEqual({
      type: 'union',
      value: [
        { type: 'text', value: 'union' },
        { type: 'text', value: 'values' },
        { type: 'reg', value: 'any' },
        { type: 'reg', value: 'set' },
      ],
    });
  });

  test('group match value replaces the group', () => {
    const result = rule('name: (\'nested\' (\'group\'))');
    expect(result[0].expression).toEqual({
      type: 'seq',
      value: [{ type: 'text', value: 'nested' }, { type: 'text', value: 'group' }],
    });
  });
});
