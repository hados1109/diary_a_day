const STORAGE_KEY = 'positivity-note-entries';

const addBtnWrap = document.getElementById('add-btn-wrap');
const addBtn = document.getElementById('add-btn');
const editor = document.getElementById('editor');
const editorDate = document.getElementById('editor-date');
const editorInput = document.getElementById('editor-input');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const entriesList = document.getElementById('entries-list');

// ── Helpers ──────────────────────────────────────────────

function todayString() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ── Auto-resize textarea ──────────────────────────────────

function autoResize() {
  editorInput.style.height = '22px';
  editorInput.style.height = editorInput.scrollHeight + 'px';
}

editorInput.addEventListener('input', autoResize);

// ── Render ────────────────────────────────────────────────

function render() {
  const entries = loadEntries();

  addBtnWrap.classList.remove('hidden');
  addBtn.disabled = false;

  entriesList.innerHTML = '';

  const groups = [];
  const seen = new Map();
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
  render();
}

// ── Save ──────────────────────────────────────────────────

function saveEntry() {
  const text = editorInput.value.trim();
  if (!text) return;

  const entries = loadEntries();
  entries.unshift({ date: todayString(), text });
  saveEntries(entries);
  closeEditor();
}

// ── Event listeners ───────────────────────────────────────

addBtn.addEventListener('click', openEditor);
saveBtn.addEventListener('click', saveEntry);
deleteBtn.addEventListener('click', closeEditor);

document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName.toLowerCase();
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

render();
