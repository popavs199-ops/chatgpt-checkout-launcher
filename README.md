# chatgpt-checkout-launcher

A small Python/Selenium utility that:

1. Opens a Chrome window (reusing your existing Chrome profile, so your ChatGPT login is preserved).
2. Loads `https://chatgpt.com/` to warm up the session.
3. Redirects to one of four Stripe checkout URLs based on a menu choice.

## Requirements

- Python 3.9+
- Google Chrome installed
- Selenium 4.6+ uses **Selenium Manager** to auto-download the matching `chromedriver`, so no manual driver setup is required.

## Quick start (no setup, no payment account needed)

```bash
git clone https://github.com/popavs199-ops/chatgpt-checkout-launcher.git
cd chatgpt-checkout-launcher
pip install -r requirements.txt
python main.py
```

The script ships with **demo URLs** that point to `example.com`, so it runs out of
the box. No Stripe account, no API keys, no paid services required.

## Full setup (when you want real Stripe checkout)

```bash
# 1. (Recommended) create a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure your Stripe checkout URLs
cp .env.example .env       # macOS / Linux
copy .env.example .env     # Windows
# Then edit .env and paste in your real Stripe URLs.
```

## Run

```bash
python main.py
```

You'll see a menu:

```
=== Digital Subscription Router ===
1. GoPay Premium
2. PayPal Standard
3. Euro Bundle
4. UK Pro

Select your gateway option (1-4):
```

Pick a number and Chrome will open, briefly load chatgpt.com, then redirect to the matching Stripe checkout. The browser stays open after the script exits so you can finish the payment.

## Configuration

The four URLs can be supplied in either of two ways:

**Option A — `.env` file** (easiest, recommended for local use):

```env
STRIPE_GOPAY_URL=https://buy.stripe.com/...
STRIPE_PAYPAL_URL=https://buy.stripe.com/...
STRIPE_EURO_URL=https://buy.stripe.com/...
STRIPE_UK_URL=https://buy.stripe.com/...
```

**Option B — system environment variables**:

```bash
# Windows (PowerShell)
$env:STRIPE_GOPAY_URL = "https://buy.stripe.com/..."

# macOS / Linux
export STRIPE_GOPAY_URL="https://buy.stripe.com/..."
```

## Notes

- **Close any other open Chrome windows before running.** Chrome only allows one process to use a given user-data directory at a time. If Chrome is already running, Selenium will fail to start.
- The script auto-detects the Chrome profile path on Windows, macOS, and Linux. If no profile is found it falls back to a clean session.
- `.env` is gitignored — your URLs will not be committed.

## Troubleshooting

| Problem | Fix |
|---|---|
| `[Browser Error] ... user data directory is already in use` | Close all other Chrome windows and retry. |
| `[Error] Configuration link not found!` | Your `.env` is missing or the matching `STRIPE_*_URL` variable is not set. |
| `selenium.common.exceptions.SessionNotCreatedException` | Update Chrome to the latest version, or upgrade Selenium: `pip install -U selenium`. |
