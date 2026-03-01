import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCvlsiGh78XZeBs86qZj0gNyCv4p0_GB6k",
  authDomain: "diary-a-day.firebaseapp.com",
  projectId: "diary-a-day",
  storageBucket: "diary-a-day.firebasestorage.app",
  messagingSenderId: "217753986789",
  appId: "1:217753986789:web:a398ec34736d06e254d60c",
  measurementId: "G-W326BD09BF",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);

// ── DOM refs ──────────────────────────────────────────────

const authScreen     = document.getElementById('auth-screen');
const diary          = document.getElementById('diary');
const authEmail      = document.getElementById('auth-email');
const authPassword   = document.getElementById('auth-password');
const authSubmitBtn  = document.getElementById('auth-submit-btn');
const authModeToggle = document.getElementById('auth-mode-toggle');
const toggleLogin    = document.getElementById('toggle-login');
const toggleSignup   = document.getElementById('toggle-signup');
const authError      = document.getElementById('auth-error');
const logoutBtn      = document.getElementById('logout-btn');
const userEmail      = document.getElementById('user-email');

const addBtnWrap  = document.getElementById('add-btn-wrap');
const addBtn      = document.getElementById('add-btn');
const editor      = document.getElementById('editor');
const editorDate  = document.getElementById('editor-date');
const editorInput = document.getElementById('editor-input');
const saveBtn     = document.getElementById('save-btn');
const deleteBtn   = document.getElementById('delete-btn');
const entriesList = document.getElementById('entries-list');

// ── Helpers ──────────────────────────────────────────────

function todayString() {
  const d = new Date();
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ── Firestore ─────────────────────────────────────────────

function entriesRef(uid) {
  return collection(db, 'users', uid, 'entries');
}

async function loadEntries(uid) {
  const q    = query(entriesRef(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function addEntry(uid, date, text) {
  await addDoc(entriesRef(uid), { date, text, createdAt: serverTimestamp() });
}

// ── Render ────────────────────────────────────────────────

function render(entries) {
  entriesList.innerHTML = '';

  const groups = [];
  const seen   = new Map();

  entries.forEach(entry => {
    if (!seen.has(entry.date)) {
      const texts = [];
      seen.set(entry.date, texts);
      groups.push({ date: entry.date, texts });
    }
    seen.get(entry.date).push(entry.text);
  });

  groups.forEach(group => {
    const div = document.createElement('div');
    div.className = 'entry';

    const date = document.createElement('p');
    date.className = 'entry-date';
    date.textContent = group.date;

    const text = document.createElement('p');
    text.className = 'entry-text';
    text.textContent = group.texts.slice().reverse().join('\n\n');

    div.appendChild(date);
    div.appendChild(text);
    entriesList.appendChild(div);
  });
}

async function loadAndRender(uid) {
  const entries = await loadEntries(uid);
  render(entries);
}

// ── Auto-resize textarea ──────────────────────────────────

function autoResize() {
  editorInput.style.height = '22px';
  editorInput.style.height = editorInput.scrollHeight + 'px';
}

editorInput.addEventListener('input', autoResize);

// ── Editor open / close ───────────────────────────────────

function openEditor() {
  if (!editor.classList.contains('hidden')) return;
  editorDate.textContent = todayString();
  editorInput.value = '';
  editorInput.style.height = '22px';
  editor.classList.remove('hidden');
  editorInput.focus();
}

function closeEditor() {
  editor.classList.add('hidden');
  editorInput.value = '';
  editorInput.style.height = '22px';
  const uid = auth.currentUser?.uid;
  if (uid) loadAndRender(uid);
}

// ── Save ──────────────────────────────────────────────────

async function saveEntry() {
  const text = editorInput.value.trim();
  if (!text) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await addEntry(uid, todayString(), text);
  closeEditor();
}

// ── Auth ──────────────────────────────────────────────────

function showAuthScreen() {
  diary.classList.add('hidden');
  authScreen.style.display = '';
  authEmail.value    = '';
  authPassword.value = '';
  setAuthMode('login');
}

function showDiary(uid) {
  authScreen.style.display = 'none';
  diary.classList.remove('hidden');
  const email = auth.currentUser?.email ?? '';
  userEmail.textContent = email.split('@')[0];
  loadAndRender(uid);
}

function authErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email':        return 'Invalid email address.';
    case 'auth/user-not-found':       return 'No account with that email.';
    case 'auth/wrong-password':       return 'Incorrect password.';
    case 'auth/email-already-in-use': return 'Email already in use.';
    case 'auth/weak-password':        return 'Password must be at least 6 characters.';
    case 'auth/invalid-credential':   return 'Incorrect email or password.';
    default:                          return 'Something went wrong. Try again.';
  }
}

// ── Auth mode toggle ──────────────────────────────────────

let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  if (mode === 'signup') {
    authModeToggle.classList.add('signup');
    authModeToggle.setAttribute('aria-checked', 'true');
    toggleLogin.classList.remove('active');
    toggleSignup.classList.add('active');
    authSubmitBtn.textContent = 'Sign up';
  } else {
    authModeToggle.classList.remove('signup');
    authModeToggle.setAttribute('aria-checked', 'false');
    toggleLogin.classList.add('active');
    toggleSignup.classList.remove('active');
    authSubmitBtn.textContent = 'Log in';
  }
  authError.textContent = '';
}

authModeToggle.addEventListener('click', () => {
  setAuthMode(authMode === 'login' ? 'signup' : 'login');
});

toggleLogin.addEventListener('click', () => setAuthMode('login'));
toggleSignup.addEventListener('click', () => setAuthMode('signup'));

authSubmitBtn.addEventListener('click', async () => {
  const email    = (authEmail.value || '').trim();
  const password = authPassword.value || '';
  authError.textContent = '';
  if (!email || !password) {
    authError.textContent = 'Please enter your email and password.';
    return;
  }
  authSubmitBtn.disabled = true;
  try {
    if (authMode === 'signup') {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (e) {
    authError.textContent = authErrorMessage(e.code);
  } finally {
    authSubmitBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// ── Diary event listeners ─────────────────────────────────

addBtn.addEventListener('click', openEditor);
saveBtn.addEventListener('click', saveEntry);
deleteBtn.addEventListener('click', closeEditor);

document.addEventListener('keydown', e => {
  if (diary.classList.contains('hidden')) return;

  const tag        = document.activeElement.tagName.toLowerCase();
  const inTextarea = tag === 'textarea' || tag === 'input';

  if (!inTextarea && e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    openEditor();
    return;
  }

  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    saveEntry();
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    closeEditor();
  }
});

// ── Init ──────────────────────────────────────────────────

onAuthStateChanged(auth, user => {
  if (user) {
    showDiary(user.uid);
  } else {
    showAuthScreen();
  }
});
