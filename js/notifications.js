// Custom Notification System - Modern & Elegant

// Toast Notification (for alerts/info)
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-message">${message}</div>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Confirm Dialog (for confirmations)
export function showConfirm(message, title = '¿Estás seguro?') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="custom-modal-overlay"></div>
            <div class="custom-modal-content animate-fade-in-up">
                <div class="custom-modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="custom-modal-body">
                    <p>${message}</p>
                </div>
                <div class="custom-modal-footer">
                    <button class="btn-cancel" data-action="cancel">Cancelar</button>
                    <button class="btn-confirm" data-action="confirm">Confirmar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        const handleAction = (confirmed) => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            resolve(confirmed);
        };

        modal.querySelector('[data-action="cancel"]').onclick = () => handleAction(false);
        modal.querySelector('[data-action="confirm"]').onclick = () => handleAction(true);
        modal.querySelector('.custom-modal-overlay').onclick = () => handleAction(false);
    });
}

// Prompt Dialog (for input)
export function showPrompt(message, title = 'Ingresa un valor', defaultValue = '') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="custom-modal-overlay"></div>
            <div class="custom-modal-content animate-fade-in-up">
                <div class="custom-modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="custom-modal-body">
                    <p>${message}</p>
                    <input type="text" class="modal-input" value="${defaultValue}" placeholder="Escribe aquí...">
                </div>
                <div class="custom-modal-footer">
                    <button class="btn-cancel" data-action="cancel">Cancelar</button>
                    <button class="btn-confirm" data-action="submit">Aceptar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        const input = modal.querySelector('.modal-input');
        input.focus();
        input.select();

        const handleAction = (submit) => {
            const value = submit ? input.value : null;
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            resolve(value);
        };

        modal.querySelector('[data-action="cancel"]').onclick = () => handleAction(false);
        modal.querySelector('[data-action="submit"]').onclick = () => handleAction(true);
        modal.querySelector('.custom-modal-overlay').onclick = () => handleAction(false);

        // Enter to submit
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAction(true);
        });
    });
}

// Number Prompt (for numeric input)
export function showNumberPrompt(message, title = 'Ingresa un número', defaultValue = '') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="custom-modal-overlay"></div>
            <div class="custom-modal-content animate-fade-in-up">
                <div class="custom-modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="custom-modal-body">
                    <p>${message}</p>
                    <input type="number" step="0.01" class="modal-input" value="${defaultValue}" placeholder="0.00">
                </div>
                <div class="custom-modal-footer">
                    <button class="btn-cancel" data-action="cancel">Cancelar</button>
                    <button class="btn-confirm" data-action="submit">Aceptar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        const input = modal.querySelector('.modal-input');
        input.focus();
        input.select();

        const handleAction = (submit) => {
            const value = submit ? parseFloat(input.value) : null;
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            resolve(value);
        };

        modal.querySelector('[data-action="cancel"]').onclick = () => handleAction(false);
        modal.querySelector('[data-action="submit"]').onclick = () => handleAction(true);
        modal.querySelector('.custom-modal-overlay').onclick = () => handleAction(false);

        // Enter to submit
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAction(true);
        });
    });
}
