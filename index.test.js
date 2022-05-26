const postcss = require('postcss');
const postcssNesting = require('postcss-nesting');
const { getDocs, getDocsMessage, styleDocsPlugin, pluginName } = require('./lib/cjs/index');

async function process(input, options = {}) {
  const result = await postcss([
    styleDocsPlugin(options),
    postcssNesting(),
  ]).process(input, { from : undefined });

  expect(result.warnings()).toHaveLength(0);
  return result;
}

const defaultInput = `
/**
 * @docs
 * Simple class for styling text
 * might be multiple lines
 */
.text {
  color: #141414;
}`;

const defaultOutput = `
.text {
  color: #141414;
}`

it('will remove @docs comments', async () => {
  const { css } = await process(defaultInput);
  expect(css).toEqual(defaultOutput);
});

it('will emit a docs map', async () => {
  const result = await process(defaultInput);
  const docs = result.messages.filter(message => message.plugin === pluginName);
  const { commentMap } = docs[0];

  expect(docs.length).toEqual(1);
  expect(commentMap.size).toEqual(1);
  expect(commentMap.get('.text')).toEqual('Simple class for styling text might be multiple lines');
});

it('will run with default options', async () => {
  const result = await postcss([
    styleDocsPlugin()
  ]).process(defaultInput, { from: undefined });

  const docs = result.messages.filter(message => message.plugin === pluginName);
  const { commentMap } = docs[0];

  expect(result.css).toEqual(defaultOutput);
  expect(commentMap.size).toEqual(1);
  expect(commentMap.get('.text')).toEqual('Simple class for styling text might be multiple lines');
});

it('will preserve comments if the preserve option is set to true', async () => {
  const result = await process(defaultInput, { preserve: true });
  expect(result.css).toEqual(defaultInput);
});

it('will do nothing to comments not describing rules', async () => {
  const result = await process(`
  /** @docs Default text comment */
  .text {
    /** This is my favorite color */
    color: tomato;
  }`, { preserve: false });

  expect(result.css).toEqual(`
  .text {
    /** This is my favorite color */
    color: tomato;
  }`);

  const docs = result.messages.filter(message => message.plugin === pluginName);
  const { commentMap } = docs[0];

  expect(commentMap.size).toEqual(1);
});

it('will preserve whitespaces if cleanWhitespaces is false', async () => {
  const { messages } = await process(defaultInput, { cleanWhitespace: false });
  const message = getDocsMessage(messages);

  expect(message.commentMap.get('.text')).toEqual(`Simple class for styling text
  might be multiple lines`);
});

it('will ignore comments that do not use the comment string', async () => {
  const undocumentedInput = `
  /**
   * Simple class for styling text
   * might be multiple lines
   */
  .text {
    color: #141414;
  }
  `;
  const { messages, css } = await process(undocumentedInput);

  expect(css).toEqual(undocumentedInput);
  expect(getDocsMessage(messages).commentMap.size).toEqual(0);
});

it('will work with postcss-nesting', async () => {
  const nestedInput = `
  /**
   * @docs
   * Simple class for styling text
   * might be multiple lines
   */
  .nested-text {
    color: #141414;

    /**
     * @docs Make it pop
     */
    &.nested-text--bold {
      font-weight: 600;
    }
  }`;

  const { css, messages } = await process(nestedInput);
  const { commentMap } = getDocsMessage(messages);

  expect(css).toEqual(`
  .nested-text {
    color: #141414
  }
.nested-text.nested-text--bold {
      font-weight: 600;
    }`);

  expect(commentMap.size).toEqual(2);
  expect(commentMap.has('.nested-text')).toBe(true);
  expect(commentMap.has('.nested-text.nested-text--bold')).toBe(true);
});

it('will get the docs using the getDocs function', async () => {
  const { messages } = await process(defaultInput, {
    cleanWhitespace: true
  });
  const docs = getDocs(messages);

  expect(docs.size).toEqual(1);
  expect(docs.get('.text')).toEqual('Simple class for styling text might be multiple lines');
});
