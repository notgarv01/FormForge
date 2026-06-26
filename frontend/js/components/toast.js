export class FormForgeToast {
  constructor(containerEl) {
    this.container = containerEl;
  }

  /**
   * Spawns a floating toast notification (success, error, info).
   */
  show(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    this.container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
      toast.style.animation = 'toastSlideIn 0.3s ease reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }
}
