// In-app password update & account status inside Settings -> Account.
//
// Why dynamic SDK loading: `account-services.mjs` and browser smoke doubles
// only mock the auth functions needed at boot (`signIn`, `register`, `logout`,
// `resetPassword`). Loading `EmailAuthProvider`, `reauthenticateWithCredential`
// and `updatePassword` lazily keeps boot light and never breaks synthetic page
// doubles, while using the real Firebase Auth v10 re-authentication flow when a
// player updates their password.

const FIREBASE_AUTH_SDK = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

export const MIN_PASSWORD_LENGTH = 6;

const defaultAuthLoader = () => import(FIREBASE_AUTH_SDK);

function mapPasswordError(error) {
  const code = String(error?.code || '');
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
    return 'Current password is incorrect.';
  }
  if (code === 'auth/weak-password') {
    return 'Please choose a stronger password.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'Please sign in again before changing your password.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and try again.';
  }
  if (code === 'auth/operation-not-allowed' || code === 'auth/provider-already-linked') {
    return 'Password changes are not supported for this sign-in method.';
  }
  return 'Could not update password. Please try again.';
}

export function createPasswordChange({
  document,
  getUser = () => null,
  resetPassword = null,
  changePassword = null,
  authModuleLoader = defaultAuthLoader,
  translate = text => text,
} = {}) {
  const $ = id => document?.getElementById?.(id) ?? null;
  const emailDisplay = $('settingsAccountEmail');
  const form = $('settingsPasswordForm');
  const usernameInput = $('settingsAccountUsername');
  const currentInput = $('settingsCurrentPassword');
  const nextInput = $('settingsNewPassword');
  const confirmInput = $('settingsConfirmPassword');
  const submitButton = $('settingsPasswordSubmit');
  const resetButton = $('settingsPasswordResetEmail');
  const statusEl = $('settingsAccountStatus');

  let pending = false;
  let lastStatus = null; // { key, params, tone }

  function renderStatus() {
    if (!statusEl) return;
    if (!lastStatus) {
      statusEl.textContent = '';
      if (statusEl.dataset) delete statusEl.dataset.tone;
      return;
    }
    let text = translate(lastStatus.key);
    if (lastStatus.params) {
      for (const [k, v] of Object.entries(lastStatus.params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    statusEl.textContent = text;
    if (statusEl.dataset) statusEl.dataset.tone = lastStatus.tone || 'info';
  }

  function setStatus(key, tone = 'info', params = null) {
    lastStatus = key ? { key, tone, params } : null;
    renderStatus();
  }

  function clearInputs() {
    if (currentInput) currentInput.value = '';
    if (nextInput) nextInput.value = '';
    if (confirmInput) confirmInput.value = '';
  }

  function syncBusy() {
    for (const node of [currentInput, nextInput, confirmInput, submitButton, resetButton]) {
      if (node) node.disabled = pending;
    }
  }

  function refresh() {
    const user = getUser?.();
    const email = user?.email ? String(user.email) : '';
    if (emailDisplay) {
      emailDisplay.textContent = email || translate('Not signed in');
    }
    if (usernameInput) usernameInput.value = email;
    if (resetButton) resetButton.disabled = pending || !email || typeof resetPassword !== 'function';
    renderStatus();
  }

  function reset() {
    clearInputs();
    lastStatus = null;
    pending = false;
    syncBusy();
    refresh();
  }

  async function applyPasswordChange(user, currentPassword, newPassword) {
    if (typeof changePassword === 'function') {
      await changePassword({ user, currentPassword, newPassword });
      return;
    }
    const sdk = await authModuleLoader();
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = sdk || {};
    if (!EmailAuthProvider?.credential || typeof reauthenticateWithCredential !== 'function' || typeof updatePassword !== 'function') {
      const unavailable = new Error('Password update functions unavailable');
      unavailable.code = 'ironpath/unavailable';
      throw unavailable;
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }

  async function handleSubmit(event) {
    event?.preventDefault?.();
    if (pending) return false;
    const user = getUser?.();
    if (!user || !user.email) {
      setStatus('Sign in with your email account first.', 'error');
      return false;
    }
    const currentPassword = String(currentInput?.value ?? '');
    const newPassword = String(nextInput?.value ?? '');
    const confirmPassword = String(confirmInput?.value ?? '');

    if (!currentPassword || !newPassword) {
      setStatus('Enter your current and new password.', 'error');
      return false;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setStatus('New password must be at least 6 characters.', 'error');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setStatus('New passwords do not match.', 'error');
      return false;
    }
    if (newPassword === currentPassword) {
      setStatus('Choose a new password that differs from the current one.', 'error');
      return false;
    }

    pending = true;
    syncBusy();
    setStatus('Updating password…', 'info');
    try {
      await applyPasswordChange(user, currentPassword, newPassword);
      clearInputs();
      setStatus('Password updated.', 'ok');
      return true;
    } catch (error) {
      if (error?.code === 'ironpath/unavailable') {
        setStatus('Password updates are unavailable here. Use the reset email option below.', 'error');
      } else {
        setStatus(mapPasswordError(error), 'error');
      }
      return false;
    } finally {
      pending = false;
      syncBusy();
      refresh();
    }
  }

  async function handleResetEmail() {
    if (pending) return false;
    const user = getUser?.();
    if (!user?.email || typeof resetPassword !== 'function') {
      setStatus('Sign in with your email account first.', 'error');
      return false;
    }
    pending = true;
    syncBusy();
    setStatus('Sending reset email…', 'info');
    try {
      await resetPassword(user.email);
      setStatus('Password reset email sent to {email}.', 'ok', { email: user.email });
      return true;
    } catch (error) {
      if (error?.code === 'auth/network-request-failed') {
        setStatus('Network error. Check your connection and try again.', 'error');
      } else {
        setStatus('Could not send reset email. Try again later.', 'error');
      }
      return false;
    } finally {
      pending = false;
      syncBusy();
      refresh();
    }
  }

  form?.addEventListener?.('submit', handleSubmit);
  resetButton?.addEventListener?.('click', handleResetEmail);

  refresh();
  return {
    refresh,
    reset,
    setStatus,
    retranslate: renderStatus,
    submit: handleSubmit,
    sendResetEmail: handleResetEmail,
  };
}
