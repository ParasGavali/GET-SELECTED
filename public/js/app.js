(function () {
  'use strict';

  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcons(theme);
  }

  function updateThemeIcons(theme) {
    const sunIcons = document.querySelectorAll('.theme-icon-sun');
    const moonIcons = document.querySelectorAll('.theme-icon-moon');
    sunIcons.forEach(icon => {
      icon.style.display = theme === 'dark' ? 'inline-block' : 'none';
    });
    moonIcons.forEach(icon => {
      icon.style.display = theme === 'dark' ? 'none' : 'inline-block';
    });
  }

  function initThemeToggle() {
    const toggles = document.querySelectorAll('#theme-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcons(newTheme);
      });
    });
  }

  function initIcons() {
    if (window.lucide) {
      lucide.createIcons({ attrs: { 'stroke-width': 2 } });
    }
  }

  function initNav() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const links = document.querySelector('[data-nav-links]');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
    }
  }

  function toast(message, type) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  function initBookmarks() {
    document.querySelectorAll('[data-bookmark]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const { itemType, itemId } = btn.dataset;
        btn.disabled = true;
        try {
          const res = await fetch('/api/bookmark/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemType, itemId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed');
          const icon = btn.querySelector('svg');
          if (data.bookmarked) {
            btn.classList.add('bookmarked');
            btn.classList.add('text-warning');
            if (icon) icon.setAttribute('fill', 'currentColor');
            toast('Saved', 'success');
          } else {
            btn.classList.remove('bookmarked', 'text-warning');
            if (icon) icon.removeAttribute('fill');
            toast('Removed from saved');
          }
        } catch (e) {
          toast('Could not update bookmark', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  function initConfirms() {
    document.querySelectorAll('[data-confirm]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        if (!window.confirm(form.dataset.confirm || 'Are you sure?')) e.preventDefault();
      });
    });
  }

  function initFlash() {
    document.querySelectorAll('[data-dismiss]').forEach((el) => {
      el.addEventListener('click', () => el.closest('.alert') && el.closest('.alert').remove());
    });
    setTimeout(() => {
      document.querySelectorAll('.alert').forEach((el) => {
        el.style.transition = 'opacity 0.4s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 400);
      });
    }, 6000);
  }

  function initTabs() {
    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        document.querySelectorAll('[data-tab-panel]').forEach((p) => p.style.display = p.dataset.tabPanel === target ? '' : 'none');
        document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initThemeToggle();
    initIcons();
    initNav();
    initBookmarks();
    initConfirms();
    initFlash();
    initTabs();
  });

  window.GS = { toast, initIcons };
})();
