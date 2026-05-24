# chatgpt-checkout-launcher

A hosted installer page + userscript that adds payment gateway buttons to `chatgpt.com`.

> **Live site:** https://popavs199-ops.github.io/chatgpt-checkout-launcher/
>
> **Userscript file:** https://popavs199-ops.github.io/chatgpt-checkout-launcher/chatgpt-checkout.user.js

## What it does

The userscript injects a small floating panel into chatgpt.com with buttons for different regional checkout flows (GoPay / PayPal / EUR / GBP) and a "copy access token" helper. Clicking a payment button calls ChatGPT's internal payments endpoint and redirects you to the resulting Stripe hosted checkout URL.

## Three ways to run it

The hosted page offers three install paths, in descending order of convenience:

| # | Method | Setup | Use |
|---|---|---|---|
| 1 | **Tampermonkey userscript** | Install Tampermonkey extension once, click the install link | Auto-runs forever on chatgpt.com |
| 2 | **F12 console paste** | None | Manual copy-paste each visit |
| 3 | **Bookmarklet** | Drag a button to bookmarks bar | Click bookmark while on chatgpt.com |

## Why can't a website auto-run the script on chatgpt.com?

Browsers enforce the **same-origin policy**: any website you load (including this one) is forbidden from executing JavaScript on a different domain. There is no API, hack, or workaround for this; it's a core security boundary. If sites could do this, every malicious page would steal sessions from your bank/email/etc.

The three methods above are the *only* legitimate ways for arbitrary JavaScript to run on chatgpt.com:

- **Browser extension** (Tampermonkey is one) &mdash; users explicitly grant the extension permission to inject code.
- **DevTools console** &mdash; the user explicitly chooses to paste and run code.
- **Bookmarklet** &mdash; the user explicitly clicks a bookmark whose URL is `javascript:...`.

All three require an explicit user action. No website can bypass this.

## One-time setup

The script body in [`chatgpt-checkout.user.js`](./chatgpt-checkout.user.js) is currently a **placeholder**. To finish setup, paste the real obfuscated payload into that file:

1. Open https://github.com/popavs199-ops/chatgpt-checkout-launcher/edit/main/chatgpt-checkout.user.js
2. Below the `// ==/UserScript==` line, delete the placeholder comment and the placeholder IIFE.
3. Paste the obfuscated script body (everything that came after `// ==/UserScript==` in the original).
4. Click **Commit changes**.

After committing, the live site auto-updates within ~1 minute and all three install methods will deliver the real script.

## GitHub Pages

If the live site shows a 404, GitHub Pages isn't enabled yet. Enable it in one click:

1. Go to https://github.com/popavs199-ops/chatgpt-checkout-launcher/settings/pages
2. Under **Source**, choose **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`. Click **Save**.
4. Wait ~1 minute. The site will be live at the URL above.

## Files

| File | Purpose |
|---|---|
| `index.html` | Hosted installer page |
| `chatgpt-checkout.user.js` | The userscript itself (Tampermonkey-compatible) |
| `main.py` | Optional: original Python/Selenium launcher (desktop) |
| `requirements.txt` | Python deps for `main.py` |
| `.env.example` | Sample env file for the Python script |
