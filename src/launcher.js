// ==UserScript==
// @name         ChatGPT Checkout Launcher
// @namespace    https://rexopay.eu/
// @version      2.2.0
// @description  Adds a floating panel to chatgpt.com with quick links to regional Stripe checkout URLs and a token copy helper. Made by Thomas (@final_getsuga_tenshou - https://rexopay.eu/).
// @author       Thomas (@final_getsuga_tenshou)
// @homepage     https://rexopay.eu/
// @match        https://chatgpt.com/*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://popavs199-ops.github.io/chatgpt-checkout-launcher/chatgpt-checkout.user.js
// @updateURL    https://popavs199-ops.github.io/chatgpt-checkout-launcher/chatgpt-checkout.user.js
// ==/UserScript==

/*
 * Architecture note:
 * The entire UI lives inside a Shadow DOM attached to a host <div> on
 * document.body. This isolates our CSS from chatgpt.com's stylesheets
 * completely - no more invisible buttons or eaten anchor colors.
 */

(function () {
  'use strict';

  if (window.__chatgptCheckoutLauncherLoaded) return;
  window.__chatgptCheckoutLauncherLoaded = true;

  // --------------------------------------------------------------------
  // CONFIG
  // --------------------------------------------------------------------
  const CANCEL_URL = 'https://chatgpt.com/?openSettings=manage_subscription';

  const GATEWAYS = [
    {
      id: 'gopay',
      label: 'GoPay  (IDR)',
      emoji: '🇮🇩',
      payload: {
        plan_name: 'chatgptplusplan',
        billing_details: { country: 'ID', currency: 'IDR' },
        cancel_url: CANCEL_URL,
        checkout_ui_mode: 'hosted',
      },
    },
    {
      id: 'paypal-de',
      label: 'PayPal  (EUR \u2014 DE)',
      emoji: '🇩🇪',
      payload: {
        plan_name: 'chatgptplusplan',
        billing_details: { country: 'DE', currency: 'EUR' },
        cancel_url: CANCEL_URL,
        checkout_ui_mode: 'hosted',
      },
    },
    {
      id: 'paypal-fr',
      label: 'PayPal  (EUR \u2014 FR)',
      emoji: '🇫🇷',
      payload: {
        plan_name: 'chatgptplusplan',
        billing_details: { country: 'FR', currency: 'EUR' },
        cancel_url: CANCEL_URL,
        checkout_ui_mode: 'hosted',
      },
    },
    {
      id: 'paypal-uk',
      label: 'PayPal  (GBP \u2014 UK)',
      emoji: '🇬🇧',
      payload: {
        plan_name: 'chatgptplusplan',
        billing_details: { country: 'GB', currency: 'GBP' },
        cancel_url: CANCEL_URL,
        checkout_ui_mode: 'hosted',
      },
    },
  ];

  // --------------------------------------------------------------------
  // CSS (scoped inside the shadow root, so no !important needed)
  // --------------------------------------------------------------------
  const css = `
    :host {
      all: initial;
      contain: layout style;
    }
    *, *::before, *::after { box-sizing: border-box; }

    .panel {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483647;
      width: 270px;
      padding: 14px;
      background: #161821;
      color: #e8e9ee;
      border: 1px solid #2a2d3a;
      border-radius: 14px;
      font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 12px 32px rgba(0,0,0,0.35);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      cursor: move;
    }

    .title {
      font-size: 14px;
      font-weight: 600;
      color: #e8e9ee;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .brand {
      color: #4ade80;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .brand-sep {
      color: #444b5e;
      font-weight: 400;
    }

    .min-toggle {
      background: transparent;
      border: none;
      color: #8b8f9c;
      cursor: pointer;
      font: 600 16px/1 -apple-system, sans-serif;
      padding: 2px 8px;
    }
    .min-toggle:hover { color: #e8e9ee; }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      margin-top: 8px;
      padding: 9px 12px;
      background: #1f2230;
      color: #e8e9ee;
      border: 1px solid #2a2d3a;
      border-radius: 9px;
      font: 500 14px/1.3 -apple-system, BlinkMacSystemFont, sans-serif;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s, border-color 0.12s;
    }
    .btn:hover {
      background: #262a3a;
      border-color: #19c37d;
    }
    .btn:disabled { opacity: 0.6; cursor: wait; }

    .btn .emoji {
      font: 16px/1 "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
      flex-shrink: 0;
    }
    .btn .label {
      font: 500 14px/1.3 -apple-system, BlinkMacSystemFont, sans-serif;
      color: #e8e9ee;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn.token { background: transparent; }

    .status {
      margin-top: 10px;
      padding: 8px 10px;
      font: 400 12px/1.4 -apple-system, BlinkMacSystemFont, sans-serif;
      color: #8b8f9c;
      background: #0e0f13;
      border-radius: 8px;
      min-height: 18px;
      word-break: break-all;
    }
    .status.ok    { color: #19c37d; }
    .status.err   { color: #ef4444; }

    .credit {
      margin-top: 10px;
      padding: 8px 8px 4px 8px;
      border-top: 1px solid #2a2d3a;
      text-align: center;
      font: 400 11px/1.6 -apple-system, BlinkMacSystemFont, sans-serif;
      color: #c9c9d4;
    }
    .credit a {
      color: #4ade80;
      text-decoration: underline;
      font-weight: 600;
    }
    .credit a:hover { color: #6ee7a0; }
    .credit .row { display: block; }

    .mini {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483647;
      padding: 10px 14px;
      background: #19c37d;
      color: #fff;
      border: none;
      border-radius: 99px;
      cursor: pointer;
      font: 600 13px/1 -apple-system, BlinkMacSystemFont, sans-serif;
      box-shadow: 0 8px 20px rgba(25,195,125,0.35);
    }
    .mini:hover { background: #15a368; }
  `;

  // --------------------------------------------------------------------
  // Shadow DOM host
  // --------------------------------------------------------------------
  let panel, miniBtn, statusEl, shadow;

  function buildShadow() {
    const host = document.createElement('div');
    host.id = 'gpcl-host';
    host.setAttribute(
      'style',
      'all: initial !important;' +
      'position: fixed !important;' +
      'top: 0 !important; left: 0 !important;' +
      'width: 0 !important; height: 0 !important;' +
      'z-index: 2147483647 !important;' +
      'pointer-events: none !important;'
    );
    document.body.appendChild(host);

    shadow = host.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    shadow.appendChild(styleEl);

    return shadow;
  }

  // --------------------------------------------------------------------
  // Status
  // --------------------------------------------------------------------
  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  // --------------------------------------------------------------------
  // ChatGPT API
  // --------------------------------------------------------------------
  async function getAccessToken() {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    if (!res.ok) throw new Error('auth/session HTTP ' + res.status);
    const data = await res.json();
    if (!data || !data.accessToken) throw new Error('No accessToken in session');
    return data.accessToken;
  }

  async function createCheckout(payload) {
    const token = await getAccessToken();
    const res = await fetch('https://chatgpt.com/backend-api/payments/checkout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('checkout HTTP ' + res.status + ' ' + JSON.stringify(data));
    const url = data.url || data.checkout_url || (data.session && data.session.url);
    if (!url) throw new Error('No checkout URL in response: ' + JSON.stringify(data));
    return url;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) { /* ignore */ }
      ta.remove();
      return true;
    }
  }

  // --------------------------------------------------------------------
  // Click handlers
  // --------------------------------------------------------------------
  async function onGatewayClick(gateway) {
    const buttons = panel.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);
    setStatus('Generating ' + gateway.label + ' \u2026');
    try {
      const url = await createCheckout(gateway.payload);
      await copyText(url);
      setStatus('Link copied. Redirecting \u2026', 'ok');
      setTimeout(() => { window.location.href = url; }, 600);
    } catch (e) {
      console.error('[CCL]', e);
      setStatus(e.message || String(e), 'err');
      buttons.forEach(b => b.disabled = false);
    }
  }

  async function onTokenClick() {
    setStatus('Fetching token \u2026');
    try {
      const token = await getAccessToken();
      await copyText(token);
      setStatus('Access token copied to clipboard.', 'ok');
    } catch (e) {
      console.error('[CCL]', e);
      setStatus(e.message || String(e), 'err');
    }
  }

  // --------------------------------------------------------------------
  // UI builders
  // --------------------------------------------------------------------
  function buildPanel() {
    panel = document.createElement('div');
    panel.className = 'panel';

    // Header
    const header = document.createElement('div');
    header.className = 'header';

    const title = document.createElement('span');
    title.className = 'title';
    const brand = document.createElement('span');
    brand.className = 'brand';
    brand.textContent = 'REXOPAY';
    const sep = document.createElement('span');
    sep.className = 'brand-sep';
    sep.textContent = '\u00B7';
    const sub = document.createElement('span');
    sub.textContent = 'Checkout';
    title.appendChild(brand);
    title.appendChild(sep);
    title.appendChild(sub);

    const minimize = document.createElement('button');
    minimize.className = 'min-toggle';
    minimize.title = 'Minimize';
    minimize.textContent = '\u2013';
    minimize.type = 'button';
    minimize.addEventListener('click', () => togglePanel(false));

    header.appendChild(title);
    header.appendChild(minimize);
    panel.appendChild(header);

    // Gateway buttons
    GATEWAYS.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.type = 'button';
      const emoji = document.createElement('span');
      emoji.className = 'emoji';
      emoji.textContent = g.emoji;
      const lbl = document.createElement('span');
      lbl.className = 'label';
      lbl.textContent = g.label;
      btn.appendChild(emoji);
      btn.appendChild(lbl);
      btn.addEventListener('click', () => onGatewayClick(g));
      panel.appendChild(btn);
    });

    // Token button
    const tokenBtn = document.createElement('button');
    tokenBtn.className = 'btn token';
    tokenBtn.type = 'button';
    const k = document.createElement('span');
    k.className = 'emoji';
    k.textContent = '🔑';
    const kl = document.createElement('span');
    kl.className = 'label';
    kl.textContent = 'Copy access token';
    tokenBtn.appendChild(k);
    tokenBtn.appendChild(kl);
    tokenBtn.addEventListener('click', onTokenClick);
    panel.appendChild(tokenBtn);

    // Status
    statusEl = document.createElement('div');
    statusEl.className = 'status';
    statusEl.textContent = 'Ready.';
    panel.appendChild(statusEl);

    // Credit footer:
    //   Line 1: https://rexopay.eu/
    //   Line 2: made by Thomas @final_getsuga_tenshou
    const credit = document.createElement('div');
    credit.className = 'credit';

    const row1 = document.createElement('span');
    row1.className = 'row';
    const siteLink = document.createElement('a');
    siteLink.href = 'https://rexopay.eu/';
    siteLink.target = '_blank';
    siteLink.rel = 'noopener';
    siteLink.textContent = 'https://rexopay.eu/';
    row1.appendChild(siteLink);
    credit.appendChild(row1);

    const row2 = document.createElement('span');
    row2.className = 'row';
    row2.appendChild(document.createTextNode('made by Thomas '));
    const tgLink = document.createElement('a');
    tgLink.href = 'https://t.me/final_getsuga_tenshou';
    tgLink.target = '_blank';
    tgLink.rel = 'noopener';
    tgLink.textContent = '@final_getsuga_tenshou';
    row2.appendChild(tgLink);
    credit.appendChild(row2);

    panel.appendChild(credit);

    makeDraggable(panel, header);
    shadow.appendChild(panel);
  }

  function buildMiniBtn() {
    miniBtn = document.createElement('button');
    miniBtn.className = 'mini';
    miniBtn.type = 'button';
    miniBtn.textContent = '💳 Rexopay';
    miniBtn.style.display = 'none';
    miniBtn.addEventListener('click', () => togglePanel(true));
    shadow.appendChild(miniBtn);
  }

  function togglePanel(show) {
    if (!panel || !miniBtn) return;
    panel.style.display = show ? '' : 'none';
    miniBtn.style.display = show ? 'none' : '';
    try { localStorage.setItem('gpcl-collapsed', show ? '0' : '1'); } catch (_) {}
  }

  // --------------------------------------------------------------------
  // Drag
  // --------------------------------------------------------------------
  function makeDraggable(target, handle) {
    let dragging = false, sx = 0, sy = 0, sl = 0, st = 0;

    handle.addEventListener('mousedown', (e) => {
      // Don't drag when clicking the minimize button
      if (e.target instanceof Element && e.target.closest('button')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      const rect = target.getBoundingClientRect();
      sl = rect.left; st = rect.top;
      target.style.right = 'auto';
      target.style.bottom = 'auto';
      target.style.left = sl + 'px';
      target.style.top  = st + 'px';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      target.style.left = (sl + e.clientX - sx) + 'px';
      target.style.top  = (st + e.clientY - sy) + 'px';
    });

    document.addEventListener('mouseup', () => { dragging = false; });
  }

  // --------------------------------------------------------------------
  // Boot
  // --------------------------------------------------------------------
  function boot() {
    if (!document.body) {
      setTimeout(boot, 100);
      return;
    }
    buildShadow();
    buildPanel();
    buildMiniBtn();
    let collapsed = '0';
    try { collapsed = localStorage.getItem('gpcl-collapsed') || '0'; } catch (_) {}
    togglePanel(collapsed !== '1');
    console.log(
      '[ChatGPT Checkout Launcher] v2.2.0 ready (Shadow DOM) - made by Thomas ' +
      '(@final_getsuga_tenshou) - https://rexopay.eu/'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
