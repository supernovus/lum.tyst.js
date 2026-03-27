import { TystClass } from "./baseclass.js";
import { TYPE_NAMES } from "./typedstr.js";

const ucfirst = ([first, ...rest]) => (first.toUpperCase() + rest.join(''));

/**
 * An abstract class designed so you can add specially named methods
 * that will be used by automatically-generated custom handlers.
 */
export class CustomFormat extends TystClass {
  /**
   * Build a CustomFormat instance.
   *
   * @param {object} [opts] - Default options for this instance.
   * 
   * Any options supported by either {@link toTypedString} and 
   * {@link parseTypedString} may be used here, but as these are used
   * by both, this is **NOT** the place to set custom handlers!
   * 
   */
  constructor(opts) {
    super();
    this.options = opts;
  }
}
