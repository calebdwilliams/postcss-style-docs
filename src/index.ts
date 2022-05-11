import  { Comment, Message, Plugin, Root, Rule } from 'postcss';

/** Clean comments text */
function cleanComment(
  text: string,
  commentString: string,
  cleanWhitespace: boolean
): string {
  let newText = text
    .replace(/\*/gi, '')
    .replace(commentString, '')
    .trim();

  if (cleanWhitespace) {
    newText = newText.replace(/\s+/g, ' ');
  }

  return newText;
}

/** Create a map of selectors to comments */
const commentMap = new Map<string, string>();

export const pluginName = 'postcss-style-docs';

export interface StyleDocsOptions {
  /**
   * The string that signifies a comment should be treated as a doc block.
   * @default '@docs'
   */
  commentString?: string;

  /**
   * If set to true the plugin will remove whitespace from comment text
   * @default true
   */
  cleanWhitespace?: boolean;

  /**
   * When set to true the plugin will preserve comments in place;
   * otherwise, comments with the commentString sigil will be removed.
   * @default false
   */
  preserve?: boolean;
}

export interface StyleDocsMessage extends Message {
  commentMap: Map<string, string>
  type: 'documentation',
  plugin: 'postcss-style-docs'
}

/** The default options for the plugin */
const defaultOptions: StyleDocsOptions = {
  commentString: '@docs',
  cleanWhitespace: true,
  preserve: false
};

export function getDocsMessage(messages: Message[]): StyleDocsMessage {
  return messages.find(message => message.plugin === pluginName) as StyleDocsMessage;
}

/**
 * A PostCSS plugin for generating style documentation from source code
 */
export const styleDocsPlugin = (opts: StyleDocsOptions = {}): Plugin => {
  const options = Object.assign(defaultOptions, opts);
  const { cleanWhitespace, commentString, preserve } = options;

  return {
    postcssPlugin: pluginName,
    Once(root: Root): void {
      /**
       * Clear any comments that might be left over
       * from a previous run of the plugin
       */
      commentMap.clear();

      /**
       * Walking comments in root to make sure the plugin works
       * well with postcss-nesting which modifies the AST before
       * this plugin has a chance to get around to it
       */
      root.walkComments((comment: Comment) => {
        if (comment.text.includes(commentString)) {
          const text = cleanComment(comment.text, commentString, cleanWhitespace);

          /** The rule the comment will be documenting */
          const next = comment.next() as Rule;

          if (next && next.type === 'rule' && next.selector) {
            let { selector } = next;

            /** Special case for postcss-nesting */
            if (next.selector.startsWith('&')) {
              /** Loop over parents to normalize the results */
              let parent = next.parent as Rule;
              while (parent.type === 'rule') {
                const safeSelector = selector.replace('&', '');
                selector = `${parent.selector}${safeSelector}`;
                console.log({selector})
                parent = parent.parent as Rule;
              }
            }

            /** Set the selector and the text into the commentMap */
            commentMap.set(selector, text);
          }

          /**
           * By default we want to remove these blocks to reduce the amount
           * of code shipped to end users. This can be disabled using by
           * setting `preserve` to `true`.
           */
          if (!preserve) {
            comment.remove();
          }
        }
      });
    },
    OnceExit(root: Root, { result }) {
      const message: StyleDocsMessage = {
        commentMap,
        type: 'documentation',
        plugin: pluginName
      };

      result.messages.push(message);
    }
  };
};
