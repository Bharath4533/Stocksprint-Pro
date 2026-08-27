// Global Search Component (Cmd+K) for NexTrade Pro

class GlobalSearchModal {
  constructor() {
    this.init();
    this.setupShortcuts();
  }

  init() {
    if (document.getElementById('global-search-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'global-search-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 580px; padding: 0;">
        <div style="padding: 16px; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 18px; color: var(--text-tertiary);">🔍</span>
          <input type="text" id="global-search-input" placeholder="Search stocks, mutual funds, IPOs, indices..." 
                 style="flex: 1; border: none; background: transparent; font-size: 16px; color: var(--text-primary); outline: none;"
                 oninput="SearchModal.onInput(this.value)">
          <kbd style="font-size: 11px; padding: 2px 6px; background: var(--bg-surface-subtle); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-tertiary);">ESC</kbd>
        </div>
        <div id="global-search-results" style="max-height: 400px; overflow-y: auto; padding: 10px 0;">
          <!-- Results injected dynamically -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  setupShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.open();
      }
    });
  }

  open() {
    this.init();
    Modal.open('global-search-modal');
    const input = document.getElementById('global-search-input');
    if (input) {
      input.value = '';
      input.focus();
      this.onInput('');
    }
  }

  async onInput(query) {
    const container = document.getElementById('global-search-results');
    if (!container) return;

    try {
      const data = await api.get(`/markets/search?q=${encodeURIComponent(query)}`);
      let html = '';

      if (!query.trim()) {
        html += `<div style="padding: 8px 18px; font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase;">🔥 Popular Indian Securities</div>`;
        const popular = data.popular || [];
        for (const s of popular) {
          html += this.renderResultItem(s, 'STOCK');
        }
      } else {
        if (data.stocks && data.stocks.length) {
          html += `<div style="padding: 8px 18px; font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase;">Stocks (${data.stocks.length})</div>`;
          for (const s of data.stocks) html += this.renderResultItem(s, 'STOCK');
        }
        if (data.mutualFunds && data.mutualFunds.length) {
          html += `<div style="padding: 8px 18px; font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase;">Mutual Funds (${data.mutualFunds.length})</div>`;
          for (const m of data.mutualFunds) html += this.renderResultItem(m, 'MUTUAL_FUND');
        }
        if (data.ipos && data.ipos.length) {
          html += `<div style="padding: 8px 18px; font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase;">IPOs (${data.ipos.length})</div>`;
          for (const ipo of data.ipos) html += this.renderResultItem(ipo, 'IPO');
        }
        if (data.indices && data.indices.length) {
          html += `<div style="padding: 8px 18px; font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase;">Indices (${data.indices.length})</div>`;
          for (const idx of data.indices) html += this.renderResultItem(idx, 'INDEX');
        }

        if (!html) {
          html = `<div style="padding: 32px 18px; text-align: center; color: var(--text-secondary);">No securities matching "${query}"</div>`;
        }
      }

      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = `<div style="padding: 16px; color: var(--loss-red);">Search failed.</div>`;
    }
  }

  renderResultItem(item, type) {
    let title = item.symbol || item.company || item.name;
    let subtitle = item.name || item.category || item.issueSize || '';
    let price = item.price ? formatMoney(item.price) : item.nav ? `NAV ₹${item.nav}` : item.value ? formatNumber(item.value) : '';
    let change = item.percentChange !== undefined ? formatPercent(item.percentChange) : '';
    let changeClass = (item.percentChange >= 0 || item.change >= 0) ? 'gain' : 'loss';

    return `
      <div style="padding: 10px 18px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.15s ease;"
           class="search-item-row"
           onmouseover="this.style.background='var(--bg-surface-subtle)'"
           onmouseout="this.style.background='transparent'"
           onclick="SearchModal.selectItem('${item.symbol || item.id}', '${type}')">
        <div>
          <div style="font-weight: 700; font-size: 14.5px; color: var(--text-primary);">
            ${title}
            <span class="badge badge-neutral" style="font-size: 10px; margin-left: 6px;">${type}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-tertiary);">${subtitle}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; font-family: var(--font-mono); font-size: 14px;">${price}</div>
          ${change ? `<div style="font-size: 12px; font-weight: 600;" class="${changeClass}">${change}</div>` : ''}
        </div>
      </div>
    `;
  }

  selectItem(id, type) {
    Modal.close('global-search-modal');
    if (type === 'STOCK') {
      window.location.hash = `#/stock/${id}`;
    } else if (type === 'MUTUAL_FUND') {
      window.location.hash = `#/mutual-funds`;
    } else if (type === 'IPO') {
      window.location.hash = `#/ipos`;
    } else if (type === 'INDEX') {
      window.location.hash = `#/markets`;
    }
  }
}

const SearchModal = new GlobalSearchModal();
