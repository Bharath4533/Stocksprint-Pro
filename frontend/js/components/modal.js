// Modal & Drawer Controller for NexTrade Pro

class ModalController {
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Focus first input if present
      const input = modal.querySelector('input, select, textarea, button.btn-primary');
      if (input) setTimeout(() => input.focus(), 50);
    }
  }

  close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  confirm({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', confirmClass = 'btn-primary', onConfirm }) {
    let backdrop = document.getElementById('confirm-dialog-modal');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'confirm-dialog-modal';
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal-content" style="max-width: 420px;">
          <div class="modal-header">
            <h3 class="card-title" id="confirm-title">${title}</h3>
            <button class="icon-btn" onclick="Modal.close('confirm-dialog-modal')">✕</button>
          </div>
          <div class="modal-body" id="confirm-body" style="font-size: 14.5px; color: var(--text-secondary); line-height: 1.5;">
            ${message}
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="Modal.close('confirm-dialog-modal')">Cancel</button>
            <button class="btn ${confirmClass}" id="confirm-action-btn">${confirmText}</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);
    } else {
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-body').innerHTML = message;
      const btn = document.getElementById('confirm-action-btn');
      btn.textContent = confirmText;
      btn.className = `btn ${confirmClass}`;
    }

    const actionBtn = document.getElementById('confirm-action-btn');
    actionBtn.onclick = () => {
      Modal.close('confirm-dialog-modal');
      if (typeof onConfirm === 'function') onConfirm();
    };

    this.open('confirm-dialog-modal');
  }
}

const Modal = new ModalController();

// Global escape key listener to close modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open, .drawer.open').forEach(el => {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
});
