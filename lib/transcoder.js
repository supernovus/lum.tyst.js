import { parseTypedString, toTypedString } from "./typedstr.js";
import { TYPE_NAMES } from "./typedstr.js";

const TYPES = [...TYPE_NAMES, 'any'];
const cp = Object.assign;

/**
 * A class that can be passed custom encoding and decoding handlers
 * in its constructor options to provide a convenient API.
 * 
 * **Sub-class Handler Methods**
 * 
 * You can also create sub-classes with specially-named methods that
 * will be used as pre-defined type handlers.
 * 
 * The handler method names are fairly simple, they start with the type name
 * from {@link getValueType} in all lowercase letters, with the action words
 * `Encode` and `Decode` appended.
 * 
 * So for example, the methods `objectEncode()` and `objectDecode()` would
 * be used to generate default handler options for the `object` type.
 * 
 * The methods must use the same argument signature as the handler functions,
 * just noting that `this` will refer to your Transcoder subclass instance
 * rather than the options object. The signatures for the `any` wildcard
 * handlers differ from regular handlers (see {@link getValueType}).
 * 
 * **Option Source Priorities**
 * 
 * The options passed to {@link parseTypedString} and {@link toTypedString}
 * will be generated from an assortment of sources. If the same option name
 * is set in more than one source, the value from the more specific source
 * will be used. In order of least to most specific:
 * 
 * - The `allOpts` constructor argument.
 * - The auto-generated sub-class handler options.
 * - The `encOpts` and `decOpts` constructor arguments.
 * - The `opts` argument passed to the encode() and decode() methods.
 * 
 * @borrows Transcoder#decode as Transcoder#parse
 * @borrows Transcoder#encode as Transcoder#stringify
 */
export class Transcoder {
  /**
   * Build a Transcoder instance.
   * 
   * @param {object} [allOpts] Default options for this instance.
   * 
   * Any options supported by either {@link toTypedString} and 
   * {@link parseTypedString} may be used here, but as these are used
   * by both, this is **NOT** the place to set custom handlers!
   *
   * @param {object} [encOpts] Encoding-specific options.
   * 
   * Any options supported by {@link toTypedString} may be used here,
   * but it's primary purpose is to set custom handlers that will be used
   * to _encode_ (serialise) specific value types.
   * 
   * @param {object} [decOpts] Decoding-specific options.
   * 
   * Any options supported by {@link parseTypedString} may be used here,
   * but it's primary purpose is to set custom handlers that will be used
   * to _decode_ (parse) specific value types. 
   * 
   */
  constructor(allOpts, encOpts, decOpts) {
    let to = {
      Encode: cp({}, allOpts),
      Decode: cp({}, allOpts),
    };

    for (let type of TYPES) {
      for (let mode in to) {
        let meth = type+mode;
        if (typeof this[meth] === 'function') {
          to[mode][type] = (...args) => this[meth](...args);
        }
      }
    }

    this.encOptions = cp(to.Encode, encOpts);
    this.decOptions = cp(to.Decode, decOpts);
  }

  /**
   * Decode a typed string.
   * @param {string} strval - Typed string to decode.
   * @param {mixed} defval - Default value; also used to determine type.
   * @param {object} [opts] Options (if enabled).
   * @returns {mixed} See {@link parseTypedString} for details.
   */
  decode(strval, defval, opts) {
    opts = cp({}, this.decOptions, opts);
    return parseTypedString(strval, defval, opts);
  }

  /**
   * Encode a JS value as a string.
   * @param {mixed} value - Value to encode.
   * @param {object} [opts] Options (if enabled).
   * @returns {?string} See {@link toTypedString} for details.
   */
  encode(value, opts) {
    opts = cp({}, this.encOptions, opts);
    return toTypedString(value, opts);
  }
}

// Add alias methods.
const tp = Transcoder.prototype;
tp.parse = tp.decode;
tp.stringify = tp.encode;
