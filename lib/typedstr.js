import { parseFunction } from "./parsefun.js";

const lock = Object.freeze;

export const FALSE_VALS = lock(['0', 'false', 'no', 'off']);
export const NUM_TYPES = lock(['int', 'float']);
export const TYPE_NAMES = lock([
  'bigint', 'boolean', 'float', 'function', 'int', 'null', 'number',
  'object', 'string', 'symbol', 'undefined'
]);

/**
 * Get a type name and a custom handler if defined.
 * 
 * By default the type names that may be returned are mostly identical
 * to those returned by `typeof value` with a few exceptions:
 * 
 * - `null` is used for null values.
 * - `int` and `float` are used instead of `number`.
 * 
 * @param {mixed} value - Value to find type of.
 * 
 * If this is a number, then Number.isInteger() will be used to
 * determine whether to use `int` or `float` as the type name.
 * 
 * @param {object} [opts] Options and custom handlers.
 * 
 * In addition to the options listed below (and any options supported
 * by functions using this), if any of the type names are set to a 
 * function, that function will be used as a custom handler.
 * 
 * While `opts.int` and `opts.float` are preferred for setting handlers
 * for numeric values, a generic `opts.number` is supported as a fallback.
 * 
 * What custom handlers actually *do* is entirely up to the code calling
 * this; parseTypedString() will use handlers to parse a string, while
 * toTypedString() will use handlers to serialise a value into a string.
 * Any other code may use this function to make handlers for any kind of
 * value they may want to do something with.
 * 
 * @param {function} [opts.any] Create a special fallback handler.
 * 
 * This is not like the regular custom handler options, as those are
 * returned directly as the handler function. Instead if this option
 * is set, a new anonymous handler function will be created that calls
 * this option, using the type name as the _first_ argument, followed
 * by all of the arguments passed to the wrapper.
 * 
 * For example, parseTypedString() always passes `(strval, defval, opts)`
 * to custom handlers. If you want to assign a function to opts.any, 
 * you'd need to use `(type, strval, defval, opts)` as the signature to
 * take into account the extra argument the wrapper will pass.
 * 
 * @param {boolean} [opts.numeric=true] Use expanded numeric types?
 * 
 * If this is true (the default) and `value` is a number, then either `int`
 * or `float` will be used as the type name depending on the result of 
 * `Number.isInteger(value)`.
 * 
 * If this is explicitly set to false, then numbers will use `number` as
 * their type name, exactly as typeof returns. It also means that you MUST
 * use `opts.number` to set a custom handler since the other two types will
 * never be used if this option is disabled.
 * 
 * @param {ValueTypeName} [opts.type] Explicitly request the value type.
 * 
 * If this is specified, this value will be used instead of determining
 * the type from the value argument. Like the custom handler code, the
 * reasons for supporting this option are dependent on the calling code.
 * 
 * @returns {ValueTypeInfo}
 */
export function getValueType(value, opts = {}) {
  /** @type {string} */
  let type = (typeof opts.type === 'string' && TYPE_NAMES.includes(opts.type))
    ? opts.type
    : ((value === null) ? 'null' : typeof value);

  if (type === 'number' && (opts.numeric ?? true)) {
    type = Number.isInteger(value) ? 'int' : 'float';
  }

  let handler = null;
  if (typeof opts[type] === 'function') {
    handler = opts[type];
  }
  else if (NUM_TYPES.includes(type) && typeof opts.number === 'function') {
    handler = opts.number;
  }
  else if (typeof opts.any === 'function') {
    handler = function() {
      return opts.any.call(this, type, ...arguments);
    }
  }

  return { type, handler };
}

/**
 * Given a string value and a default value, this will
 * attempt to convert the string value into the same type
 * as the default value.
 * 
 * If a custom handler is specified, it will be passed all of the same
 * arguments as this function in exactly the same order. The opts object
 * will be used as the context (`this`) on non-bound handler functions.
 * 
 * If the custom handler returns anything other than `undefined` (and yes,
 * that includes `null` as a valid value), it will be returned immediately
 * with no further processing attempted. If a handler returns undefined, 
 * then the main function logic will continue normally as if the handler
 * didn't exist.
 * 
 * @param {mixed} strval - The value to convert (if necessary).
 * 
 * If this value is any type other than `string` and a custom handler wasn't
 * found or returned undefined, then by default the defval will be 
 * returned immediately with no further testing or conversion attempts.
 * 
 * This WILL have ALL whitespace trimmed unless a custom handler was used.
 * 
 * If the string is empty after trimming, then the defval will be returned
 * unless the defval is a string and opts.emptyStr is true.
 * 
 * @param {mixed} defval - The default value.
 * 
 * In addition to being the default value used if strval isn't a string,
 * the result of `getValueType(defval, opts)` will determine what the strval
 * should be converted into.
 * 
 * - `string` will simply return strval as-is.
 * - `float` will use `parseFloat(strval)`.
 * - `int` will use `parseInt(strval, opts.base)`.
 * - `bigint` will use `BigInt(strval)`.
 * - `boolean` checks if the strval matches specific values
 *   representing `false` (see `opts.false` for details).
 * - `object` will attempt to parse the strval as JSON.
 *   If it parses into an Object or Array, that will be returned.
 *   In any other case the defval will be returned, and the thrown
 *   parsing error will be sent to the console.error() method.
 * - `function` will attempt to parse strval using parseFunction();
 *   if that returns null the defval will be returned.
 * - `symbol` will use `Symbol.for(strval)` as its return value.
 * - `null` or `undefined` will act the same as `string`;
 *   unless using custom handlers, these types aren't very useful.
 * 
 * There are also types only supported when using certain options:
 * 
 * - `number` will use `+strval` to convert a numeric string into a number.
 *   See {@link getValueType} for info on when this type would be used.
 * 
 * @param {object} [opts] Advanced options.
 * 
 * In additon to the options specific to this function, it also
 * supports all of the getValueType() options. See that function
 * for more information on how to set custom handlers.
 * 
 * The options are passed to parseFunction() when type is `function`,
 * so any options supported by it may be set here as well.
 * 
 * @param {boolean} [opts.asIs=false] Return non-strings as is?
 * 
 * If you set this to true then if `strval` is not a string, it will be
 * returned as-is rather than the `defval` being returned.
 * 
 * @param {number} [opts.base] Numeric base for integers?
 * 
 * If this is not explicitly specified, the default parseInt() behaviours
 * will apply. If you only ever want to use decimal, then set this to `10`
 * to avoid any issues with numeric values with leading zeros.
 * 
 * @param {boolean} [opts.emptyStr=false] Return empty strings as is?
 * 
 * @param {string[]} [opts.false] A list of lowercase boolean `false` strings.
 * 
 * These values **MUST** be in *lowercase* as the strval will be converted
 * to lowercase before checking the list.
 * 
 * This defaults to `['0','false','no','off']` if it is not specified.
 * 
 * @param {function} [opts.reviver] A JSON reviver for `object` conversion.
 * 
 * @param {string[]} [opts.true] A list of lowercase boolean `true` strings.
 * 
 * If this is specified, the `opts.false` will be ignored entirely and
 * boolean conversion will return true if strval is one of these strings.
 * 
 * This option has no default value as its meant as an optional alternative
 * to the false value test.
 * 
 * @returns {mixed}
 */
export function parseTypedString(strval, defval, opts = {}) {

  let { type: vt, handler } = getValueType(defval, opts);
  if (typeof handler === 'function') {
    let res = handler.call(opts, strval, defval, opts);
    if (res !== undefined) {
      return res;
    }
  }

  if (typeof strval !== 'string') {
    return opts.asIs ? strval : defval;
  }

  let falseStrings = Array.isArray(opts.false) ? opts.false : FALSE_VALS;
  let trueStrings = Array.isArray(opts.true) ? opts.true : null;
  let emptyStr = opts.emptyStr && vt === 'string';

  strval = strval.trim();
  //console.debug('parseTypedString', {strval, defval, opts});
  if (strval === '') {
    return emptyStr ? strval : defval;
  }

  switch (vt) {
    case 'string':
      return strval;
    case 'float':
      return parseFloat(strval);
    case 'int':
      return parseInt(strval, opts.base);
    case 'bigint':
      return BigInt(strval);
    case 'boolean':
      strval = strval.toLowerCase();
      if (trueStrings) {
        return trueStrings.includes(strval);
      }
      return !falseStrings.includes(strval);
    case 'object':
      let obj;
      try {
        obj = JSON.parse(strval, opts.reviver);
      }
      catch (err) {
        console.error(err);
        obj = defval;
      }
      return obj;
    case 'function':
      return parseFunction(strval) ?? defval;
    case 'symbol':
      return Symbol.for(strval);
    default:
      return strval;
  }
}

/**
 * Convert a JS value to a string.
 * 
 * Meant to compliment parseTypedString() for use with a storage
 * system that only handles strings (both functions were designed
 * to be used with the Web Storage API).
 * 
 * If a custom handler is specified, it will be passed all of the same
 * arguments as this function in exactly the same order. The opts object
 * will be used as the context (`this`) on non-bound handler functions.
 * 
 * If the return value from a custom handler is a string or `null`, it will
 * be returned immediately with no further processing or tests. If the
 * return value is boolean `false`, it will be considered a validation test
 * failure and the function will return null.
 * 
 * If the return value is `undefined` or boolean `true`, the function will
 * continue its normal logic as if no handler had been found at all.
 * 
 * Any other return values are not supported and will result in an error.
 * 
 * @param {mixed} value - The value to be stringified.
 * 
 * The result of `getValueType(value, opts)` will determine how this
 * value is stringified.
 * 
 * The default logic for various types is pretty simple:
 * 
 * - `string` is returned as is.
 * - `object` is serialized as JSON.
 * - `symbol` returns the description, or null if there wasn't one.
 * - `null` or `undefined` will be null or an empty string depending
 *   on the opts.nil option value.
 * - Everything else uses `value.toString()`.
 * 
 * See above for how custom handlers can override the default logic.
 * 
 * @param {object} [opts] Options.
 * 
 * See getValueType() for additional options that may be included.
 * 
 * @param {boolean} [opts.nil=false] Encode null and undefined values?
 * 
 * If this is false (the default), then the function will return null
 * if the value is either null or undefined.
 * 
 * If this is true, then the function will use an empty string to
 * represent null and undefined values.
 * 
 * If you need more flexibility than that, use a custom handler.
 * 
 * @returns {string|null}
 * @throws {TypeError} If a handler returns an invalid value.
 */
export function toTypedString(value, opts = {}) {

  let { type: vt, handler } = getValueType(value, opts);
  if (typeof handler === 'function') {
    let res = handler.call(opts, value, opts);
    if (typeof res === 'string' || res === null) {
      return res;
    }
    else if (res === false) {
      return null;
    }
    else if (res !== true && res !== undefined) {
      throw new TypeError('Invalid toTypedString handler return value');
    }
  }

  switch (vt) {
    case 'string':
      return value;
    case 'object':
      return JSON.stringify(value);
    case 'symbol':
      return value.description ?? null;
    case 'null':
    case 'undefined':
      return opts.nil ? '' : null;
    default:
      return value.toString();
  }
}

/**
 * Value type information.
 * @typedef {object} ValueTypeInfo
 * @prop {ValueTypeName} type - The type name.
 * @prop {Function|null} handler - A custom handler (if one was found).
 */

/**
 * A valid type name.
 * @typedef {'bigint'|'boolean'|'float'|'function'|'int'|'null'|'object'|'string'|'symbol'|'undefined'} ValueTypeName
 */
