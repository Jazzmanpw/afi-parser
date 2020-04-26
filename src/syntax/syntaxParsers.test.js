import { GROUP, REG, REP, RULE, SEQ, TEXT, UNION } from './templateTypes';

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
  test('text in single quotes parsed into type: TEXT', () => {
    expect(textTemplate('\'some template\'')[0].type).toBe(TEXT);
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
  test('text in slashes parsed into type: REG', () => {
    expect(regTemplate('/(some|any)? ?regex/')[0].type).toBe(REG);
  });

  test('text in slashes returns string between them as match.value.pattern', () => {
    expect(regTemplate('/(some|any)? ?regex/')[0].value.pattern).toBe('(some|any)? ?regex');
  });

  test('regex escaping with backslash', () => {
    expect(regTemplate('/reg w\\/slash&\\$ymbols\\./')[0].value.pattern).toBe('reg w\\/slash&\\$ymbols\\.');
  });

  test('accept i flag following immediately after the closing slash', () => {
    expect(regTemplate('/any case/i')[0].value.ignoreCase).toBe(true);
  });

  test.each(['/no flag/', '/space before flag/ i', '/flag in capital/I', '/another flag/s'])(
    'if there\'s no "i", following immediately after the closing slash, return match.value.ignoreCase as false',
    source => {
      expect(regTemplate(source)[0].value.ignoreCase).toBe(false);
    },
  );

  test.each(['g', 'm', 's', 'u', 'y'])('don\'t match %s flag following immediately after the closing slash', flag => {
    const result = regTemplate(`/ignored flag/${flag}`);
    expect(result[1]).toBe(14);
  });

  test('positive position incremented to be after the last slash', () => {
    expect(regTemplate('regular: /expressions?/', 9)[1]).toBe(23);
  });

  test('empty reg template is not parsed', () => {
    expect(regTemplate('//')[0]).toBe(null);
  });

  test('if template is not closed with the second slash, return null match', () => {
    expect(regTemplate('/close me')[0]).toBe(null);
  });
});

describe('ruleRef', () => {
  const result = ruleRef('/reg/ ruleName', 6);

  test('if name found, return type: RULE', () => {
    expect(result[0].type).toBe(RULE);
  });

  test('if name found, return it as match.value', () => {
    expect(result[0].value).toBe('ruleName');
  });

  test('positive position incremented to be after the name', () => {
    expect(result[1]).toBe(14);
  });
});

describe('repTemplate', () => {
  test('if atomic templates joined with hat, return type: REP', () => {
    const result = repTemplate('\'ha\'^\'-\'');
    expect(result[0].type).toBe(REP);
  });

  test(`if binary rep found, return object with
              left hand expression, parsed as template, as match.value.template and
              right hand expression, parsed as template, as match.value.separator`, () => {
    const result = repTemplate('\'a\'^\'b\'');
    expect(result[0].value).toMatchSnapshot();
  });

  test('if ternary rep found, return it as nested binary repetitions', () => {
    const result = repTemplate('\'a\'^\'b\'^\'c\'');
    expect(result[0].value).toMatchSnapshot();
  });

  test('optional spaces around hat are allowed', () => {
    const result = repTemplate('/a/  ^ \'b\'');
    expect(result[0]).toMatchSnapshot();
  });

  test('positive position incremented to be after the last child template', () => {
    const result = repTemplate('repeat: /[hH]o/ ^ \'!\'', 8);
    expect(result[1]).toBe(21);
  });
});

describe('seqTemplate', () => {
  test('if atomic templates joined with spaces found, return type: SEQ', () => {
    const result = seqTemplate('\'parse\' \'it\'');
    expect(result[0].type).toBe(SEQ);
  });

  test('if binary sequence found, return array of syntax results as match.value', () => {
    const result = seqTemplate('\'Parse\' \'It\'');
    expect(result[0].value).toMatchSnapshot();
  });

  test('if ternary sequence found, return it as nested binary sequences', () => {
    const result = seqTemplate('\'we \' /go(nna|ing to) / \'parse\'');
    expect(result[0]).toMatchSnapshot();
  });

  test('multiple spaces are allowed', () => {
    const result = seqTemplate('\'many\'   \'spaces\'');
    expect(result[0]).toMatchSnapshot();
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
  test('if atomic templates joined with pipe, return type: UNION', () => {
    expect(unionTemplate('\'this\'|\'that\'')[0].type).toBe(UNION);
  });

  test('if binary union found, return array of syntax results as match.value', () => {
    expect(unionTemplate('\'this\'|\'that\'')[0].value).toMatchSnapshot();
  });

  test('if ternary union found, return it as nested binary unions', () => {
    expect(unionTemplate('\'parse\'|\'translate\'|/read/')[0]).toMatchSnapshot();
  });

  test('optional spaces around pipe are allowed', () => {
    expect(unionTemplate('\'connecting\'  |   \'people\'')[0]).toMatchSnapshot();
  });

  test('positive position incremented to be after the last child template', () => {
    expect(unionTemplate('union: /reg(ex)?/ | \'regular expression\'', 7)[1]).toBe(40);
  });
});

describe('group', () => {
  describe.each([
    ['text', '(\'group\')'],
    ['reg', '(/group/)'],
    ['rep', '(\'group\' ^ \'and\')'],
    ['seq', '(\'long\' \'group\')'],
    ['union', '(\'group\' | \'group anyway\')'],
  ])('if %sTemplate wrapped in parentheses found', (_type, source) => {
    let result;
    beforeAll(() => {
      result = group(source);
    });
    afterAll(() => {
      result = null;
    });

    test('return type: GROUP', () => {
      expect(result[0].type).toBe(GROUP);
    });

    test('return inner template result as match.value', () => {
      expect(result[0].value).toMatchSnapshot();
    })
  });

  test('group may include more than two templates', () => {
    const result = group('(/a/ \'b\' ^ \'c\')');
    expect(result[0]).toMatchSnapshot();
  });

  test('nested groups are allowed', () => {
    const result = group('((\'a\' ^ \'b\') ^ \'c\')');
    expect(result[0]).toMatchSnapshot();
  });

  test('optional spaces inside of parentheses are allowed', () => {
    const result = group('(  \'I \'  \'love \'  \'spaces!!!\'     )');
    expect(result[0]).toMatchSnapshot();
  });

  test('positive position incremented to be after the last parenthesis', () => {
    const result = group('littleGroup: (/little group/)', 13);
    expect(result[1]).toBe(29);
  });

  test.each([
    ['text', '(\'test (passes)\')', 'test (passes)'],
    ['reg', '(/passes (too|) (=\\))?/)', { pattern: 'passes (too|) (=\\))?', ignoreCase: false }],
  ])('parentheses need not to be escaped inside of %sTemplate', (type, source, value) => {
    const result = group(source);
    expect(result[0]).toEqual({ type: GROUP, value: { type, value } });
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
    expect(result[0].expression).toMatchSnapshot();
  });

  test('allow multiple spaces after the semicolon', () => {
    expect(rule('name:    \'space\' /fever/')[0]).toMatchSnapshot();
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
      type: SEQ,
      value: [
        { type: REG, value: { pattern: 'this', ignoreCase: false } },
        { type: REG, value: { pattern: 'is', ignoreCase: false } },
        { type: TEXT, value: 'a' },
        { type: REG, value: { pattern: 'sequence', ignoreCase: false } },
      ],
    });
  });

  test('n unions in a row return as one union with array of length n as match.value', () => {
    const result = rule('name: \'union\' | \'values\' | /any/ | /set/');
    expect(result[0].expression).toEqual({
      type: UNION,
      value: [
        { type: TEXT, value: 'union' },
        { type: TEXT, value: 'values' },
        { type: REG, value: { pattern: 'any', ignoreCase: false } },
        { type: REG, value: { pattern: 'set', ignoreCase: false } },
      ],
    });
  });

  test('group match value replaces the group', () => {
    const result = rule('name: (\'nested\' (\'group\'))');
    expect(result[0].expression).toEqual({
      type: SEQ,
      value: [{ type: TEXT, value: 'nested' }, { type: TEXT, value: 'group' }],
    });
  });
});
