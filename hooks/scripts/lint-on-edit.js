#!/usr/bin/env node
// PostToolUse hook: after Claude writes or edits a .js file, run the project's
// own ESLint on that file. Lint errors are sent back to Claude (exit code 2)
// so it fixes them right away. Projects without a local ESLint are skipped.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

// Walk up from the edited file to the nearest folder with a local ESLint install.
function findProjectRoot(start) {
  let dir = start;
  while (true) {
    const bin = path.join(dir, 'node_modules', 'eslint', 'bin', 'eslint.js');
    if (fs.existsSync(bin)) return { dir, bin };
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

let input = {};
try {
  input = JSON.parse(readStdin() || '{}');
} catch {
  process.exit(0);
}

const filePath = input.tool_input && input.tool_input.file_path;
if (!filePath || !/\.(c|m)?js$/.test(filePath) || !fs.existsSync(filePath)) {
  process.exit(0);
}

const project = findProjectRoot(path.dirname(path.resolve(filePath)));
if (!project) process.exit(0);

const result = spawnSync(process.execPath, [project.bin, '--no-warn-ignored', path.resolve(filePath)], {
  cwd: project.dir,
  encoding: 'utf8',
});

if (result.status === 1) {
  process.stderr.write(
    `ESLint found problems in ${path.relative(project.dir, filePath)} — please fix them:\n${result.stdout}`,
  );
  process.exit(2);
}
process.exit(0);
