/**
 * Light/dark theme toggle — shared by every page (with or without
 * components.js). Persists to localStorage; the actual "no flash of the
 * wrong theme" work happens in the tiny inline <script> each page's <head>
 * runs *before* style.css paints (see any page's <head> for the snippet) —
 * this file only wires up the button(s) and keeps their state in sync.
 */
(function () {
  var STORAGE_KEY = 'erp-theme';

  function current() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function apply(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
    });
  }

  function toggle() {
    var next = current() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage disabled/unavailable — theme still applies for this load
    }
    apply(next);
  }

  function wire() {
    apply(current()); // sync aria-pressed with whatever the inline head script already set
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', toggle);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    // components.js (defer) may upgrade <erp-docnav> and inject the button
    // synchronously before DOMContentLoaded fires — either order is fine.
    wire();
  }
})();
