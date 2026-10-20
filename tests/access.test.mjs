import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { createGate } from '../lib/access.mjs';

const passcode = 'test-code-only';
const salt = randomBytes(16).toString('hex');
const config = JSON.stringify({ salt, hash: scryptSync(passcode, salt, 32).toString('hex'), key: randomBytes(32).toString('hex') });
const next = () => new Response('private content', { headers: { 'X-Test-Next': 'yes' } });
const make = (options = {}) => createGate({ next, getConfig: () => config, ...options });
const request = (path = '/', cookie = '') => new Request(`https://example.com${path}`, { headers: { Cookie: cookie } });
const login = (value, origin = 'https://example.com') => new Request('https://example.com/_access/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ passcode: value }) });

test('anonymous page and direct assets are protected', async () => {
  const gate = make();
  for (const path of ['/', '/index.html', '/assets/menu.png', '/app.js', '/style.css', '/unknown']) {
    const response = await gate(request(path));
    assert.equal(response.status, 401);
    assert.match(await response.text(), /In Bearbeitung · Beta/);
    assert.match(response.headers.get('Cache-Control'), /no-store/);
  }
  assert.equal((await gate(request('/assets/logo.png'))).headers.get('X-Test-Next'), 'yes');
});
test('missing or malformed configuration fails closed', async () => {
  for (const value of ['', '{', '{}']) assert.equal((await make({ getConfig: () => value })(request())).status, 503);
});
test('wrong passcode never creates a session', async () => {
  const response = await make()(login('incorrect'));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('Set-Cookie'), null);
});
test('valid passcode creates secure cookie and permits private content', async () => {
  const gate = make();
  const response = await gate(login(passcode));
  assert.equal(response.status, 303);
  const header = response.headers.get('Set-Cookie');
  for (const attribute of ['Secure', 'HttpOnly', 'SameSite=Strict', 'Path=/']) assert.ok(header.includes(attribute));
  const privateResponse = await gate(request('/assets/menu.png', header.split(';')[0]));
  assert.equal(privateResponse.headers.get('X-Test-Next'), 'yes');
  assert.match(privateResponse.headers.get('Cache-Control'), /no-store/);
});
test('tampered and expired cookies are rejected', async () => {
  let now = 1000000;
  const gate = make({ clock: () => now });
  const cookie = (await gate(login(passcode))).headers.get('Set-Cookie').split(';')[0];
  assert.equal((await gate(request('/', cookie + 'bad'))).status, 401);
  now += 8 * 60 * 60 * 1000 + 1;
  assert.equal((await gate(request('/', cookie))).status, 401);
});
test('sessions cannot be replayed on another host', async () => {
  const gate = make();
  const cookie = (await gate(login(passcode))).headers.get('Set-Cookie').split(';')[0];
  assert.equal((await gate(new Request('https://other.example/', { headers: { Cookie: cookie } }))).status, 401);
});
test('cross-origin login and logout are rejected', async () => {
  assert.equal((await make()(login(passcode, 'https://other.example'))).status, 403);
  const logout = new Request('https://example.com/_access/logout', { method: 'POST', headers: { Origin: 'https://other.example' } });
  assert.equal((await make()(logout)).status, 403);
});
test('throttles repeated invalid attempts within an instance', async () => {
  const gate = make();
  for (let n = 0; n < 8; n++) assert.equal((await gate(login('wrong'))).status, 401);
  assert.equal((await gate(login(passcode))).status, 429);
});
test('logout expires the session cookie', async () => {
  const response = await make()(new Request('https://example.com/_access/logout', { method: 'POST', headers: { Origin: 'https://example.com' } }));
  assert.equal(response.status, 303);
  assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
});
