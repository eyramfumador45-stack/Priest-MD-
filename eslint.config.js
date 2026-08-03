/**
 * eslint.config.js — flat config for ESLint 9.
 * PRIEST MD — Developed by Inkora Systems
 */
'use strict';

const importPlugin = require('eslint-plugin-import');

/** Node.js globals available in CommonJS modules (ESLint flat config). */
const NODE_GLOBALS = {
  require: 'readonly',
  module: 'writable',
  exports: 'writable',
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  global: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  structuredClone: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  queueMicrotask: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  fetch: 'readonly',
  FormData: 'readonly',
  Headers: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  WebSocket: 'readonly',
  Blob: 'readonly',
  btoa: 'readonly',
  atob: 'readonly',
  performance: 'readonly',
};

module.exports = [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'sessions/**', 'logs/**', 'backups/**'],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: NODE_GLOBALS,
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-redeclare': 'error',
      'no-constant-condition': 'warn',
      'no-dupe-keys': 'error',
      'no-empty': 'warn',
      'no-eval': 'off',
    },
  },
];
