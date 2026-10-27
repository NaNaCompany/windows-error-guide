import {matchesRecord} from './core.mjs';

export function initDirectory(root = document) {
  const config = JSON.parse(root.querySelector('#app-config').textContent);
  const ui = config.ui;
  const status = root.querySelector('#status');
  const copy = root.querySelector('#copy-code');
  copy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copy.dataset.code || '');
      if (status) status.textContent = ui.copied;
    } catch {
      if (status) status.textContent = ui.copyFailed;
    }
  });
  const search = root.querySelector('#search');
  if (search) {
    const brand = root.querySelector('#brand-filter');
    const category = root.querySelector('#category-filter');
    const count = root.querySelector('#result-count');
    const empty = root.querySelector('#no-results');
    const cards = [...root.querySelectorAll('[data-record]')].map(node => {
      let aliases = [];
      try { aliases = JSON.parse(node.dataset.aliases || '[]'); } catch { /* Treat malformed optional aliases as empty. */ }
      return {node, record: {...node.dataset, aliases}};
    });
    const update = () => {
      let visible = 0;
      for (const {node, record} of cards) {
        node.hidden = !matchesRecord(record, search.value, {brand: brand?.value || 'all', category: category?.value || 'all'});
        if (!node.hidden) visible++;
      }
      if (count) count.textContent = ui.results.replace('{n}', String(visible));
      if (empty) empty.hidden = visible !== 0;
    };
    search.addEventListener('input', update);
    brand?.addEventListener('change', update);
    category?.addEventListener('change', update);
    root.querySelector('#clear-search')?.addEventListener('click', () => {
      search.value = '';
      if (brand) brand.value = 'all';
      if (category) category.value = 'all';
      update();
      search.focus();
    });
    update();
  }
  root.documentElement.classList.add('app-ready');
}

if (typeof document !== 'undefined') {
  try { initDirectory(); } catch {
    let message = '';
    try { message = JSON.parse(document.querySelector('#app-config').textContent).ui.loadFailed; } catch { /* Config may be invalid. */ }
    const status = document.querySelector('#status');
    if (status) status.textContent = message;
  }
}
