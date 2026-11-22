import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createPasswordChange } from '../core/password-change.mjs';

function makeDom() {
  const nodes = new Map();
  const make = id => ({
    id,
    value: '',
    textContent: '',
    disabled: false,
    dataset: {},
    handlers: {},
    addEventListener(type, fn) { this.handlers[type] = fn; },
  });
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, make(id));
      return nodes.get(id);
    },
  };
  return { document, $: id => document.getElementById(id) };
}

test('displays signed-in email and falls back when signed out', () => {
  const { document, $ } = makeDom();
  let user = { email: 'soldier@example.test' };
  const pc = createPasswordChange({
    document,
    getUser: () => user,
    resetPassword: async () => {},
  });
  assert.equal($('settingsAccountEmail').textContent, 'soldier@example.test');
  assert.equal($('settingsAccountUsername').value, 'soldier@example.test');
  assert.equal($('settingsPasswordResetEmail').disabled, false);

  user = null;
  pc.refresh();
  assert.equal($('settingsAccountEmail').textContent, 'Not signed in');
  assert.equal($('settingsPasswordResetEmail').disabled, true);
});

test('validates fields before calling auth SDK', async () => {
  const { document, $ } = makeDom();
  let calls = 0;
  const pc = createPasswordChange({
    document,
    getUser: () => ({ email: 'soldier@example.test' }),
    authModuleLoader: async () => { calls++; return {}; },
  });

  assert.equal(await pc.submit(), false);
  assert.match($('settingsAccountStatus').textContent, /Enter your current and new password/);

  $('settingsCurrentPassword').value = 'oldpass1';
  $('settingsNewPassword').value = '123';
  $('settingsConfirmPassword').value = '123';
  assert.equal(await pc.submit(), false);
  assert.match($('settingsAccountStatus').textContent, /at least 6 characters/);

  $('settingsNewPassword').value = 'newpass1';
  $('settingsConfirmPassword').value = 'different';
  assert.equal(await pc.submit(), false);
  assert.match($('settingsAccountStatus').textContent, /do not match/);

  $('settingsNewPassword').value = 'oldpass1';
  $('settingsConfirmPassword').value = 'oldpass1';
  assert.equal(await pc.submit(), false);
  assert.match($('settingsAccountStatus').textContent, /differs from the current/);
  assert.equal(calls, 0);
});

test('reauthenticates, updates password, clears inputs, and handles errors', async () => {
  const { document, $ } = makeDom();
  const user = { email: 'soldier@example.test' };
  const log = [];
  let failCode = null;
  const pc = createPasswordChange({
    document,
    getUser: () => user,
    authModuleLoader: async () => ({
      EmailAuthProvider: {
        credential: (email, pass) => ({ email, pass }),
      },
      reauthenticateWithCredential: async (u, cred) => {
        log.push(['reauth', u.email, cred.pass]);
        if (failCode === 'wrong') {
          const err = new Error('bad'); err.code = 'auth/wrong-password'; throw err;
        }
      },
      updatePassword: async (u, next) => {
        log.push(['update', u.email, next]);
        if (failCode === 'recent') {
          const err = new Error('recent'); err.code = 'auth/requires-recent-login'; throw err;
        }
      },
    }),
  });

  $('settingsCurrentPassword').value = 'oldpass1';
  $('settingsNewPassword').value = 'newpass9';
  $('settingsConfirmPassword').value = 'newpass9';
  failCode = 'wrong';
  assert.equal(await pc.submit(), false);
  assert.equal($('settingsAccountStatus').textContent, 'Current password is incorrect.');
  assert.equal($('settingsNewPassword').value, 'newpass9');

  failCode = 'recent';
  assert.equal(await pc.submit(), false);
  assert.match($('settingsAccountStatus').textContent, /sign in again/);

  failCode = null;
  assert.equal(await pc.submit(), true);
  assert.deepEqual(log.slice(-2), [['reauth', 'soldier@example.test', 'oldpass1'], ['update', 'soldier@example.test', 'newpass9']]);
  assert.equal($('settingsAccountStatus').textContent, 'Password updated.');
  assert.equal($('settingsCurrentPassword').value, '');
  assert.equal($('settingsNewPassword').value, '');
  assert.equal($('settingsConfirmPassword').value, '');
});

test('handles missing SDK exports gracefully and supports password reset email & retranslate', async () => {
  const { document, $ } = makeDom();
  const sent = [];
  const translations = {
    'Password reset email sent to {email}.': 'E-Mail zum Zurücksetzen an {email} gesendet.',
  };
  let lang = 'en';
  const pc = createPasswordChange({
    document,
    getUser: () => ({ email: 'a@b.de' }),
    resetPassword: async email => { sent.push(email); },
    authModuleLoader: async () => ({}),
    translate: key => (lang === 'de' ? (translations[key] ?? key) : key),
  });

  $('settingsCurrentPassword').value = 'oldpass1';
  $('settingsNewPassword').value = 'newpass9';
  $('settingsConfirmPassword').value = 'newpass9';
  assert.equal(await pc.submit(), false);
  assert.match($('settingsAccountStatus').textContent, /unavailable/i);

  assert.equal(await pc.sendResetEmail(), true);
  assert.deepEqual(sent, ['a@b.de']);
  assert.equal($('settingsAccountStatus').textContent, 'Password reset email sent to a@b.de.');

  lang = 'de';
  pc.retranslate();
  assert.equal($('settingsAccountStatus').textContent, 'E-Mail zum Zurücksetzen an a@b.de gesendet.');

  pc.reset();
  assert.equal($('settingsCurrentPassword').value, '');
  assert.equal($('settingsAccountStatus').textContent, '');
  assert.equal($('settingsAccountEmail').textContent, 'a@b.de');
});
