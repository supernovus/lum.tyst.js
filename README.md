# lum.tyst.js

A small set of functions for working with _typed strings_.

This is not a universal serialisation system, as it does not by default
store any type information in the serialised strings. Instead it is based
on a model where you know exactly what type a specific value should be.

I guess you could use this as the foundation for a more universal system,
but it's designed more for being a simple wrapper around storage systems that
only support strings, but where you may need to store values that cannot be
directly encoded as JSON but which are simple enough to encode as a string.

## Exports

### `getValueType(value, opts)`

Get a type name and handler function (if applicable) for any JS value.
The names are mostly just what `typeof` returns, but uses `'null'` instead
of calling null and object, and by default uses `int` and `float` instead
of `number` for slightly more flexibility when dealing with numeric values.

### `parseFunction(str, opts)`

Parses a string representation of a JS function into a Function.
It supports a multitude of function string formats, including:

```js
function name(arg1, arg2) { ... } // variable args, regular body
function(arg1, arg2) { ... }      // variable args, regular body
arg => statement                  // single arg, single statement
(arg1, arg2) => statement         // variable args, single statement
arg => { ... }                    // single arg, regular body
(arg1, arg2) => { ... }           // variable args, regular body
```

Function names are ignored, single-statement functions will by default 
have `'return '` prepended to the body, and all functions are generated 
using `new Function()`; see the actual documentation for more details.

### `parseTypedString(strval, defval, opts)`

Given a string representing a JS value, and a default value (which isn't 
optional as it is used to determine what type of value to decode the string
into), this uses getValueType() to get the type info, and will use 
parseFunction() if the type name is `function` (assuming that no custom 
`function` handler was set in the options that is).

Read the function docs for info on how it handles all the other types.

### `toTypedString(value, opts)`

This uses getValueType(), and then will serialise the value into a format
that parseTypedString() will be able to parse. If you use custom handlers
when serialising, you'll obviously need to make sure you have corresponding
handlers to pass to parseTypedString() as well.

### Transcoder

A class that you can create an instance of, passing options that will
be used as defaults for both encoding and decoding.

You can also make sub-classes with specially named methods that will
be used to automatically generate custom handlers.

## TODO

- Tests

## Official URLs

This library can be found in two places:

 * [Github](https://github.com/supernovus/lum.tyst.js)
 * [NPM](https://www.npmjs.com/package/@lumjs/tyst)

## Author

Timothy Totten <2010@totten.ca>

## License

[MIT](https://spdx.org/licenses/MIT.html)
