"""
ChatGPT Checkout Launcher

Opens Chrome, loads chatgpt.com to warm up the session, then redirects to
the Stripe checkout URL the user picks from the menu.

URLs are read from environment variables (or a local .env file):
  - STRIPE_GOPAY_URL
  - STRIPE_PAYPAL_URL
  - STRIPE_EURO_URL
  - STRIPE_UK_URL

If those variables are not set, the script falls back to harmless demo URLs
so you can run it out of the box without any external/paid setup.
"""

import os
import sys
import time
import platform

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Optional: load variables from a local .env file if python-dotenv is installed.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def get_chrome_user_data_dir():
    """
    Return the default Chrome 'User Data' directory for the current OS,
    so the launched browser reuses the existing ChatGPT login session.
    Returns None if the path cannot be determined or does not exist.
    """
    system = platform.system()
    candidate = None

    if system == "Windows":
        local_app_data = os.getenv("LOCALAPPDATA")
        if local_app_data:
            candidate = os.path.join(local_app_data, r"Google\Chrome\User Data")
    elif system == "Darwin":  # macOS
        home = os.path.expanduser("~")
        candidate = os.path.join(home, "Library", "Application Support", "Google", "Chrome")
    elif system == "Linux":
        home = os.path.expanduser("~")
        candidate = os.path.join(home, ".config", "google-chrome")

    if candidate and os.path.isdir(candidate):
        return candidate
    return None


# Demo fallback URLs so the script is runnable out of the box without
# any Stripe / payment setup. Replace with real Stripe URLs via .env when ready.
DEMO_URLS = {
    "1": "https://example.com/checkout/gopay-premium",
    "2": "https://example.com/checkout/paypal-standard",
    "3": "https://example.com/checkout/euro-bundle",
    "4": "https://example.com/checkout/uk-pro",
}


def launch_checkout():
    print("=== Digital Subscription Router ===")
    print("1. GoPay Premium")
    print("2. PayPal Standard")
    print("3. Euro Bundle")
    print("4. UK Pro")

    choice = input("\nSelect your gateway option (1-4): ").strip()

    gateway_mapping = {
        "1": os.getenv("STRIPE_GOPAY_URL"),
        "2": os.getenv("STRIPE_PAYPAL_URL"),
        "3": os.getenv("STRIPE_EURO_URL"),
        "4": os.getenv("STRIPE_UK_URL"),
    }

    target_url = gateway_mapping.get(choice)

    if choice not in DEMO_URLS:
        print("\n[Error] Invalid choice. Please pick 1, 2, 3, or 4.")
        time.sleep(3)
        return

    if not target_url:
        target_url = DEMO_URLS[choice]
        print(f"\n[Demo mode] STRIPE_*_URL not set; using demo URL: {target_url}")
        print("To use a real checkout, copy .env.example to .env and add your URLs.")

    print("\nInitializing automated browser environment...")
    options = Options()
    # Keep the browser open after the script ends so the user can complete checkout.
    options.add_experimental_option("detach", True)

    user_data_dir = get_chrome_user_data_dir()
    if user_data_dir:
        options.add_argument(f"--user-data-dir={user_data_dir}")
        options.add_argument("--profile-directory=Default")
    else:
        print("Using a clean Chrome session (no existing profile detected).")

    try:
        driver = webdriver.Chrome(options=options)
        driver.get("https://chatgpt.com/")
        time.sleep(4)  # Wait for session verification layers

        print("Redirecting securely to checkout channel...")
        driver.get(target_url)
    except Exception as e:
        print(f"\n[Browser Error] Make sure all other Chrome windows are closed: {e}")
        time.sleep(5)


if __name__ == "__main__":
    try:
        launch_checkout()
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(0)
