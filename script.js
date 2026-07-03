const USERS_KEY = 'auth-app-users';
const SESSION_KEY = 'auth-app-session';

// ---------- storage helpers ----------

function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUserByIdentifier(identifier) {
  const users = getUsers();
  const lower = identifier.trim().toLowerCase();
  return users.find(
    (u) => u.username.toLowerCase() === lower || u.email.toLowerCase() === lower
  );
}

// ---------- hashing (SHA-256, client-side only) ----------

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- validation ----------

function isPasswordStrongEnough(password) {
  return password.length >= 8 && /\d/.test(password);
}

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = 'form-message ' + (type || '');
}

// ---------- registration page ----------

const registerForm = document.getElementById('register-form');
if (registerForm) {
  const messageEl = document.getElementById('register-message');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!username || !email || !password) {
      showMessage(messageEl, 'All fields are required.', 'error');
      return;
    }

    if (!isPasswordStrongEnough(password)) {
      showMessage(messageEl, 'Password needs at least 8 characters and 1 number.', 'error');
      return;
    }

    const users = getUsers();
    const lowerUsername = username.toLowerCase();
    const lowerEmail = email.toLowerCase();
    const duplicate = users.some(
      (u) => u.username.toLowerCase() === lowerUsername || u.email.toLowerCase() === lowerEmail
    );

    if (duplicate) {
      showMessage(messageEl, 'That username or email is already registered.', 'error');
      return;
    }

    const passwordHash = await hashPassword(password);
    users.push({ username, email, passwordHash });
    saveUsers(users);

    showMessage(messageEl, 'Account created! Redirecting to login…', 'success');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 900);
  });
}

// ---------- login page ----------

const loginForm = document.getElementById('login-form');
if (loginForm) {
  const messageEl = document.getElementById('login-message');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;

    if (!identifier || !password) {
      showMessage(messageEl, 'Please fill in both fields.', 'error');
      return;
    }

    const user = findUserByIdentifier(identifier);

    // Generic message regardless of whether it's the identifier or the
    // password that's wrong — never reveal which field failed.
    const genericError = 'Incorrect username/email or password.';

    if (!user) {
      showMessage(messageEl, genericError, 'error');
      return;
    }

    const hashedAttempt = await hashPassword(password);
    if (hashedAttempt !== user.passwordHash) {
      showMessage(messageEl, genericError, 'error');
      return;
    }

    sessionStorage.setItem(SESSION_KEY, user.username);
    showMessage(messageEl, 'Login successful! Redirecting…', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);
  });
}

// ---------- dashboard page ----------

const welcomeMessage = document.getElementById('welcome-message');
if (welcomeMessage) {
  const activeUser = sessionStorage.getItem(SESSION_KEY);

  if (!activeUser) {
    window.location.href = 'login.html';
  } else {
    welcomeMessage.textContent = `You're logged in as ${activeUser}.`;
  }

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
  });
}
