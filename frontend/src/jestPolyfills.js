// This file runs before the test framework is installed.
// Used to polyfill browser APIs that react-router-dom v7 requires in a Node/Jest environment.
const { TextEncoder, TextDecoder } = require('util');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
