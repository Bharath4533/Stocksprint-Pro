// Notification Center Drawer Component for NexTrade Pro

const NotificationsDrawer = {
  notifications: [],

  init() {
    if (document.getElementById('notifications-drawer')) return;

    const drawer = document.createElement('div');
    drawer.id = 'notifications-drawer';
    drawer.className = 'drawer';
    drawer.innerHTML = `
      <div style="padding: 18px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-subtle);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="font-size: 16px;">🔔 Notifications</strong>
          <span id="notif-unread-count" class="badge badge-gain">0 new</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-ghost btn-sm" onclick="NotificationsDrawer.markAllRead()">Mark All Read</button>
          <button class="icon-btn" onclick="NotificationsDrawer.close()">✕</button>
        </div>
      </div>

      <div id="notifications-drawer-body" style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
        <!-- Injected dynamically -->
      </div>
    `;
    document.body.appendChild(drawer);
  },

  async open() {
    this.init();
    const drawer = document.getElementById('notifications-drawer');
    if (drawer) drawer.classList.add('open');
    this.loadNotifications();
  },

  close() {
    const drawer = document.getElementById('notifications-drawer');
    if (drawer) drawer.classList.remove('open');
  },

  async loadNotifications() {
    try {
      const data = await api.get('/notifications');
      this.notifications = data.notifications || [];
      Store.unreadNotifs = data.unreadCount || 0;

      const badge = document.getElementById('header-notif-badge');
      if (badge) {
        badge.textContent = Store.unreadNotifs;
        badge.style.display = Store.unreadNotifs > 0 ? 'inline-flex' : 'none';
      }

      const drawerBadge = document.getElementById('notif-unread-count');
      if (drawerBadge) drawerBadge.textContent = `${Store.unreadNotifs} new`;

      this.render();
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  },

  render() {
    const body = document.getElementById('notifications-drawer-body');
    if (!body) return;

    if (this.notifications.length === 0) {
      body.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔕</div>
          <div class="empty-state-title">No notifications</div>
          <p class="empty-state-desc">Order updates, execution confirmations, and system alerts appear here.</p>
        </div>
      `;
      return;
    }

    body.innerHTML = this.notifications.map(n => `
      <div style="padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: ${n.isRead ? 'var(--bg-surface)' : 'var(--bg-surface-subtle)'};"
           onclick="NotificationsDrawer.markRead('${n.id}')">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 13.5px; color: var(--text-primary);">${n.title}</strong>
          <span style="font-size: 11px; color: var(--text-tertiary);">${formatTime(n.createdAt)}</span>
        </div>
        <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4;">${n.message || n.text}</p>
      </div>
    `).join('');
  },

  async markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      this.loadNotifications();
    } catch (e) {}
  },

  async markAllRead() {
    try {
      await api.post('/notifications/read-all');
      Toast.info('All notifications marked as read.');
      this.loadNotifications();
    } catch (e) {}
  }
};
