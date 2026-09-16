#!/usr/bin/env node
/**
 * Scaffold a new backend project from this template.
 *
 * Usage: npm run new -- project <nama>
 *
 * Creates ../<nama>, renames DB schema from "template", and derives secrets
 * deterministically so API_TOKEN matches Vue VITE_APP_KEY for the same name.
 */
import { createHmac } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = path.resolve(__dirname, '..');

/** Must stay identical in Vue template scripts/new-project.mjs */
const SALT = 'cursor-template-scaffold-v1';

const EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  'uploads',
]);

const EXCLUDE_FILES = new Set([
  '.env.development',
  '.env.production',
  '.env.local',
  'package-lock.json',
]);

function derive(purpose, project) {
  return createHmac('sha256', SALT).update(`${purpose}:${project}`).digest('hex');
}

function titleCase(slug) {
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function usage() {
  console.error('Usage: npm run new -- project <nama_project>');
  console.error('  nama_project: lowercase [a-z0-9_], must start with a letter');
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length < 2 || args[0] !== 'project') usage();
  const name = args[1]?.trim();
  if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
    console.error(`Invalid project name: ${name ?? '(empty)'}`);
    usage();
  }
  if (name === 'template') {
    console.error('Project name "template" is reserved.');
    process.exit(1);
  }
  return name;
}

function shouldSkip(relPosix) {
  const parts = relPosix.split('/');
  if (parts.some((p) => EXCLUDE_DIRS.has(p))) return true;
  const base = parts[parts.length - 1];
  if (EXCLUDE_FILES.has(base)) return true;
  return false;
}

function copyTree(srcRoot, destRoot) {
  mkdirSync(destRoot, { recursive: true });
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const src = path.join(dir, entry);
      const rel = path.relative(srcRoot, src).split(path.sep).join('/');
      if (shouldSkip(rel)) continue;
      const dest = path.join(destRoot, path.relative(srcRoot, src));
      const st = statSync(src);
      if (st.isDirectory()) {
        mkdirSync(dest, { recursive: true });
        walk(src);
      } else if (st.isFile()) {
        mkdirSync(path.dirname(dest), { recursive: true });
        cpSync(src, dest);
      }
    }
  };
  walk(srcRoot);
}

function walkFiles(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry)) continue;
      walkFiles(full, exts, out);
    } else if (exts.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

/** Rename Postgres schema identifier "template" in SQL / JS export helpers. */
function rewriteSchemaRefs(content, schema) {
  return content
    .replace(/CREATE SCHEMA IF NOT EXISTS template\b/g, `CREATE SCHEMA IF NOT EXISTS ${schema}`)
    .replace(/SET search_path TO template\b/g, `SET search_path TO ${schema}`)
    .replace(/table_schema = 'template'/g, `table_schema = '${schema}'`)
    .replace(/\(schema `template`\)/g, `(schema \`${schema}\`)`)
    .replace(/\(schema template\)/g, `(schema ${schema})`)
    .replace(/Schema "template"/g, `Schema "${schema}"`)
    .replace(/\btemplate\."/g, `${schema}."`)
    .replace(/\btemplate\./g, `${schema}.`);
}

function setEnvValue(content, key, value) {
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) return content.replace(re, `${key}=${value}`);
  return `${content.trimEnd()}\n${key}=${value}\n`;
}

function getEnvValue(content, key) {
  const m = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return m ? m[1].trim() : '';
}

function loadTemplateEnvSource() {
  const envSource = existsSync(path.join(TEMPLATE_ROOT, '.env.development'))
    ? path.join(TEMPLATE_ROOT, '.env.development')
    : path.join(TEMPLATE_ROOT, '.env.example');
  return { envSource, baseEnv: readFileSync(envSource, 'utf8') };
}

/**
 * Ask DB_NAME / DB_USER / DB_PASSWORD. Enter = keep default from template env.
 */
async function promptDbCredentials(defaults) {
  const rl = readline.createInterface({ input, output });
  try {
    console.log('');
    console.log('Database credentials (Enter = keep default):');
    const dbName = (await rl.question(`  DB_NAME [${defaults.dbName}]: `)).trim() || defaults.dbName;
    const dbUser = (await rl.question(`  DB_USER [${defaults.dbUser}]: `)).trim() || defaults.dbUser;
    const dbPassword =
      (await rl.question(`  DB_PASSWORD [${defaults.dbPassword ? '********' : '(empty)'}]: `)).trim() ||
      defaults.dbPassword;
    return { dbName, dbUser, dbPassword };
  } finally {
    rl.close();
  }
}

function buildEnv(baseEnv, name, secrets, db) {
  let env = baseEnv;
  env = setEnvValue(env, 'DB_NAME', db.dbName);
  env = setEnvValue(env, 'DB_USER', db.dbUser);
  env = setEnvValue(env, 'DB_PASSWORD', db.dbPassword);
  env = setEnvValue(env, 'DB_SCHEMA', name);
  env = setEnvValue(env, 'JWT_SECRET', secrets.jwtSecret);
  env = setEnvValue(env, 'APP_KEY', secrets.appKey);
  env = setEnvValue(env, 'API_TOKEN', secrets.apiToken);
  env = setEnvValue(env, 'COOKIE_SECRET', secrets.cookieSecret);
  env = setEnvValue(env, 'AES_KEY', secrets.aesKey);
  env = setEnvValue(env, 'OTEL_SERVICE_NAME', `api-${name}`);
  env = setEnvValue(env, 'MINIO_BUCKET', `${name}-uploads`);
  env = env.replace(
    /API Template - development environment/g,
    `API ${titleCase(name)} - development environment`,
  );
  return env;
}

function patchApplicationSeed(filePath, name, secrets) {
  if (!existsSync(filePath)) return;
  let sql = readFileSync(filePath, 'utf8');
  const display = titleCase(name);

  // Rewrite INSERT value tuple: app_key, nama, deskripsi, domain, api_token, …
  sql = sql.replace(
    /(INSERT INTO \w+\."d_application"[^;]*VALUES\s*\(\s*)'[^']*'\s*,\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([^']*)'\s*,\s*'[^']*'/,
    `$1'${secrets.appKey}', 'API ${display}', 'NestJS + Fastify API — ${display}', '$2', '${secrets.apiToken}'`,
  );

  writeFileSync(filePath, sql, 'utf8');
}

async function main() {
  const name = parseArgs(process.argv);
  const destRoot = path.resolve(TEMPLATE_ROOT, '..', name);

  if (existsSync(destRoot)) {
    console.error(`Destination already exists: ${destRoot}`);
    process.exit(1);
  }

  const { baseEnv } = loadTemplateEnvSource();
  const db = await promptDbCredentials({
    dbName: getEnvValue(baseEnv, 'DB_NAME') || name,
    dbUser: getEnvValue(baseEnv, 'DB_USER') || 'postgres',
    dbPassword: getEnvValue(baseEnv, 'DB_PASSWORD') || '',
  });

  const secrets = {
    apiToken: derive('api-token', name).slice(0, 48),
    jwtSecret: derive('jwt-secret', name),
    appKey: derive('app-key', name).slice(0, 32),
    cookieSecret: derive('cookie-secret', name).slice(0, 48),
    aesKey: derive('aes-key', name).slice(0, 32),
  };

  console.log('');
  console.log(`Scaffolding backend project "${name}" → ${destRoot}`);
  copyTree(TEMPLATE_ROOT, destRoot);

  // package.json
  const pkgPath = path.join(destRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.name = `api-${name}`;
  pkg.description = `API ${titleCase(name)} - NestJS + Fastify`;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  // SQL / seeder / export helpers: rename schema template → name
  const sqlRoots = [
    path.join(destRoot, 'database'),
  ];
  for (const root of sqlRoots) {
    for (const file of walkFiles(root, ['.sql', '.js'])) {
      const before = readFileSync(file, 'utf8');
      const after = rewriteSchemaRefs(before, name);
      if (after !== before) writeFileSync(file, after, 'utf8');
    }
  }

  writeFileSync(
    path.join(destRoot, '.env.development'),
    buildEnv(baseEnv, name, secrets, db),
    'utf8',
  );

  // Also refresh .env.example placeholders for the new project
  const examplePath = path.join(destRoot, '.env.example');
  if (existsSync(examplePath)) {
    let example = readFileSync(examplePath, 'utf8');
    example = setEnvValue(example, 'DB_SCHEMA', name);
    example = setEnvValue(example, 'DB_NAME', db.dbName);
    example = setEnvValue(example, 'DB_USER', db.dbUser);
    example = setEnvValue(example, 'DB_PASSWORD', '');
    example = setEnvValue(example, 'OTEL_SERVICE_NAME', `api-${name}`);
    example = setEnvValue(example, 'MINIO_BUCKET', `${name}-uploads`);
    example = example.replace(/API Template/g, `API ${titleCase(name)}`);
    writeFileSync(examplePath, example, 'utf8');
  }

  patchApplicationSeed(
    path.join(destRoot, 'database', 'seeders', '08_d_application.sql'),
    name,
    secrets,
  );

  console.log('');
  console.log('Done.');
  console.log(`  DB_NAME       = ${db.dbName}`);
  console.log(`  DB_USER       = ${db.dbUser}`);
  console.log(`  DB_SCHEMA     = ${name}`);
  console.log(`  API_TOKEN     = ${secrets.apiToken}`);
  console.log(`  (match Vue VITE_APP_KEY when scaffolding FE with the same name)`);
  console.log('');
  console.log('Next steps:');
  console.log(`  cd ${destRoot}`);
  console.log('  npm install');
  console.log('  npm run db:schema');
  console.log('  npm run db:seed');
  console.log('  npm run start:dev');
}

main().catch((err) => {
  console.error(err);
  // Best-effort cleanup if partial copy
  const name = process.argv[3];
  if (name && /^[a-z][a-z0-9_]*$/.test(name)) {
    const dest = path.resolve(TEMPLATE_ROOT, '..', name);
    if (existsSync(dest)) {
      try {
        rmSync(dest, { recursive: true, force: true });
        console.error(`Cleaned partial output: ${dest}`);
      } catch {
        /* ignore */
      }
    }
  }
  process.exit(1);
});
