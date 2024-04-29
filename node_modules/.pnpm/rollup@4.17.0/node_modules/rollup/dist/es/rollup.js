/*
  @license
	Rollup.js v4.17.0
	Sat, 27 Apr 2024 11:29:22 GMT - commit 91352494fc722bcd5e8e922cd1497b34aec57a67

	https://github.com/rollup/rollup

	Released under the MIT License.
*/
export { version as VERSION, defineConfig, rollup, watch } from './shared/node-entry.js';
import './shared/parseAst.js';
import '../native.js';
import 'node:path';
import 'path';
import 'node:process';
import 'node:perf_hooks';
import 'node:fs/promises';
import 'tty';
