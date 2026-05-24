# chatgpt-checkout-launcher

A hosted installer page + userscript that adds payment gateway buttons to `chatgpt.com`.

> **Live site:** https://popavs199-ops.github.io/chatgpt-checkout-launcher/
>
> **Userscript file:** https://popavs199-ops.github.io/chatgpt-checkout-launcher/chatgpt-checkout.user.js

The published userscript is **obfuscated** (hex identifiers + base64 string array + control flow flattening) so end users who install/inspect it see meaningless gibberish. The readable source lives in [`src/launcher.js`](./src/launcher.js).

## Repo layout

| File / folder | What it is |
|---|---|
| `src/launcher.js` | **Readable source.** Edit this. |
| `build.js` | Reads the source, obfuscates the body, writes the public file. |
| `chatgpt-checkout.user.js` | **Public obfuscated userscript** (committed; what visitors install). |
| `index.html` | Hosted installer page with three install methods. |
| `package.json` | Pulls in `javascript-obfuscator` as a dev dep. |
| `main.py` / `requirements.txt` / `.env.example` | Optional: original Python/Selenium desktop launcher. |

## Editing the script

1. Open [`src/launcher.js`](./src/launcher.js) and make your changes there.
2. Run the build:
   ```bash
   npm install
   npm run build
   ```
3. Commit **both** `src/launcher.js` and the rebuilt `chatgpt-checkout.user.js`. Push.
4. The hosted site auto-updates within ~1 minute.

The userscript's `@downloadURL` and `@updateURL` headers point at GitHub Pages, so anyone who installed via Tampermonkey will get updates automatically.

## Three ways visitors can install

The hosted page offers all three:

| # | Method | Setup | Use |
|---|---|---|---|
| 1 | **Tampermonkey userscript** | Install Tampermonkey extension once, click install | Auto-runs forever on chatgpt.com |
| 2 | **F12 console paste** | None | Manual copy-paste each visit |
| 3 | **Bookmarklet** | Drag a button to bookmarks bar | Click bookmark while on chatgpt.com |

## What the script does

Once active on chatgpt.com, it adds a small dark floating panel in the bottom-right with:

- 🇮🇩 GoPay (IDR), 🇩🇪 PayPal-DE (EUR), 🇫🇷 PayPal-FR (EUR), 🇬🇧 PayPal-UK (GBP) — each calls `chatgpt.com/backend-api/payments/checkout` with the matching country/currency, copies the resulting Stripe URL to clipboard, and redirects.
- 🔑 Copy access token — copies the JWT from `/api/auth/session`.

The panel is draggable and minimizable. Status messages show what's happening, and errors are surfaced with their real message.

## Why a website cannot auto-run JS on chatgpt.com

Browsers enforce the **same-origin policy**: any website you load (including this one) cannot execute JavaScript on a different domain. There's no API or hack around this. The three install methods above are the only legitimate ways for arbitrary JavaScript to run on chatgpt.com, and all three require an explicit user action (installing an extension, pasting in DevTools, or clicking a bookmarklet).

## Honest note on "hiding" the script

Obfuscation makes the code very hard to read but it cannot truly hide client-side JavaScript. Anyone determined enough — F12 + a deobfuscator — can recover roughly what it does. For 99% of users (and most casual inspection), the obfuscated output is opaque enough.

## GitHub Pages setup (one-time)

If https://popavs199-ops.github.io/chatgpt-checkout-launcher/ shows 404:

1. https://github.com/popavs199-ops/chatgpt-checkout-launcher/settings/pages
2. **Source**: `Deploy from a branch` → branch `main`, folder `/ (root)` → **Save**
3. Wait ~1 minute.
