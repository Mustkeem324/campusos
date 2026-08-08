#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const VERSION = '0.1.0';
const STATE_DIR = path.join(os.homedir(), '.navemora-secure-exam');
const PRIVATE_KEY_PATH = path.join(STATE_DIR, 'device-ed25519-private.pem');
const PUBLIC_KEY_PATH = path.join(STATE_DIR, 'device-ed25519-public.pem');
const DEVICE_PATH = path.join(STATE_DIR, 'device.json');
const PROFILE_DIR = path.join(STATE_DIR, 'browser-profile');
const SELF_PATH = fileURLToPath(import.meta.url);

function arg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function required(name) {
  const value = arg(name);
  if (!value) throw new Error(`Missing --${name}.`);
  return value;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function ensureStateDir() {
  fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
}

function ensureKeyPair() {
  ensureStateDir();
  if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o644 });
  }
  const privateKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  const publicKeyPem = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
  return {
    privateKeyPem,
    publicKeyPem,
    fingerprint: sha256(publicKeyPem),
  };
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `Request failed with HTTP ${response.status}.`);
  return payload;
}

function normalizeServer(value) {
  const server = value.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(server)) throw new Error('--server must be an absolute HTTP(S) origin.');
  if (process.env.NODE_ENV === 'production' && !server.startsWith('https://')) throw new Error('Production secure-client connections require HTTPS.');
  return server;
}

async function enroll() {
  const server = normalizeServer(required('server'));
  const enrollmentCode = required('code');
  const label = arg('label', `${os.hostname()} (${os.platform()})`);
  const keys = ensureKeyPair();
  const result = await postJson(`${server}/api/examinations/proctoring/runtime/client-enroll`, {
    enrollmentCode,
    label,
    platform: `${os.platform()}-${os.arch()}`,
    publicKeyPem: keys.publicKeyPem,
  });
  fs.writeFileSync(DEVICE_PATH, JSON.stringify({
    server,
    deviceId: result.deviceId,
    fingerprint: result.fingerprint,
    label,
    enrolledAt: new Date().toISOString(),
  }, null, 2), { mode: 0o600 });
  console.log(`NAVEMORA Secure Client enrolled: ${label}`);
  console.log(`Device fingerprint: ${result.fingerprint}`);
}

function findBrowser() {
  const explicit = arg('browser');
  if (explicit) return explicit;
  if (process.platform === 'darwin') {
    const candidate = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (fs.existsSync(candidate)) return candidate;
    const chromium = '/Applications/Chromium.app/Contents/MacOS/Chromium';
    if (fs.existsSync(chromium)) return chromium;
  }
  if (process.platform === 'win32') {
    const candidates = [
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ];
    for (const candidate of candidates) if (candidate && fs.existsSync(candidate)) return candidate;
  }
  for (const command of ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser']) {
    const result = spawnSync('which', [command], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  throw new Error('Chrome/Chromium was not found. Use --browser /path/to/chrome.');
}

function launchBrowser(url) {
  ensureStateDir();
  fs.mkdirSync(PROFILE_DIR, { recursive: true, mode: 0o700 });
  const browser = findBrowser();
  const flags = [
    '--kiosk',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-sync',
    '--disable-print-preview',
    '--disable-translate',
    '--disable-dev-tools',
    '--disable-session-crashed-bubble',
    '--disable-prompt-on-repost',
    '--overscroll-history-navigation=0',
    '--disable-features=ExtensionsToolbarMenu,AutofillServerCommunication,Translate',
    `--user-data-dir=${PROFILE_DIR}`,
    url,
  ];
  const child = spawn(browser, flags, { detached: true, stdio: 'ignore' });
  child.unref();
  console.log('Secure exam browser window launched.');
}

async function attest() {
  const server = normalizeServer(required('server'));
  const challengeId = required('challenge-id');
  const challengeToken = required('challenge-token');
  const nonce = required('nonce');
  const policyVersion = required('policy-version');
  const attemptId = required('attempt');
  const keys = ensureKeyPair();
  if (!fs.existsSync(DEVICE_PATH)) throw new Error('This device is not enrolled. Run the enroll command first.');
  const device = JSON.parse(fs.readFileSync(DEVICE_PATH, 'utf8'));
  if (device.fingerprint !== keys.fingerprint) throw new Error('Stored device fingerprint does not match this device key.');

  const appHash = sha256(fs.readFileSync(SELF_PATH));
  const signedMessage = `${challengeId}:${attemptId}:${nonce}:${policyVersion}:${VERSION}:${appHash}`;
  const signature = crypto.sign(null, Buffer.from(signedMessage), crypto.createPrivateKey(keys.privateKeyPem)).toString('base64url');
  const result = await postJson(`${server}/api/examinations/proctoring/runtime/client-attest`, {
    challengeToken,
    nonce,
    deviceFingerprint: keys.fingerprint,
    signature,
    policyVersion,
    clientVersion: VERSION,
    appHash,
    kioskMode: true,
    extensionsDisabled: true,
    devtoolsRestricted: true,
    posture: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      hostnameHash: sha256(os.hostname()),
      launcher: 'chromium-kiosk',
    },
  });
  if (result.state !== 'PASS') throw new Error(`Secure-client attestation returned ${result.state}. Institution review may be required.`);
  console.log('Secure-client attestation passed.');
  if (result.launchUrl) launchBrowser(result.launchUrl);
}

function usage() {
  console.log(`NAVEMORA Secure Exam Client ${VERSION}\n\nEnroll an institution-managed device:\n  node apps/secure-exam-client/launcher.mjs enroll --server https://navemora.example.com --code <enrollment-code> [--label "Lab PC 12"]\n\nAttest an exam challenge and launch the kiosk browser:\n  node apps/secure-exam-client/launcher.mjs attest --server https://navemora.example.com --challenge-id <id> --challenge-token <token> --nonce <nonce> --policy-version <version> --attempt <attempt-id> [--browser /path/to/chrome]\n`);
}

try {
  const command = process.argv[2];
  if (command === 'enroll') await enroll();
  else if (command === 'attest') await attest();
  else usage();
} catch (error) {
  console.error(`Secure client failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
