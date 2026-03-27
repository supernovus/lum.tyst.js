import { parseTypedString, toTypedString } from "./typedstr.js";

const cp = Object.assign;

/**
 * A semi-private abstract class that cannot be used on its own.
 * @see {@link Transcoder}
 * @see {@link CustomFormat}
 */
export class TystClass {

  /**
   * Decode a typed string.
   * @param {string} strval - Typed string to decode.
   * @param {mixed} defval - Default value; also used to determine type.
   * @param {object} [opts] Options.
   * 
   * Anything supported by {@link parseTypedString} can be used here.
   * Any options specified here will override the same-named options
   * set in the instance itself (via constructor, getter methods, or
   * any other sources depending on the specific class).
   * 
   * @returns {mixed} See {@link parseTypedString} for details.
   */
  decode(strval, defval, opts) {
    opts = cp({}, this.decOptions, opts);
    return parseTypedString(strval, defval, opts);
  }

  /**
   * Encode a JS value as a string.
   * @param {mixed} value - Value to encode.
   * @param {object} [opts] Options.
   * 
   * Anything supported by {@link toTypedString} can be used here.
   * Any options specified here will override the same-named options
   * set in the instance itself (via constructor, getter methods, or
   * any other sources depending on the specific class).
   * 
   * @returns {?string} See {@link toTypedString} for details.
   */
  encode(value, opts) {
    opts = cp({}, this.encOptions, opts);
    return toTypedString(value, opts);
  }

}

const tp = TystClass.prototype;
tp.parse = tp.decode;
tp.stringify = tp.encode;
