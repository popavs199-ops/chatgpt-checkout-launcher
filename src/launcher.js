// ==UserScript==
// @name         ChatGPT Checkout Launcher
// @namespace    https://chatgpt.com/
// @version      2.0.0
// @description  Adds a floating panel to chatgpt.com with quick links to regional Stripe checkout URLs and a token copy helper.
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
  // Style block
  // --------------------------------------------------------------------
  const css = `
    #gpcl-panel {
      position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
      width: 260px; padding: 14px;
      background: #161821; color: #e8e9ee;
      border: 1px solid #2a2d3a; border-radius: 14px;
      font: 14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      box-shadow: 0 12px 32px rgba(0,0,0,0.35);
      user-select: none;
    }
    #gpcl-panel * { box-sizing: border-box; }
    #gpcl-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 10px; cursor: move;
    }
    #gpcl-title { font-weight: 600; font-size: 13px; }
    #gpcl-close, #gpcl-mini-toggle {
      background: transparent; border: none; color: #8b8f9c;
      cursor: pointer; font-size: 14px; padding: 2px 6px;
    }
    #gpcl-close:hover, #gpcl-mini-toggle:hover { color: #e8e9ee; }
    .gpcl-btn {
      display: flex; align-items: center; gap: 8px;
      width: 100%; margin-top: 8px; padding: 9px 12px;
      background: #1f2230; color: #e8e9ee;
      border: 1px solid #2a2d3a; border-radius: 9px;
      font: inherit; cursor: pointer; text-align: left;
      transition: background 0.12s, border-color 0.12s;
    }
    .gpcl-btn:hover { background: #262a3a; border-color: #19c37d; }
    .gpcl-btn:disabled { opacity: 0.6; cursor: wait; }
    .gpcl-btn .gpcl-emoji { font-size: 16px; flex-shrink: 0; }
    .gpcl-btn.gpcl-token { background: transparent; }
    #gpcl-status {
      margin-top: 10px; padding: 8px 10px;
      font-size: 12px; color: #8b8f9c;
      background: #0e0f13; border-radius: 8px;
      min-height: 18px; word-break: break-all;
    }
    #gpcl-status.gpcl-ok    { color: #19c37d; }
    #gpcl-status.gpcl-err   { color: #ef4444; }
    #gpcl-mini {
      position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
      padding: 10px 14px; background: #19c37d; color: #fff;
      border: none; border-radius: 99px; cursor: pointer;
      font: 600 13px/1 -apple-system,BlinkMacSystemFont,sans-serif;
      box-shadow: 0 8px 20px rgba(25,195,125,0.35);
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
    title.textContent = 'Checkout Launcher';
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
      const emoji = document.createElement('span');
      emoji.className = 'gpcl-emoji';
      emoji.textContent = g.emoji;
      const lbl = document.createElement('span');
      lbl.textContent = g.label;
      btn.appendChild(emoji);
      btn.appendChild(lbl);
      btn.onclick = () => onGatewayClick(g, btn);
      panel.appendChild(btn);
    });

    const tokenBtn = document.createElement('button');
    tokenBtn.className = 'gpcl-btn gpcl-token';
    const k = document.createElement('span');
    k.className = 'gpcl-emoji';
    k.textContent = '🔑';
    const kl = document.createElement('span');
    kl.textContent = 'Copy access token';
    tokenBtn.appendChild(k);
    tokenBtn.appendChild(kl);
    tokenBtn.onclick = onTokenClick;
    panel.appendChild(tokenBtn);

    statusEl = document.createElement('div');
    statusEl.id = 'gpcl-status';
    statusEl.textContent = 'Ready.';
    panel.appendChild(statusEl);

    makeDraggable(panel, header);
    document.body.appendChild(panel);
  }

  function buildMiniBtn() {
    miniBtn = document.createElement('button');
    miniBtn.id = 'gpcl-mini';
    miniBtn.textContent = '💳 Checkout';
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
    console.log('[ChatGPT Checkout Launcher] v2.0.0 ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
