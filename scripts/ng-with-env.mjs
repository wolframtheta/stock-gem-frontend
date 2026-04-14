#!/usr/bin/env node
import { config } from 'dotenv';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, '..');

/**
 * @param {string[]} argv
 */
function stripEnvFileArg(argv) {
  const i = argv.indexOf('--env-file');
  if (i !== -1 && argv[i + 1]) {
    return [...argv.slice(0, i), ...argv.slice(i + 2)];
  }
  return argv;
}

/**
 * @param {string[]} argv
 */
function getExplicitEnvFile(argv) {
  const i = argv.indexOf('--env-file');
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return null;
}

/**
 * @param {string[]} argv
 */
function inferEnvFile(argv) {
  const cIdx = argv.findIndex((a) => a === '--configuration' || a === '-c');
  const configValue = cIdx !== -1 ? argv[cIdx + 1] : null;
  const configs = configValue?.split(',').map((s) => s.trim()) ?? [];

  if (configs.includes('development')) return '.env';
  if (configs.includes('production')) return '.env.pro';

  const cmd = argv[0];
  if (cmd === 'build') return '.env.pro';

  return '.env';
}

const rawArgs = process.argv.slice(2);
const explicit = getExplicitEnvFile(rawArgs);
const envRel = explicit ?? inferEnvFile(rawArgs);
const ngArgs = stripEnvFileArg(rawArgs);

config({ path: path.join(projectRoot, envRel) });

const defaultProd = envRel === '.env.pro';
process.env.NG_APP_API_URL ??= 'http://localhost:3500/api';
process.env.NG_APP_PRODUCTION ??= defaultProd ? 'true' : 'false';

const defineArgs = [];
for (const [key, value] of Object.entries(process.env)) {
  if (!key.startsWith('NG_APP_') || value === undefined || value === '') continue;
  defineArgs.push('--define', `process.env.${key}=${JSON.stringify(value)}`);
}

const ngCli = path.join(projectRoot, 'node_modules', '@angular/cli', 'bin', 'ng.js');
const child = spawn(process.execPath, [ngCli, ...ngArgs, ...defineArgs], {
  cwd: projectRoot,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
