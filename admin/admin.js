/* минимал® — admin panel */
(function () {
  'use strict';

  const API = 'api/';

  // ── State ────────────────────────────────────────────────────────
  let projects    = [];
  let editingSlug = null;

  // Dynamic form arrays
  let descItems   = [];
  let factsItems  = [];
  let galleryUrls = [];
  let paletteHex  = [];
  let coverUrl    = '';

  // ── Helpers ──────────────────────────────────────────────────────
  async function req(method, endpoint, body) {
    const opts = { method, credentials: 'same-origin' };
    if (body !== undefined) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body    = JSON.stringify(body);
    }
    const res = await fetch(API + endpoint, opts);
    if (res.status === 401) { showLogin(); return null; }
    return res.json().catch(() => null);
  }

  function toast(msg, err) {
    const el = document.createElement('div');
    el.className = 'toast' + (err ? ' toast--err' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function slugify(str) {
    const m = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',
      л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',
      ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
    return str.toLowerCase().replace(/[а-яё]/g, c => m[c] || c)
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  function show(id) {
    ['screen-login', 'screen-list', 'screen-form'].forEach(s => {
      const el = document.getElementById(s);
      if (el) el.hidden = (s !== id);
    });
  }

  // ── Auth ─────────────────────────────────────────────────────────
  function showLogin() {
    document.getElementById('user-info').hidden = true;
    show('screen-login');
    if (window.google) initGoogleBtn();
  }

  function initGoogleBtn() {
    const clientId = document.querySelector('meta[name="google-client-id"]')?.content || '';
    if (!clientId || clientId.startsWith('ВСТАВЬТЕ')) {
      const errEl = document.getElementById('login-error');
      errEl.textContent = 'Google Client ID не настроен — заполните admin/api/config.php';
      errEl.hidden = false;
      return;
    }
    window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredential });
    window.google.accounts.id.renderButton(document.getElementById('google-btn'), {
      theme: 'outline', size: 'large', text: 'signin_with', locale: 'ru',
    });
  }

  async function handleCredential(response) {
    const result = await req('POST', 'auth.php', { credential: response.credential });
    if (!result) return;
    if (result.error) {
      const errEl = document.getElementById('login-error');
      errEl.textContent = result.error === 'not_authorized'
        ? `Аккаунт ${result.email} не авторизован. Добавьте email в admin/api/config.php`
        : 'Ошибка входа: ' + result.error;
      errEl.hidden = false;
      return;
    }
    setUser(result.name);
    await loadList();
  }

  function setUser(name) {
    document.getElementById('user-name').textContent = name || '';
    document.getElementById('user-info').hidden = false;
  }

  async function signOut() {
    await req('DELETE', 'auth.php');
    showLogin();
  }

  // ── List ─────────────────────────────────────────────────────────
  async function loadList() {
    const data = await req('GET', 'projects.php');
    if (!data) return;
    projects = data;
    renderList();
    show('screen-list');
  }

  function renderList() {
    const countEl = document.getElementById('proj-count');
    if (countEl) countEl.textContent = projects.length;

    const el = document.getElementById('projects-list');
    if (!projects.length) {
      el.innerHTML = '<p style="text-align:center;padding:48px;color:var(--muted)">Проектов пока нет — добавьте первый</p>';
      return;
    }
    el.innerHTML = projects.map((p, i) => `
      <div class="proj-row" draggable="true" data-slug="${esc(p.slug)}">
        <span class="proj-row__drag" title="Перетащить">⠿</span>
        <span class="proj-row__num">${String(i + 1).padStart(2, '0')}</span>
        ${p.cover
          ? `<img class="proj-row__thumb" src="${esc(p.cover)}" alt="" onerror="this.style.opacity='.2'">`
          : `<div class="proj-row__thumb"></div>`}
        <div class="proj-row__info">
          <div class="proj-row__name">${esc(p.name)}</div>
          <div class="proj-row__meta">${esc(p.type)} · ${esc((p.location || '').split(',')[0])} · ${esc(p.year)} · ${esc(p.area)}</div>
        </div>
        <div class="proj-row__actions">
          <button class="btn" data-action="edit" draggable="false">Редактировать</button>
          <button class="btn btn--danger" data-action="delete" draggable="false">Удалить</button>
        </div>
      </div>
    `).join('');
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── List events (delegation) ─────────────────────────────────────
  document.getElementById('projects-list').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const slug = btn.closest('[data-slug]')?.dataset.slug;
    if (!slug) return;
    if (btn.dataset.action === 'edit') openForm(projects.find(p => p.slug === slug));
    if (btn.dataset.action === 'delete') confirmDelete(slug);
  });

  // ── Drag-and-drop reorder ─────────────────────────────────────────
  let dragSlug = null;

  (function attachDrag() {
    const list = document.getElementById('projects-list');

    list.addEventListener('dragstart', e => {
      const row = e.target.closest('.proj-row');
      if (!row) return;
      dragSlug = row.dataset.slug;
      row.classList.add('proj-row--dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    list.addEventListener('dragover', e => {
      e.preventDefault();
      const row = e.target.closest('.proj-row');
      if (!row || row.dataset.slug === dragSlug) return;
      list.querySelectorAll('.proj-row--over').forEach(r => r.classList.remove('proj-row--over'));
      row.classList.add('proj-row--over');
      e.dataTransfer.dropEffect = 'move';
    });

    list.addEventListener('dragleave', e => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        list.querySelectorAll('.proj-row--over').forEach(r => r.classList.remove('proj-row--over'));
      }
    });

    list.addEventListener('drop', async e => {
      e.preventDefault();
      const targetRow = e.target.closest('.proj-row');
      if (!targetRow || !dragSlug || targetRow.dataset.slug === dragSlug) return;

      const fromIdx = projects.findIndex(p => p.slug === dragSlug);
      const toIdx   = projects.findIndex(p => p.slug === targetRow.dataset.slug);
      if (fromIdx === -1 || toIdx === -1) return;

      const [moved] = projects.splice(fromIdx, 1);
      projects.splice(toIdx, 0, moved);
      renderList();

      const res = await req('PATCH', 'projects.php', { order: projects.map(p => p.slug) });
      if (res?.ok) toast('Порядок сохранён');
      else toast('Ошибка сохранения порядка', true);
    });

    list.addEventListener('dragend', () => {
      list.querySelectorAll('.proj-row--dragging, .proj-row--over').forEach(r => {
        r.classList.remove('proj-row--dragging', 'proj-row--over');
      });
      dragSlug = null;
    });
  })();

  async function confirmDelete(slug) {
    const p = projects.find(x => x.slug === slug);
    if (!p) return;
    if (!confirm(`Удалить проект «${p.name}»?\nЭто действие нельзя отменить.`)) return;
    const res = await req('DELETE', `projects.php?slug=${encodeURIComponent(slug)}`);
    if (res?.ok) { toast(`Проект «${p.name}» удалён`); await loadList(); }
    else toast('Ошибка удаления: ' + (res?.error || ''), true);
  }

  // ── Form ─────────────────────────────────────────────────────────
  function openForm(p) {
    editingSlug = p?.slug || null;
    const form  = document.getElementById('project-form');

    document.getElementById('form-title').textContent = p ? 'Редактирование: ' + p.name : 'Новый проект';

    const s = (name, val) => { const el = form.elements[name]; if (el) el.value = val || ''; };
    s('name',     p?.name);
    s('slug',     p?.slug);
    s('type',     p?.type);
    s('location', p?.location);
    s('year',     p?.year);
    s('area',     p?.area);
    s('duration', p?.duration);
    s('tagline',  p?.tagline);
    s('task',     p?.task);

    descItems   = p?.description ? [...p.description] : [''];
    factsItems  = p?.facts        ? p.facts.map(f => ({...f})) : [];
    galleryUrls = p?.images       ? [...p.images] : [];
    paletteHex  = p?.palette      ? [...p.palette] : [];
    coverUrl    = p?.cover || '';

    renderDesc();
    renderFacts();
    renderGallery();
    renderPalette();
    renderCover();

    show('screen-form');
    window.scrollTo(0, 0);
  }

  // ── Description ──────────────────────────────────────────────────
  function renderDesc() {
    document.getElementById('desc-list').innerHTML = descItems.map((txt, i) => `
      <div class="desc-item" data-desc-idx="${i}">
        <textarea rows="3" placeholder="Параграф ${i + 1}...">${esc(txt)}</textarea>
        <button type="button" class="btn btn--danger btn--icon" data-action="remove-desc" title="Удалить">✕</button>
      </div>
    `).join('');
  }

  document.getElementById('desc-list').addEventListener('input', e => {
    if (e.target.tagName === 'TEXTAREA') {
      const idx = +e.target.closest('[data-desc-idx]').dataset.descIdx;
      descItems[idx] = e.target.value;
    }
  });
  document.getElementById('desc-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="remove-desc"]');
    if (!btn) return;
    const idx = +btn.closest('[data-desc-idx]').dataset.descIdx;
    descItems.splice(idx, 1);
    renderDesc();
  });

  document.getElementById('btn-add-desc').addEventListener('click', () => {
    descItems.push('');
    renderDesc();
    const textareas = document.querySelectorAll('#desc-list textarea');
    textareas[textareas.length - 1]?.focus();
  });

  // ── Facts ────────────────────────────────────────────────────────
  function renderFacts() {
    document.getElementById('facts-list').innerHTML = factsItems.map((f, i) => `
      <div class="fact-item" data-fact-idx="${i}">
        <input type="text" data-fact-key="value" placeholder="87 м²" value="${esc(f.value || '')}">
        <input type="text" data-fact-key="label" placeholder="общая площадь" value="${esc(f.label || '')}">
        <button type="button" class="btn btn--danger btn--icon" data-action="remove-fact">✕</button>
      </div>
    `).join('');
  }

  document.getElementById('facts-list').addEventListener('input', e => {
    const input = e.target.closest('[data-fact-key]');
    if (!input) return;
    const idx = +input.closest('[data-fact-idx]').dataset.factIdx;
    factsItems[idx][input.dataset.factKey] = input.value;
  });
  document.getElementById('facts-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="remove-fact"]');
    if (!btn) return;
    const idx = +btn.closest('[data-fact-idx]').dataset.factIdx;
    factsItems.splice(idx, 1);
    renderFacts();
  });

  document.getElementById('btn-add-fact').addEventListener('click', () => {
    factsItems.push({ value: '', label: '' });
    renderFacts();
  });

  // ── Cover ────────────────────────────────────────────────────────
  function renderCover() {
    const preview = document.getElementById('cover-preview');
    const input   = document.getElementById('cover-val');
    input.value   = coverUrl;
    if (coverUrl) {
      preview.innerHTML = `<img src="${esc(coverUrl)}" alt="Обложка"><p class="img-url">${esc(coverUrl)}</p>`;
      preview.hidden = false;
    } else {
      preview.hidden = true;
    }
  }

  document.getElementById('btn-cover').addEventListener('click', () => {
    document.getElementById('cover-file').click();
  });

  document.getElementById('cover-file').addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    const slug = document.getElementById('project-form').elements.slug.value || 'cover';
    const btn  = document.getElementById('btn-cover');
    btn.disabled   = true;
    btn.innerHTML  = '<span class="spin"></span> Загрузка…';
    try {
      coverUrl = await uploadFile(file, slug + '-cover');
      renderCover();
      toast('Обложка загружена');
    } catch (err) {
      toast('Ошибка: ' + err.message, true);
    } finally {
      btn.disabled  = false;
      btn.textContent = 'Загрузить изображение';
      this.value    = '';
    }
  });

  // ── Gallery ───────────────────────────────────────────────────────
  function renderGallery() {
    document.getElementById('gallery-grid').innerHTML = galleryUrls.map((url, i) => `
      <div class="gal-item" data-gal-idx="${i}">
        <img src="${esc(url)}" alt="" onerror="this.style.opacity='.3'">
        <button type="button" class="gal-item__del" data-action="remove-gal" title="Удалить">✕</button>
      </div>
    `).join('');
  }

  document.getElementById('gallery-grid').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="remove-gal"]');
    if (!btn) return;
    const idx = +btn.closest('[data-gal-idx]').dataset.galIdx;
    galleryUrls.splice(idx, 1);
    renderGallery();
  });

  document.getElementById('btn-gallery').addEventListener('click', () => {
    document.getElementById('gallery-file').click();
  });

  document.getElementById('gallery-file').addEventListener('change', async function () {
    const files = Array.from(this.files);
    if (!files.length) return;
    const slug  = document.getElementById('project-form').elements.slug.value || 'project';
    const btn   = document.getElementById('btn-gallery');
    btn.disabled = true;
    try {
      for (let i = 0; i < files.length; i++) {
        btn.textContent = `Загрузка ${i + 1} / ${files.length}…`;
        const url = await uploadFile(files[i], slug + '-img');
        galleryUrls.push(url);
        renderGallery();
      }
      toast(`Загружено: ${files.length} фото`);
    } catch (err) {
      toast('Ошибка загрузки: ' + err.message, true);
    } finally {
      btn.disabled    = false;
      btn.textContent = '+ добавить фотографии';
      this.value      = '';
    }
  });

  // ── Palette ───────────────────────────────────────────────────────
  function renderPalette() {
    document.getElementById('palette-row').innerHTML = paletteHex.map((c, i) => `
      <div class="pal-item" data-pal-idx="${i}">
        <input type="color" value="${c}">
        <button type="button" class="btn btn--danger btn--icon" data-action="remove-pal">✕</button>
      </div>
    `).join('');
  }

  document.getElementById('palette-row').addEventListener('input', e => {
    const input = e.target.closest('input[type="color"]');
    if (!input) return;
    const idx = +input.closest('[data-pal-idx]').dataset.palIdx;
    paletteHex[idx] = input.value;
  });
  document.getElementById('palette-row').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="remove-pal"]');
    if (!btn) return;
    const idx = +btn.closest('[data-pal-idx]').dataset.palIdx;
    paletteHex.splice(idx, 1);
    renderPalette();
  });

  document.getElementById('btn-add-color').addEventListener('click', () => {
    paletteHex.push('#f5f0eb');
    renderPalette();
  });

  // ── Upload helper ─────────────────────────────────────────────────
  async function uploadFile(file, slug) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('slug', slug);
    const res  = await fetch(API + 'upload.php', { method: 'POST', credentials: 'same-origin', body: fd });
    const data = await res.json();
    if (!data.ok) throw new Error(data.hint || data.error || 'upload failed');
    return data.url;
  }

  // ── Form submit ───────────────────────────────────────────────────
  document.getElementById('project-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const form = e.target;
    const btn  = document.getElementById('btn-save');
    btn.disabled   = true;
    btn.innerHTML  = '<span class="spin"></span> Сохранение…';

    try {
      const data = {
        slug:        form.elements.slug.value.trim(),
        name:        form.elements.name.value.trim(),
        type:        form.elements.type.value.trim(),
        location:    form.elements.location.value.trim(),
        year:        form.elements.year.value.trim(),
        area:        form.elements.area.value.trim(),
        duration:    form.elements.duration.value.trim(),
        tagline:     form.elements.tagline.value.trim(),
        task:        form.elements.task.value.trim(),
        description: descItems.filter(p => p.trim()),
        facts:       factsItems.filter(f => (f.value || '').trim() || (f.label || '').trim()),
        cover:       coverUrl,
        images:      galleryUrls,
        palette:     paletteHex,
      };

      if (!data.name) { toast('Заполните название проекта', true); return; }
      if (!data.slug) { toast('Заполните slug', true); return; }

      const res = await req('POST', 'projects.php', data);
      if (res?.ok) {
        toast('Проект сохранён');
        await loadList();
      } else {
        toast('Ошибка: ' + (res?.hint || res?.error || 'unknown'), true);
      }
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Сохранить';
    }
  });

  // ── Nav buttons ───────────────────────────────────────────────────
  document.getElementById('btn-back').addEventListener('click',   loadList);
  document.getElementById('btn-add').addEventListener('click',    () => openForm(null));
  document.getElementById('btn-signout').addEventListener('click', signOut);

  // Auto-slug from name (only for new projects)
  document.getElementById('project-form').elements.name.addEventListener('input', function () {
    if (!editingSlug) {
      document.getElementById('project-form').elements.slug.value = slugify(this.value);
    }
  });

  // ── Init ──────────────────────────────────────────────────────────
  async function init() {
    const auth = await req('GET', 'auth.php');
    if (auth?.ok) {
      setUser(auth.name);
      await loadList();
    } else {
      showLogin();
    }
  }

  // Google Sign-In library loads async — retry init once it's ready
  window.addEventListener('load', () => {
    if (window.google && document.getElementById('google-btn').childElementCount === 0) {
      initGoogleBtn();
    }
  });

  init();
})();
