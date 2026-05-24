# chatgpt-checkout-launcher

Two ways to use this project:

1. **Hosted website (recommended, zero install)** — share a link, click a button, done.
2. **Local Python script** — for users who want to launch their own Chrome session via Selenium.

---

## Option 1 — Hosted website (no install)

Once GitHub Pages is enabled (one-time, see below), the site is live at:

> **https://popavs199-ops.github.io/chatgpt-checkout-launcher/**

Visitors land on a page with four buttons. Clicking a button:

1. Opens `chatgpt.com` in a new tab.
2. Redirects the current tab to the matching Stripe checkout URL.

No install, no Python, no Selenium. Works on any device with a browser.

### Enabling GitHub Pages (one-time, ~30 seconds)

1. Go to https://github.com/popavs199-ops/chatgpt-checkout-launcher/settings/pages
2. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
3. Set **Branch** to `main` and folder to `/ (root)`. Click **Save**.
4. Wait ~1 minute, then open https://popavs199-ops.github.io/chatgpt-checkout-launcher/

### Customizing the URLs

Edit the `GATEWAYS` object at the top of the `<script>` block in `index.html`:

```js
const GATEWAYS = {
  "1": { name: "GoPay Premium",   url: "https://buy.stripe.com/..." },
  "2": { name: "PayPal Standard", url: "https://buy.stripe.com/..." },
  "3": { name: "Euro Bundle",     url: "https://buy.stripe.com/..." },
  "4": { name: "UK Pro",          url: "https://buy.stripe.com/..." }
};
```

Push the change to `main` and the site auto-updates within a minute.

The defaults are harmless `example.com` placeholders so the page works immediately, even before you set up real Stripe URLs.

---

## Option 2 — Local Python script (Selenium-based)

A small Python utility that:

1. Opens Chrome (reusing your existing profile, so your ChatGPT login is preserved).
2. Loads `https://chatgpt.com/` to warm up the session.
3. Redirects to one of four Stripe checkout URLs based on a menu choice.

### Requirements

- Python 3.9+
- Google Chrome installed
- Selenium 4.6+ uses **Selenium Manager** to auto-download the matching `chromedriver`, so no manual driver setup is required.

### Quick start (no setup, no payment account needed)

```bash
git clone https://github.com/popavs199-ops/chatgpt-checkout-launcher.git
cd chatgpt-checkout-launcher
pip install -r requirements.txt
python main.py
```

The script ships with the same demo URLs, so it runs out of the box.

### Configure real Stripe URLs

Either set environment variables, or copy `.env.example` to `.env` and edit it:

```env
STRIPE_GOPAY_URL=https://buy.stripe.com/...
STRIPE_PAYPAL_URL=https://buy.stripe.com/...
STRIPE_EURO_URL=https://buy.stripe.com/...
STRIPE_UK_URL=https://buy.stripe.com/...
```

`.env` is gitignored — your URLs are not committed.

### Notes

- **Close other Chrome windows before running.** Chrome only lets one process use a given user-data directory at a time.
- The script auto-detects Chrome profile paths on Windows, macOS, and Linux. Falls back to a clean session if none is found.

### Troubleshooting

| Problem | Fix |
|---|---|
| `[Browser Error] ... user data directory is already in use` | Close all other Chrome windows and retry. |
| `selenium.common.exceptions.SessionNotCreatedException` | Update Chrome, or `pip install -U selenium`. |
