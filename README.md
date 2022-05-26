# postcss-style-docs

[PostCSS] plugin for dynamically adding documentation to styles.

[PostCSS]: https://github.com/postcss/postcss

The `postcss-style-docs` pluin will walk through your input CSS and create a map of styles to documentation blocks as a message output.

```css
/**
 * @docs
 * This is a documentation block for the .foo class
 * it can be multiple lines
 */
.foo {
  /* Input example */
}
```

```css
.foo {
  /* Output example */
}
```

## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss postcss-style-docs
```

**Step 2:** The `postcss-style-docs` plugin works best when manually calling `postcss.process` which enables users to get data out of the plugin:

```javascript
import postcss from 'postcss';
import { getDocs, styleDocsPlugin } from './lib/cjs/index';

const inputCSS = `
/**
 * @docs
 * We're doing something really fancy and our users are going
 * to love it.
 */
.something-fancy {
  color: tomato;
}

/** @docs Make it pop */
.something-fancy--pop {
  background: papayawhip;
}
`;

const { css, messages } = await postcss([
  styleDocsPlugin()
]).process(inputCSS, { from: undefined });

const docs = getDocs(messages);

console.log(docs.size); // 2
console.log(docs.get('.something-fancy')); // 'We're doing something really fancy and our users are going to love it'
console.log(docs.get('.something-fancy--pop')); // 'Make it pop'
```

[official docs]: https://github.com/postcss/postcss#usage
