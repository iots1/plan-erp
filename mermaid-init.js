/**
 * Single initialisation point for every Mermaid diagram on this site.
 *
 * WHY THIS FILE EXISTS — two failures that took the whole doc site's diagrams
 * down at once, with nobody touching the repo:
 *
 * 1. `themeVariables` used to be handed raw CSS custom properties
 *    (`primaryColor: 'var(--line-soft)'`). Mermaid parses colour values with
 *    khroma so it can derive the shades it needs, and khroma cannot read a
 *    `var()` reference. From Mermaid 12 this is a hard
 *    `Uncaught Error: Unsupported color format: "var(--line-soft)"` thrown out
 *    of `initialize()` — so the call never completes, `mermaid.run()` never
 *    happens, and every `<pre class="mermaid">` on the page just shows its
 *    source text. Tokens are resolved to literal colours here instead, via
 *    `getComputedStyle`, which keeps the palette in `style.css` as the single
 *    source of truth AND keeps the dark/light values working.
 *
 * 2. The CDN tag was unpinned (`npm/mermaid/dist/mermaid.min.js`), so the day
 *    Mermaid published 12.0.0 the site started loading a major version it had
 *    never been tested against. Every page now pins an exact version; upgrade
 *    deliberately, re-render the pages, and commit the new pin.
 *
 * Also switches off `startOnLoad` and calls `mermaid.run()` explicitly: with
 * `startOnLoad: true` both Mermaid's own DOMContentLoaded hook and this file's
 * compete to render, and which one wins depends on script order.
 */
(function () {
  var FALLBACKS = {
    '--line-soft': '#EDF1F6',
    '--accent': '#0E7C86',
    '--ink': '#0E1726',
    '--blueprint': '#0B3D91',
    '--line': '#E3E8F0',
  };

  /**
   * A token's computed value, or its light-theme literal when the stylesheet
   * has not applied (file:// with a missing style.css, a blocked request).
   * Never returns a `var()` reference — that is the whole point of this file.
   */
  function token(name) {
    var computed = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return computed !== '' ? computed : FALLBACKS[name];
  }

  function initMermaid() {
    // The CDN can be blocked (ad-blockers list jsdelivr, some corporate
    // proxies drop it). Leaving the diagram source visible is a better
    // outcome than a console error nobody sees.
    if (typeof mermaid === 'undefined') return;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      er: { useMaxWidth: true },
      themeVariables: {
        background: '#FFFFFF',
        primaryColor: token('--line-soft'),
        primaryBorderColor: token('--accent'),
        primaryTextColor: token('--ink'),
        lineColor: token('--blueprint'),
        tertiaryColor: token('--line'),
        fontFamily: 'IBM Plex Sans Thai, sans-serif',
      },
    });

    mermaid.run();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMermaid);
  } else {
    initMermaid();
  }
})();
