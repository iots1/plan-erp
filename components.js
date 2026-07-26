/**
 * Vanilla Web Components for the ERP docs site.
 * No Shadow DOM — markup is injected via innerHTML so global Tailwind
 * classes and style.css rules keep applying inside the components.
 */

class ErpDocnav extends HTMLElement {
  // Full catalog of docs pages. Kept here (not per-page) so every page's
  // docnav — and the "jump to" search — always lists the same set.
  static LINKS = [
    { href: 'index.html', icon: '🏠', label: 'Home', desc: 'สารบัญเอกสารทั้งหมด' },
    { href: 'erp-architecture.html', icon: '📐', label: 'ERP Architecture', desc: 'Microservices DDD Design · Development Plan' },
    { href: 'core-feature.html', icon: '📋', label: 'SRS · Phase 1–6', desc: 'System Requirement Specification' },
    { href: 'i18n-guide.html', icon: '🌐', label: 'i18n Guide (TH/EN)', desc: 'แนวทางพัฒนาระบบ 2 ภาษา' },
    { href: 'backend-convention.html', icon: '⚙️', label: 'Backend Conventions', desc: 'Naming · JSON:API · Error · Query Params' },
    { href: 'nextjs-permission-guide.html', icon: '🔐', label: 'Next.js Integration Guide', desc: 'Frontend Integration · Permission System' },
    { href: 'observability-logging-guide.html', icon: '📊', label: 'Observability (Tempo/Loki)', desc: 'OpenTelemetry Traces · pino-http Logs' },
  ];

  connectedCallback() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    // core-feature.html is the SRS hub; the per-phase pages (srs-p3.html …)
    // live under it, so treat it as "current" while reading a phase too.
    const isLinkCurrent = (href) =>
      href === current || (href === 'core-feature.html' && /^srs-p\d/.test(current));

    const currentLink =
      ErpDocnav.LINKS.find((l) => isLinkCurrent(l.href)) ?? ErpDocnav.LINKS[0];

    const items = ErpDocnav.LINKS.map(
      (l) => `<a href="${l.href}" class="docnav-dd-item${isLinkCurrent(l.href) ? ' is-current' : ''}" role="menuitem">
        <span class="ic">${l.icon}</span><span class="t">${l.label}</span>
      </a>`,
    ).join('');

    this.innerHTML = `
<div class="docnav">
  <a href="index.html" class="docnav-home" title="หน้าแรก" aria-label="หน้าแรก">🏠</a>
  <span class="docnav-divider"></span>
  <div class="docnav-current">
    <span class="ic">${currentLink.icon}</span>
    <span class="lbl">${currentLink.label}</span>
  </div>
  <div class="docnav-dd">
    <button type="button" class="docnav-dd-btn" id="docnavDdBtn" aria-haspopup="true" aria-expanded="false" aria-controls="docnavDdMenu">
      <span class="lbl">เอกสารทั้งหมด</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </button>
    <div class="docnav-dd-menu" id="docnavDdMenu" hidden role="menu">${items}</div>
  </div>
</div>`;

    this.#setupDropdown();
  }

  // Single button → plain dropdown list of every page in LINKS. Click to
  // toggle, click a link to navigate, click outside or Escape to close.
  #setupDropdown() {
    const btn = this.querySelector('#docnavDdBtn');
    const menu = this.querySelector('#docnavDdMenu');

    const open = () => {
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', () => (menu.hidden ? open() : close()));

    document.addEventListener('click', (e) => {
      if (!menu.hidden && !this.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        close();
        btn.focus();
      }
    });
  }
}

class ErpSidebar extends HTMLElement {
  connectedCallback() {
    // Read attributes (short plain-text config) ...
    const badge = this.getAttribute('badge') || 'E';
    const title = this.getAttribute('title') || '';
    const subtitle = this.getAttribute('subtitle') || '';
    const width = this.getAttribute('width') || '280';

    // ...and light-DOM children (richer per-page content) before we blow
    // away innerHTML. This is the manual "slotting" pattern you need when
    // you skip Shadow DOM: capture first, render second.
    const navHTML = this.querySelector('[slot="nav"]')?.innerHTML ?? '';
    const footnoteHTML = this.querySelector('[slot="footnote"]')?.innerHTML ?? '';

    this.innerHTML = `
<aside class="side hidden lg:flex flex-col shrink-0 sticky top-[44px] h-[calc(100vh-44px)]" style="width:${width}px">
  <div class="px-7 pt-8 pb-6 relative">
    <button type="button" class="sidebar-toggle" title="ย่อเมนู" aria-label="ย่อเมนู" aria-expanded="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <div class="flex items-center gap-3 pr-9">
      <div class="w-9 h-9 rounded-lg blueprint-bg border border-white/10 flex items-center justify-center shrink-0">
        <span class="mono text-white text-sm font-semibold">${badge}</span>
      </div>
      <div class="min-w-0">
        <div class="text-white font-semibold text-[15px] leading-none truncate">${title}</div>
        <div class="mono text-[10px] tracking-wider text-[#5E7391] mt-1 truncate">${subtitle}</div>
      </div>
    </div>
  </div>
  <nav class="px-5 flex-1 overflow-y-auto space-y-1" id="nav">${navHTML}</nav>
  <div class="px-7 py-5 border-t border-white/8">
    <div class="mono text-[10px] leading-relaxed text-[#5E7391]">${footnoteHTML}</div>
  </div>
</aside>
<button type="button" class="sidebar-expand-fab" title="ขยายเมนู" aria-label="ขยายเมนู">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
</button>`;

    this.#markActiveLink();
    this.#setupCollapse();
  }

  // Active-state handling: for any non-hash link in the sidebar (i.e. it
  // points at another page, not an in-page anchor), flag it against the
  // current pathname. In-page "#anchor" links are handled by each page's
  // own scroll-spy IntersectionObserver instead.
  #markActiveLink() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    this.querySelectorAll('#nav a.navlink').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#') && href === current) {
        a.classList.add('active');
      }
    });
  }

  // Expand/collapse: lets the reader hide the sidebar to read a doc at
  // full width. State is remembered per-browser via localStorage so it
  // stays collapsed when navigating between pages.
  #setupCollapse() {
    const STORAGE_KEY = 'erp-sidebar-collapsed';
    const aside = this.querySelector('aside.side');
    const collapseBtn = this.querySelector('.sidebar-toggle');
    const expandFab = this.querySelector('.sidebar-expand-fab');

    const apply = (collapsed) => {
      aside.classList.toggle('is-collapsed', collapsed);
      expandFab.classList.toggle('show', collapsed);
      collapseBtn.setAttribute('aria-expanded', String(!collapsed));
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    };

    apply(localStorage.getItem(STORAGE_KEY) === '1');

    collapseBtn.addEventListener('click', () => apply(!aside.classList.contains('is-collapsed')));
    expandFab.addEventListener('click', () => apply(false));
  }
}

class ErpFooter extends HTMLElement {
  connectedCallback() {
    const line1 = this.getAttribute('line1') || '';
    const line2 = this.getAttribute('line2') || '';

    this.innerHTML = `
<footer class="border-t py-8 mb-4" style="border-color:var(--line)">
  <div class="flex flex-col sm:flex-row justify-between gap-3 text-[13px]" style="color:var(--muted)">
    <div class="mono">${line1}</div>
    <div class="mono">${line2}</div>
  </div>
</footer>`;
  }
}

customElements.define('erp-docnav', ErpDocnav);
customElements.define('erp-sidebar', ErpSidebar);
customElements.define('erp-footer', ErpFooter);
