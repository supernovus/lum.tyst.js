const FUNCTION_STR = /^function(?:\s+\w+)?\s*\((?<args>.*?)\)\s*{(?<body>.*?)}$/s;
const CLOSURE_STR = /^(?:\((?<args>.*?)\)|(?<sarg>\w+))\s*=>\s*(?:{(?<fbody>.*?)}$|(?<abody>.*?)$)/s;
const ARG_SEP = /\s*,\s*/g;

/**
 * Parse a string representing a function.
 * 
 * @param {string} str - The string to parse.
 * 
 * We support several types of function strings:
 * 
 * - `function name(arg1,arg2) { body }` -- variable arguments, regular body.
 * - `function(arg1,arg2) { body }` -- variable arguments, regular body.
 * - `arg => statement` -- single argument, single statement.
 * - `(arg1,arg2) => statement` -- variable arguments, single statement.
 * - `arg => { body }` -- single argument, regular body.
 * - `(arg1,arg2) => { body }` -- variable arguments, regular body.
 * 
 * Any of the versions with _variable arguments_ may be empty `()` if there
 * are no arguments required by the function body.
 * 
 * There may be optional whitespace before and after the `()` arguments on
 * any of the strings with the `function` keyword in them.
 * 
 * Likewise if using the Arrow-closure syntax, the whitespace before and
 * after the `=>` symbol is optional.
 * 
 * @param {object} [opts] Advanced Options.
 * @param {boolean} [opts.infoOnly=false] Want the parsed args/body only?
 * 
 * If this is set to true, a `FunctionStringInfo` object will be returned.
 * If this is false (the default value), a new Function will be returned.
 * 
 * @param {boolean} [opts.retAnon] Prepend `return ` to single-statements?
 * 
 * Unless you have very specific requirements, you should probably omit this
 * argument and let the default value (`!opts.infoOnly`) be used.
 * 
 * If both this and `opts.infoOnly` are set to false, then single-statement
 * closure strings will be parsed into functions that don't return anything.
 * 
 * @returns {(Function|FunctionStringInfo|null)} Depends on arguments.
 * 
 * If the input string fails to be parsed as any of the supported formats,
 * this will return null.
 * 
 * Otherwise the return value type depends on the `opts.infoOnly` value.
 * 
 */
export function parseFunction(str, opts = {}) {
  let matches = str.match(FUNCTION_STR);
  if (!matches) {
    matches = str.match(CLOSURE_STR);
  }
  if (!matches) {
    return null;
  }

  let infoOnly = opts.infoOnly ?? false;
  let anonPre = (opts.retAnon ?? !infoOnly) ? 'return ' : '';
  let groups = matches.groups;

  let args = (groups.args ?? groups.sarg ?? '').trim();
  args = (args === '' ? [] : args.split(ARG_SEP));

  let body = groups.abody
    ? (anonPre + groups.abody.trim())
    : (groups.fbody ?? groups.body ?? '').trim();

  if (infoOnly) {
    return { args, body, singular: !!groups.abody };
  }

  // Build a dynamic Function.
  args.push(body);
  return new Function(...args);
}

/**
 * Parsed function string information.
 * @typedef {object} FunctionStringInfo
 * @prop {string[]} args - Argument names (may be empty).
 * @prop {string} body - Function body.
 * @prop {boolean} singular - Was the body a single-statement closure?
 */
