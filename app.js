// ============ Global State ============
let allModels = [];
let filteredModels = [];
let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'time-desc';

// ============ SVG Icons ============
const icons = {
  paper: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  io: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
};

// ============ Utility Functions ============
function getCategoryClass(category) {
  if (category === 'Auto-Regressive') return 'ar';
  if (category === 'Diffusion') return 'diff';
  return 'hybrid';
}

function truncate(text, maxLen = 200) {
  if (!text || text.length <= maxLen) return text || '';
  return text.substring(0, maxLen) + '...';
}

function formatDate(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============ Card Rendering ============
function renderCard(model, index) {
  const catClass = getCategoryClass(model.category);
  const catLabel = model.category;
  
  let metaTags = '';
  if (model.time) {
    metaTags += `<span class="meta-tag">${icons.calendar} ${escapeHtml(model.time)}</span>`;
  }
  if (model.parameter) {
    metaTags += `<span class="meta-tag">${icons.cpu} ${escapeHtml(truncate(model.parameter, 40))}</span>`;
  }
  if (model.io) {
    metaTags += `<span class="meta-tag">${icons.io} ${escapeHtml(truncate(model.io, 50))}</span>`;
  }
  
  let highlight = '';
  if (model.highlight) {
    highlight = `<div class="card-highlight">${escapeHtml(model.highlight)}</div>`;
  } else if (model.task) {
    highlight = `<div class="card-highlight">${escapeHtml(truncate(model.task, 150))}</div>`;
  }
  
  let footer = '';
  if (model.paper) {
    footer += `<a class="card-link paper" href="${escapeHtml(model.paper)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${icons.paper} Paper</a>`;
  }
  if (model.code && model.code !== '/' && model.code !== '\\' && model.code.startsWith('http')) {
    footer += `<a class="card-link code" href="${escapeHtml(model.code)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${icons.code} Code</a>`;
  }
  if (model.conference) {
    footer += `<span class="card-conference">${escapeHtml(model.conference)}</span>`;
  }
  if (model.area) {
    footer += `<span class="card-area">${escapeHtml(model.area)}</span>`;
  }

  return `
    <div class="model-card" data-category="${escapeHtml(model.category)}" data-index="${index}" onclick="openModal(${index})">
      <div class="card-header">
        <span class="card-name">${escapeHtml(model.name)}</span>
        <span class="card-badge ${catClass}">${catLabel}</span>
      </div>
      <div class="card-meta">${metaTags}</div>
      ${highlight}
      <div class="card-footer">${footer}</div>
    </div>
  `;
}

// ============ Modal Rendering ============
function renderModal(model) {
  const catClass = getCategoryClass(model.category);
  
  let badges = `<span class="card-badge ${catClass}">${model.category}</span>`;
  if (model.conference) {
    badges += `<span class="card-conference">${escapeHtml(model.conference)}</span>`;
  }
  if (model.area) {
    badges += `<span class="card-area">${escapeHtml(model.area)}</span>`;
  }
  let infoGrid = '';
  const infoItems = [
    { label: 'Date', value: model.time },
    { label: 'Parameters', value: model.parameter },
    { label: 'IO', value: model.io },
    { label: 'Backbone', value: model.backbone },
  ];
  
  for (const item of infoItems) {
    if (item.value) {
      infoGrid += `
        <div class="modal-info-item">
          <div class="modal-info-label">${item.label}</div>
          <div class="modal-info-value">${escapeHtml(item.value)}</div>
        </div>
      `;
    }
  }
  
  let sections = '';
  
  if (model.highlight) {
    sections += `
      <div class="modal-section">
        <div class="modal-section-title">Highlight</div>
        <div class="modal-section-content">${escapeHtml(model.highlight)}</div>
      </div>
    `;
  }
  
  if (model.tokenizer && model.tokenizer !== '\\' && model.tokenizer !== '/') {
    sections += `
      <div class="modal-section">
        <div class="modal-section-title">Tokenizer</div>
        <div class="modal-section-content">${escapeHtml(model.tokenizer)}</div>
      </div>
    `;
  }
  
  if (model.task) {
    sections += `
      <div class="modal-section">
        <div class="modal-section-title">Tasks</div>
        <div class="modal-section-content">${escapeHtml(model.task)}</div>
      </div>
    `;
  }
  
  if (model.dataset) {
    sections += `
      <div class="modal-section">
        <div class="modal-section-title">Dataset & Benchmark</div>
        <div class="modal-section-content">${escapeHtml(model.dataset)}</div>
      </div>
    `;
  }
  
  if (model.metric) {
    sections += `
      <div class="modal-section">
        <div class="modal-section-title">Metrics</div>
        <div class="modal-section-content">${escapeHtml(model.metric)}</div>
      </div>
    `;
  }
  
  if (model.ps) {
    sections += `
      <div class="modal-section">
        <div class="modal-section-title">Notes</div>
        <div class="modal-section-content">${escapeHtml(model.ps)}</div>
      </div>
    `;
  }
  
  let links = '';
  if (model.paper) {
    links += `<a class="modal-link paper-link" href="${escapeHtml(model.paper)}" target="_blank" rel="noopener">${icons.paper} Read Paper</a>`;
  }
  if (model.code && model.code !== '/' && model.code !== '\\' && model.code.startsWith('http')) {
    links += `<a class="modal-link code-link" href="${escapeHtml(model.code)}" target="_blank" rel="noopener">${icons.code} View Code</a>`;
  }
  
  return `
    <div class="modal-title">${escapeHtml(model.name)}</div>
    <div class="modal-badges">${badges}</div>
    <div class="modal-info-grid">${infoGrid}</div>
    ${sections}
    ${links ? `<div class="modal-links">${links}</div>` : ''}
  `;
}

// ============ Core Logic ============
function filterAndSort() {
  const search = currentSearch.toLowerCase();
  
  filteredModels = allModels.filter(m => {
    // Category filter
    if (currentCategory !== 'all' && m.category !== currentCategory) return false;

    // Search filter
    if (search) {
      const searchFields = [
        m.name, m.io, m.tokenizer, m.backbone, m.parameter,
        m.task, m.dataset, m.metric, m.conference, m.area, m.highlight
      ].map(f => (f || '').toLowerCase());
      
      return searchFields.some(f => f.includes(search));
    }
    
    return true;
  });
  
  // Sort
  filteredModels.sort((a, b) => {
    switch (currentSort) {
      case 'time-desc':
        return (b.time || '').localeCompare(a.time || '');
      case 'time-asc':
        return (a.time || '').localeCompare(b.time || '');
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('modelGrid');
  const resultsInfo = document.getElementById('resultsCount');
  
  if (filteredModels.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <div class="no-results-text">No models found</div>
        <div class="no-results-hint">Try adjusting your search or filter criteria</div>
      </div>
    `;
    resultsInfo.textContent = `No results`;
    return;
  }
  
  grid.innerHTML = filteredModels.map((m, i) => renderCard(m, allModels.indexOf(m))).join('');
  
  const catText = currentCategory === 'all' ? 'all categories' : currentCategory;
  resultsInfo.textContent = `Showing ${filteredModels.length} model${filteredModels.length !== 1 ? 's' : ''} in ${catText}`;
}

function updateStats() {
  const total = allModels.length;
  const ar = allModels.filter(m => m.category === 'Auto-Regressive').length;
  const diff = allModels.filter(m => m.category === 'Diffusion').length;
  const hybrid = allModels.filter(m => m.category === 'AR & Diffusion').length;
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-ar').textContent = ar;
  document.getElementById('stat-diff').textContent = diff;
  document.getElementById('stat-hybrid').textContent = hybrid;
}

// ============ Modal ============
function openModal(index) {
  const model = allModels[index];
  if (!model) return;
  
  document.getElementById('modalBody').innerHTML = renderModal(model);
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ============ Event Listeners ============
function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    clearBtn.classList.toggle('visible', currentSearch.length > 0);
    filterAndSort();
  });
  
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearch = '';
    clearBtn.classList.remove('visible');
    filterAndSort();
  });
  
  // Category tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      filterAndSort();
    });
  });
  
  // Stat cards also act as category filters
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category;
      currentCategory = cat;
      document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.category === cat);
      });
      filterAndSort();
    });
  });
  
  // Sort
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndSort();
  });
  
  // Modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  
  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

// ============ Init ============
async function init() {
  try {
    const response = await fetch('models.json');
    allModels = await response.json();
    
    updateStats();
    filterAndSort();
    setupEventListeners();
  } catch (err) {
    console.error('Failed to load models:', err);
    document.getElementById('modelGrid').innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">⚠️</div>
        <div class="no-results-text">Failed to load model data</div>
        <div class="no-results-hint">Please ensure models.json is available</div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', init);
