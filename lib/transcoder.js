import { TystClass } from "./baseclass.js";

/**
 * A class that can be passed custom encoding and decoding handlers
 * in its constructor options to provide a convenient API.
 */
export class Transcoder extends TystClass {
  /**
   * Build a Transcoder instance.
   *
   * @param {object} [encOpts] - Encoding-specific options.
   * 
   * Any options supported by {@link toTypedString} may be used here,
   * but it's primary purpose is to set custom handlers that will be used
   * to _encode_ (serialise) specific value types.
   * 
   * @param {object} [decOpts] - Decoding-specific options.
   * 
   * Any options supported by {@link parseTypedString} may be used here,
   * but it's primary purpose is to set custom handlers that will be used
   * to _decode_ (parse) specific value types. 
   * 
   */
  constructor(encOpts, decOpts) {
    super();
    this.encOptions = encOpts;
    this.decOptions = decOpts;
  }
}
