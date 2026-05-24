import os
import time
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def launch_checkout():
    print("=== Digital Subscription Router ===")
    print("1. GoPay Premium")
    print("2. PayPal Standard")
    print("3. Euro Bundle")
    print("4. UK Pro")
    
    choice = input("\nSelect your gateway option (1-4): ").strip()
    
    # Reads the links directly from your operating system's environment variables
    gateway_mapping = {
        "1": os.getenv("STRIPE_GOPAY_URL"),
        "2": os.getenv("STRIPE_PAYPAL_URL"),
        "3": os.getenv("STRIPE_EURO_URL"),
        "4": os.getenv("STRIPE_UK_URL")
    }
    
    target_url = gateway_mapping.get(choice)
    
    if not target_url:
        print("\n[Error] Configuration link not found!")
        print("Please make sure you set your environment variables on your computer.")
        time.sleep(5)
        return

    print("\nInitializing automated browser environment...")
    options = Options()
    options.add_experimental_option("detach", True)
    
    # Pulls default Chrome data path to maintain your ChatGPT login session
    try:
        local_app_data = os.getenv('LOCALAPPDATA')
        if local_app_data:
            user_profile_path = os.path.join(local_app_data, r"Google\Chrome\User Data")
            options.add_argument(f"--user-data-dir={user_profile_path}")
            options.add_argument("--profile-directory=Default")
    except Exception:
        pass

    try:
        driver = webdriver.Chrome(options=options)
        driver.get("https://chatgpt.com/")
        time.sleep(4)  # Wait for session verification layers
        
        print("Redirecting securely to checkout channel...")
        driver.get(target_url)
    except Exception as e:
        print(f"\n[Browser Error] Ensure all other Chrome windows are closed: {e}")
        time.sleep(5)

if __name__ == "__main__":
    launch_checkout()