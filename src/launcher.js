// ==UserScript==
// @name         ChatGPT Checkout Launcher
// @namespace    https://rexopay.eu/
// @version      2.1.0
// @description  Adds a floating panel to chatgpt.com with quick links to regional Stripe checkout URLs and a token copy helper. Made by Thomas (@final_getsuga_tenshou - https://rexopay.eu/).
// @author       Thomas (@final_getsuga_tenshou)
// @homepage     https://rexopay.eu/
// @match        https://chatgpt.com/*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://popavs199-ops.github.io/chatgpt-checkout-launcher/chatgpt-checkout.user.js
// @updateURL    https://popavs199-ops.github.io/chatgpt-checkout-launcher/chatgpt-checkout.user.js
// ==/UserScript==

(function () {
  'use strict';

  if (window.__chatgptCheckoutLauncherLoaded) return;
  window.__chatgptCheckoutLauncherLoaded = true;

  // --------------------------------------------------------------------
  // CONFIG: which checkout flows to expose. Each entry produces one button.
  // The payload shape mirrors what chatgpt.com/backend-api/payments/checkout
  // expects.
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
  // Style block.
  //
  // ChatGPT's site CSS is aggressive (Tailwind + custom resets), so every
  // visual property below uses !important and the font stack is set
  // explicitly on every text node. Without this, button labels render
  // empty / transparent / size-0 inside the panel.
  // --------------------------------------------------------------------
  const FONT_STACK = '14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const css = `
    #gpcl-panel, #gpcl-panel * {
      box-sizing: border-box !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      letter-spacing: normal !important;
      text-transform: none !important;
    }
    #gpcl-panel {
      position: fixed !important;
      right: 20px !important; bottom: 20px !important;
      top: auto !important; left: auto !important;
      z-index: 2147483647 !important;
      width: 260px !important; padding: 14px !important;
      margin: 0 !important;
      background: #161821 !important;
      color: #e8e9ee !important;
      border: 1px solid #2a2d3a !important;
      border-radius: 14px !important;
      font: ${FONT_STACK} !important;
      box-shadow: 0 12px 32px rgba(0,0,0,0.35) !important;
      user-select: none !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    #gpcl-header {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin: 0 0 10px 0 !important;
      cursor: move !important;
    }
    #gpcl-title {
      font: 600 14px/1.2 -apple-system, BlinkMacSystemFont, sans-serif !important;
      color: #e8e9ee !important;
      display: flex !important;
      align-items: baseline !important;
      gap: 6px !important;
    }
    #gpcl-title .gpcl-brand {
      color: #4ade80 !important;
      font-weight: 700 !important;
      letter-spacing: 0.02em !important;
    }
    #gpcl-title .gpcl-brand-sep {
      color: #444b5e !important;
      font-weight: 400 !important;
    }
    #gpcl-mini-toggle {
      background: transparent !important;
      border: none !important;
      color: #8b8f9c !important;
      cursor: pointer !important;
      font: 600 16px/1 sans-serif !important;
      padding: 2px 8px !important;
    }
    #gpcl-mini-toggle:hover { color: #e8e9ee !important; }
    .gpcl-btn {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      width: 100% !important;
      margin: 8px 0 0 0 !important;
      padding: 9px 12px !important;
      background: #1f2230 !important;
      color: #e8e9ee !important;
      border: 1px solid #2a2d3a !important;
      border-radius: 9px !important;
      font: 500 14px/1.3 -apple-system, BlinkMacSystemFont, sans-serif !important;
      cursor: pointer !important;
      text-align: left !important;
      transition: background 0.12s, border-color 0.12s !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    .gpcl-btn:hover {
      background: #262a3a !important;
      border-color: #19c37d !important;
    }
    .gpcl-btn:disabled { opacity: 0.6 !important; cursor: wait !important; }
    .gpcl-btn .gpcl-emoji {
      font: 16px/1 "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif !important;
      flex-shrink: 0 !important;
      color: #fff !important;
    }
    .gpcl-btn .gpcl-label {
      font: 500 14px/1.3 -apple-system, BlinkMacSystemFont, sans-serif !important;
      color: #e8e9ee !important;
      flex: 1 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .gpcl-btn.gpcl-token { background: transparent !important; }
    #gpcl-status {
      margin: 10px 0 0 0 !important;
      padding: 8px 10px !important;
      font: 400 12px/1.4 -apple-system, BlinkMacSystemFont, sans-serif !important;
      color: #8b8f9c !important;
      background: #0e0f13 !important;
      border-radius: 8px !important;
      min-height: 18px !important;
      word-break: break-all !important;
    }
    #gpcl-status.gpcl-ok    { color: #19c37d !important; }
    #gpcl-status.gpcl-err   { color: #ef4444 !important; }
    #gpcl-credit {
      margin: 10px 0 0 0 !important;
      padding: 0 !important;
      font: 400 11px/1.4 -apple-system, BlinkMacSystemFont, sans-serif !important;
      color: #8b8f9c !important;
      text-align: center !important;
    }
    #gpcl-credit a {
      color: #19c37d !important;
      text-decoration: none !important;
    }
    #gpcl-credit a:hover { text-decoration: underline !important; }
    #gpcl-mini {
      position: fixed !important;
      right: 20px !important; bottom: 20px !important;
      top: auto !important; left: auto !important;
      z-index: 2147483647 !important;
      margin: 0 !important;
      padding: 10px 14px !important;
      background: #19c37d !important;
      color: #fff !important;
      border: none !important;
      border-radius: 99px !important;
      cursor: pointer !important;
      font: 600 13px/1 -apple-system, BlinkMacSystemFont, sans-serif !important;
      box-shadow: 0 8px 20px rgba(25,195,125,0.35) !important;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.id = 'gpcl-style';
  styleEl.textContent = css;
  (document.head || document.documentElement).appendChild(styleEl);

  // --------------------------------------------------------------------
  // Status helper
  // --------------------------------------------------------------------
  let statusEl = null;
  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = '';
    if (kind === 'ok')  statusEl.classList.add('gpcl-ok');
    if (kind === 'err') statusEl.classList.add('gpcl-err');
  }

  // --------------------------------------------------------------------
  // ChatGPT API helpers
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
    if (!res.ok) {
      throw new Error('checkout HTTP ' + res.status + ' ' + JSON.stringify(data));
    }
    const url = data.url || data.checkout_url || (data.session && data.session.url);
    if (!url) throw new Error('No checkout URL in response: ' + JSON.stringify(data));
    return url;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
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
  async function onGatewayClick(gateway, btn) {
    const buttons = panel.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);
    setStatus('Generating ' + gateway.label + ' \u2026', '');
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
    setStatus('Fetching token \u2026', '');
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
  // UI
  // --------------------------------------------------------------------
  let panel, miniBtn;

  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'gpcl-panel';

    const header = document.createElement('div');
    header.id = 'gpcl-header';
    const title = document.createElement('span');
    title.id = 'gpcl-title';
    // Branded title: "REXOPAY · Checkout"
    const brand = document.createElement('span');
    brand.className = 'gpcl-brand';
    brand.textContent = 'REXOPAY';
    const sep = document.createElement('span');
    sep.className = 'gpcl-brand-sep';
    sep.textContent = '\u00B7'; // middle dot
    const sub = document.createElement('span');
    sub.textContent = 'Checkout';
    title.appendChild(brand);
    title.appendChild(sep);
    title.appendChild(sub);
    const minimize = document.createElement('button');
    minimize.id = 'gpcl-mini-toggle';
    minimize.title = 'Minimize';
    minimize.textContent = '\u2013';
    minimize.onclick = () => togglePanel(false);
    header.appendChild(title);
    header.appendChild(minimize);
    panel.appendChild(header);

    GATEWAYS.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'gpcl-btn';
      btn.type = 'button';
      const emoji = document.createElement('span');
      emoji.className = 'gpcl-emoji';
      emoji.textContent = g.emoji;
      const lbl = document.createElement('span');
      lbl.className = 'gpcl-label';
      lbl.textContent = g.label;
      btn.appendChild(emoji);
      btn.appendChild(lbl);
      btn.onclick = () => onGatewayClick(g, btn);
      panel.appendChild(btn);
    });

    const tokenBtn = document.createElement('button');
    tokenBtn.className = 'gpcl-btn gpcl-token';
    tokenBtn.type = 'button';
    const k = document.createElement('span');
    k.className = 'gpcl-emoji';
    k.textContent = '🔑';
    const kl = document.createElement('span');
    kl.className = 'gpcl-label';
    kl.textContent = 'Copy access token';
    tokenBtn.appendChild(k);
    tokenBtn.appendChild(kl);
    tokenBtn.onclick = onTokenClick;
    panel.appendChild(tokenBtn);

    statusEl = document.createElement('div');
    statusEl.id = 'gpcl-status';
    statusEl.textContent = 'Ready.';
    panel.appendChild(statusEl);

    // Credit footer. Uses inline styles + explicit DOM nodes (instead of
    // innerHTML and a class) because ChatGPT's stylesheet aggressively resets
    // anchor colors. Inline style with !important on the <a> wins.
    //
    // Two lines:
    //   1. https://rexopay.eu/
    //   2. made by Thomas - @final_getsuga_tenshou (Telegram link)
    const credit = document.createElement('div');
    credit.id = 'gpcl-credit';
    credit.setAttribute(
      'style',
      'margin: 10px 0 0 0 !important;' +
      'padding: 6px 0 0 0 !important;' +
      'border-top: 1px solid #2a2d3a !important;' +
      'text-align: center !important;' +
      'font: 400 11px/1.5 -apple-system, BlinkMacSystemFont, sans-serif !important;' +
      'color: #c9c9d4 !important;' +
      'opacity: 1 !important; visibility: visible !important;'
    );

    const linkStyle =
      'color: #4ade80 !important;' +
      'text-decoration: underline !important;' +
      'font-weight: 600 !important;' +
      'background: transparent !important;' +
      'opacity: 1 !important; visibility: visible !important;';

    // Line 1: rexopay.eu
    const line1 = document.createElement('div');
    line1.setAttribute('style', 'display: block !important; margin: 0 0 2px 0 !important;');
    const siteLink = document.createElement('a');
    siteLink.href = 'https://rexopay.eu/';
    siteLink.target = '_blank';
    siteLink.rel = 'noopener';
    siteLink.textContent = 'https://rexopay.eu/';
    siteLink.setAttribute('style', linkStyle);
    line1.appendChild(siteLink);

    // Line 2: made by Thomas - @final_getsuga_tenshou (Telegram)
    const line2 = document.createElement('div');
    line2.setAttribute('style', 'display: block !important;');
    line2.appendChild(document.createTextNode('made by Thomas '));
    const tgLink = document.createElement('a');
    tgLink.href = 'https://t.me/final_getsuga_tenshou';
    tgLink.target = '_blank';
    tgLink.rel = 'noopener';
    tgLink.textContent = '@final_getsuga_tenshou';
    tgLink.setAttribute('style', linkStyle);
    line2.appendChild(tgLink);

    credit.appendChild(line1);
    credit.appendChild(line2);
    panel.appendChild(credit);

    makeDraggable(panel, header);
    document.body.appendChild(panel);
  }

  function buildMiniBtn() {
    miniBtn = document.createElement('button');
    miniBtn.id = 'gpcl-mini';
    miniBtn.textContent = '💳 Rexopay';
    miniBtn.style.display = 'none';
    miniBtn.onclick = () => togglePanel(true);
    document.body.appendChild(miniBtn);
  }

  function togglePanel(show) {
    if (!panel || !miniBtn) return;
    panel.style.display = show ? '' : 'none';
    miniBtn.style.display = show ? 'none' : '';
    try { localStorage.setItem('gpcl-collapsed', show ? '0' : '1'); } catch (_) {}
  }

  // --------------------------------------------------------------------
  // Drag support
  // --------------------------------------------------------------------
  function makeDraggable(target, handle) {
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      const rect = target.getBoundingClientRect();
      startLeft = rect.left; startTop = rect.top;
      target.style.right = 'auto';
      target.style.bottom = 'auto';
      target.style.left = startLeft + 'px';
      target.style.top  = startTop  + 'px';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      target.style.left = (startLeft + e.clientX - startX) + 'px';
      target.style.top  = (startTop  + e.clientY - startY) + 'px';
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
    buildPanel();
    buildMiniBtn();
    let collapsed = '0';
    try { collapsed = localStorage.getItem('gpcl-collapsed') || '0'; } catch (_) {}
    togglePanel(collapsed !== '1');
    console.log('[ChatGPT Checkout Launcher] v2.1.0 ready - made by Thomas (@final_getsuga_tenshou) - https://rexopay.eu/');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
