// ============ Benchmarks App ============
let bmData = null;
let currentFilter = 'all';
let currentSearch = '';
let currentView = 'tree';

const arrowSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;

const modalityIcons = {
  image: '🖼️', audio: '🔊', text: '📝', video: '🎬', others: '🔮',
  'image+text': '🖼️📝', 'audio+text': '🔊📝', 'video+text': '🎬📝',
};

function getModalityIcon(modality) {
  return modalityIcons[modality] || '📦';
}

function getModalityBadgeClass(modality) {
  const base = modality.split('+')[0];
  return ['image','audio','text','video','others'].includes(base) ? base : 'others';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightText(text, search) {
  if (!search) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<span class="bm-highlight">$1</span>');
}

// ============ Tree View ============
function renderTree() {
  const container = document.getElementById('treeView');
  if (!bmData) return;

  const tree = bmData.tree;
  const search = currentSearch.toLowerCase();
  let html = '';
  let hasResults = false;

  for (const l1 of Object.keys(tree)) {
    if (currentFilter !== 'all' && l1 !== currentFilter) continue;

    const l1Class = l1 === 'understanding' ? 'understand' : 'generate';
    const l1Icon = l1 === 'understanding' ? '🔍' : '✨';
    let l2Html = '';
    let l1TaskCount = 0;

    for (const l2 of Object.keys(tree[l1])) {
      const l2Icon = l2 === 'single modal' ? '&#9675;' : '&#9670;';
      let l3Html = '';
      let l2TaskCount = 0;

      for (const l3 of Object.keys(tree[l1][l2])) {
        const tasks = tree[l1][l2][l3];
        let taskHtml = '';
        let matchedTasks = 0;

        for (const task of tasks) {
          if (search) {
            const searchable = [l1, l2, l3, task.task, ...task.benchmarks].join(' ').toLowerCase();
            if (!searchable.includes(search)) continue;
          }
          matchedTasks++;

          const chips = task.benchmarks.map(b =>
            `<span class="bm-chip">${highlightText(b, currentSearch)}</span>`
          ).join('');

          taskHtml += `
            <div class="bm-task">
              <div class="bm-task-name">${highlightText(task.task, currentSearch)}</div>
              <div class="bm-task-benchmarks">${chips}</div>
            </div>
          `;
        }

        if (matchedTasks === 0) continue;
        l2TaskCount += matchedTasks;

        l3Html += `
          <div class="bm-l3 open">
            <div class="bm-l3-header" onclick="this.parentElement.classList.toggle('open')">
              <span class="bm-l3-badge ${getModalityBadgeClass(l3)}">${getModalityIcon(l3)} ${escapeHtml(l3)}</span>
              <span class="bm-l3-count">${matchedTasks} task${matchedTasks > 1 ? 's' : ''}</span>
              <span class="bm-l3-arrow">${arrowSvg}</span>
            </div>
            <div class="bm-l3-body">${taskHtml}</div>
          </div>
        `;
      }

      if (l2TaskCount === 0) continue;
      l1TaskCount += l2TaskCount;

      l2Html += `
        <div class="bm-l2 open">
          <div class="bm-l2-header" onclick="this.parentElement.classList.toggle('open')">
            <span class="bm-l2-icon">${l2Icon}</span>
            <span class="bm-l2-title">${escapeHtml(l2)}</span>
            <span class="bm-l2-count">${l2TaskCount} task${l2TaskCount > 1 ? 's' : ''}</span>
            <span class="bm-l2-arrow">${arrowSvg}</span>
          </div>
          <div class="bm-l2-body">${l3Html}</div>
        </div>
      `;
    }

    if (l1TaskCount === 0) continue;
    hasResults = true;

    html += `
      <div class="bm-l1 ${l1Class} open">
        <div class="bm-l1-header" onclick="this.parentElement.classList.toggle('open')">
          <span class="bm-l1-icon">${l1Icon}</span>
          <span class="bm-l1-title">${escapeHtml(l1)}</span>
          <span class="bm-l1-count">${l1TaskCount} task${l1TaskCount > 1 ? 's' : ''}</span>
          <span class="bm-l1-arrow">${arrowSvg}</span>
        </div>
        <div class="bm-l1-body">${l2Html}</div>
      </div>
    `;
  }

  if (!hasResults) {
    html = `
      <div class="bm-no-results">
        <div class="bm-no-results-icon">🔍</div>
        <div class="bm-no-results-text">No benchmarks found</div>
        <div class="bm-no-results-hint">Try adjusting your search or filter</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ============ Table View ============
function renderTable() {
  const container = document.getElementById('tableView');
  if (!bmData) return;

  const search = currentSearch.toLowerCase();
  let rows = '';
  let hasResults = false;

  for (const item of bmData.flat) {
    if (currentFilter !== 'all' && item.level1 !== currentFilter) continue;

    if (search) {
      const searchable = [item.level1, item.level2, item.level3, item.level4, ...item.benchmarks].join(' ').toLowerCase();
      if (!searchable.includes(search)) continue;
    }

    hasResults = true;
    const l1Class = item.level1 === 'understanding' ? 'understand' : 'generate';

    const chips = item.benchmarks.map(b =>
      `<span class="bm-chip">${highlightText(b, currentSearch)}</span>`
    ).join('');

    rows += `
      <tr>
        <td class="l1-cell ${l1Class}">${highlightText(item.level1, currentSearch)}</td>
        <td class="l2-cell">${highlightText(item.level2, currentSearch)}</td>
        <td class="l3-cell">${highlightText(item.level3, currentSearch)}</td>
        <td class="l4-cell">${highlightText(item.level4, currentSearch)}</td>
        <td class="bm-cell"><div class="bm-task-benchmarks">${chips}</div></td>
      </tr>
    `;
  }

  if (!hasResults) {
    container.innerHTML = `
      <div class="bm-no-results">
        <div class="bm-no-results-icon">🔍</div>
        <div class="bm-no-results-text">No benchmarks found</div>
        <div class="bm-no-results-hint">Try adjusting your search or filter</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="bm-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Modality Type</th>
          <th>Modality</th>
          <th>Task</th>
          <th>Benchmarks</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ============ Render ============
function render() {
  if (currentView === 'tree') {
    renderTree();
    document.getElementById('treeView').style.display = '';
    document.getElementById('tableView').style.display = 'none';
  } else {
    renderTable();
    document.getElementById('treeView').style.display = 'none';
    document.getElementById('tableView').style.display = '';
  }
}

function updateStats() {
  if (!bmData) return;
  document.getElementById('stat-tasks').textContent = bmData.stats.total_tasks;
  document.getElementById('stat-benchmarks').textContent = bmData.stats.total_benchmarks;
  document.getElementById('stat-understand').textContent = bmData.stats.understanding_tasks;
  document.getElementById('stat-generate').textContent = bmData.stats.generation_tasks;
}

// ============ Events ============
function setupEvents() {
  const searchInput = document.getElementById('bmSearch');
  const clearBtn = document.getElementById('bmClear');

  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    clearBtn.classList.toggle('visible', currentSearch.length > 0);
    render();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearch = '';
    clearBtn.classList.remove('visible');
    render();
  });

  document.querySelectorAll('#bmTabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#bmTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      render();
    });
  });

  document.querySelectorAll('.stat-card[data-filter]').forEach(card => {
    card.addEventListener('click', () => {
      currentFilter = card.dataset.filter;
      document.querySelectorAll('#bmTabs .tab').forEach(t => {
        t.classList.toggle('active', t.dataset.filter === currentFilter);
      });
      render();
    });
  });

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      render();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

// ============ Init ============
async function init() {
  try {
    const resp = await fetch('benchmarks.json');
    bmData = await resp.json();
    updateStats();
    render();
    setupEvents();
  } catch (err) {
    console.error('Failed to load benchmarks:', err);
    document.getElementById('treeView').innerHTML = `
      <div class="bm-no-results">
        <div class="bm-no-results-icon">⚠️</div>
        <div class="bm-no-results-text">Failed to load benchmark data</div>
        <div class="bm-no-results-hint">Please ensure benchmarks.json is available</div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', init);
