const comment = require('./comment').default;

test('if string starting with sharp found, return object with `comment: true` as match', () => {
  expect(comment('#comment\nsomething else')[0].comment).toBe(true);
});

test('source might end with a comment', () => {
  expect(comment('# comment')[0].comment).toBe(true);
});

test.each(['\n', '\r', '\r\n'])('set position at the beginning of the next line', eol => {
  expect(comment(`# comment${eol}next line`)[1]).toBe(9 + eol.length);
});
