/**
 * A sub-module for testing related functions and classes.
 * @module @lumjs/tyst/tests
 */

const S = Symbol('@lumjs/tyst/tests.Storage');

export function str(val) {
  switch (val) {
    case undefined: return 'undefined';
    case null: return 'null';     
  }
  return val.toString();
}

/**
 * A class that emulates a strict subset of the Web Storage API.
 * 
 * Without using a Proxy, this class requires the use of the API methods
 * to work with the data. For example, you must use `storage.getItem('key')`,
 * trying to use `storage.key` or `storage['key']` will NOT work here.
 * 
 * All the keys and values in storage must be string values. If you pass
 * a non-string argument as a key and/or value, it will be stringified using
 * the toString() method when possible, and hard-coded values of `null` and
 * `undefined` for the types that don't have a toString() method.
 */
export class Storage {

  /**
   * Create a new storage instance.
   * 
   * @param {object} [data] Initial data (optional).
   * 
   * This may be a `Map` instance, or a _plain_ object with enumerable
   * string-keyed properties (like JSON.parse() returns for instance).
   * The setItem() method will be used for each key-value pair.
   */
  constructor(data) {
    this[S] = {
      /** @type {Map<string, string>} */
      data: new Map(),
      /** @type {string[]} */
      keys: [],
      /** A pointer to the unwrapped Storage instance */
      self: this,
    }

    if (data && typeof data === 'object') {
      if (data instanceof Map) {
        for (let [key, val] of data) {
          this.setItem(key, val);
        }
      }
      else {
        for (let key in data) {
          this.setItem(key, data[key]);
        }
      }
    }
  }

  /**
   * The amount of key-value pairs in the storage data.
   */
  get length() {
    return this[S].keys.length;
  }

  /**
   * Clear the stored data.
   */
  clear() {
    this[S].data.clear();
    this[S].keys.length = 0;
  }

  /**
   * Get an item from storage.
   * @param {string} key - Key to get the value of.
   * @returns {?string} Will be `null` if the key does not exist.
   */
  getItem(key) {
    return this[S].data.get(str(key)) ?? null;
  }

  /**
   * Get the nth key name in the storage data.
   * 
   * The index of keys are in the order they were added in.
   * If you delete a key, the indexes will be reordered to
   * account for the removed key, so there will never be any
   * gaps in the index numbers.
   * 
   * @param {number} index - Index to return key for.
   * @returns {?string} Will be `null` if the index does not exist.
   */
  key(index) {
    return this[S].keys[index] ?? null;
  }

  /**
   * Remove an item from the storage data.
   * @param {string} key - Key of item to remove.
   * @returns {void}
   */
  removeItem(key) {
    let s = this[S];
    key = str(key);
    s.data.delete(key);
    let i = s.keys.indexOf(key);
    if (i !== -1) {
      s.keys.splice(i, 1);
    }
  }

  /**
   * Add or update a storage item.
   * @param {string} key - Key of item to set.
   * @param {string} value - Value to set.
   * @returns {void}
   */
  setItem(key, value) {
    let s = this[S];
    key = str(key);
    s.data.set(key, str(value));
    if (!s.keys.includes(key)) {
      s.keys.push(key);
    }
  }

  /**
   * Returns a plain object that can be serialised as JSON.
   */
  toJSON() {
    let odata = {};
    let idata = this[S].data;
    for (let [key, val] of idata) {
      odata[key] = val;
    }
    return odata;
  }

}

/**
 * A Symbol used for the internal data of a Storage object.
 * @type {Symbol}
 * @name module:@lumjs/tyst/tests.Storage.STORE
 */
Object.defineProperty(Storage, 'STORE', { value: S });

/**
 * Create a Proxy-wrapped Storage object.
 * 
 * This function is like `Symbol` and `BigInt` in that you should call it 
 * without using the `new` operator.
 * 
 * The get() handler is conditional, properties that are defined on the
 * Storage instance itself will be returned as-is, while any key that
 * doesn't exist as an instance property will be forwarded to getItem().
 * 
 * The set() and deleteProperty() handlers are unconditional, and only
 * ever call setItem() and removeItem() respectively.
 * 
 * @param {object} [data] Data.
 * 
 * If this is a {@link Storage} instance, it will be used as the target
 * to be wrapped. Any other kind of object will be passed to `new Storage()`
 * to create an instance that will be wrapped.
 * 
 * @returns {Proxy}
 * 
 * @example
 * 
 * import {Storage, ProxyStorage} from '@lumjs/tyst/tests';
 * 
 * const SMD = Storage.STORE;    // Symbol for metadata property.
 * 
 * let pstore = ProxyStorage();
 * 
 * pstore.name                   // → pstore.getItem('name') ← null
 * pstore.name = 'Sam'           // → pstore.setItem('name', 'Sam')
 * pstore.name                   // → pstore.getItem('name') ← 'Sam'
 * 
 * // The metadata property exists on the Storage instance itself.
 * let metadata = pstore[SMD]    // → pstore[SMD] ← Object
 * metadata.keys                 // ← ['name']
 * 
 * delete pstore.name            // → pstore.removeItem('name')
 * metadata.keys                 // → []
 * 
 * // You cannot set or delete real instance properties via the proxy.
 * delete pstore[SMD]            // → pstore.removeItem(SMD)
 * 
 * // You can however on the unwrapped instance, but why?
 * delete metadata.self[SMD]     // Prepare for trouble and make it double...
 * pstore.name = 'Bob'           // Error thrown due to undefined references!
 * 
 */
export function ProxyStorage(data) {
  const storage = (data instanceof Storage) ? data : new Storage(data);
  return new Proxy(storage, {
    get(t, p) {
      return t[p] ?? t.getItem(p);
    },
    set(t, p, v) {
      t.setItem(p, v);
      return true;
    },
    deleteProperty(t, p) {
      t.removeItem(p);
      return true;
    },
  });
}

/**
 * Internal Storage Data.
 * @typedef {object} StorageInternalStore
 * @prop {Map<string,string>} data - The actual data key-value map.
 * @prop {string[]} keys - A list of keys in the order they were added.
 * @prop {Storage} self - A reference to the storage instance itself.
 */
