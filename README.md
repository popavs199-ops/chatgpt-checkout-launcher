# Subscription Management CRM Dashboard

A lightweight, GitHub-native CRM dashboard for managing digital subscriptions. Built as a static single-page application served via GitHub Pages, using a JSON file as the database and GitHub Actions for automated expiration alerts.

## Features

- **Dynamic Prorating Engine** - Calculates prorated costs based on a 170 DH / 30-day billing cycle, automatically adjusting for mid-cycle starts
- **Real-time Live Analytics** - Dashboard widgets displaying total revenue, active subscriptions, upcoming expirations, and growth trends
- **Interactive Searchable Data Grid** - Filterable, sortable table with instant search across all subscription fields
- **Promo Code System** - Built-in discount codes: `SPECIAL10` (-10%), `SAVE20` (-20 DH fixed discount)
- **Multi-Platform Expiration Alerts** - Automated notifications via Discord and Telegram webhooks when subscriptions are about to expire, powered by GitHub Actions

## File Structure

```
.
├── index.html          # Complete CRM dashboard (HTML + Tailwind CSS + JS)
├── database.json       # Subscription data store (JSON array)
├── .github/
│   └── workflows/
│       └── alerts.yml  # GitHub Actions workflow for expiration alerts
├── .gitignore
└── README.md
```

## Setup

### 1. Enable GitHub Pages

1. Go to your repository **Settings** > **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Set the branch to `main` and the folder to `/ (root)`
4. Click **Save**
5. Your dashboard will be available at `https://<username>.github.io/<repo-name>/`

### 2. Configure Repository Secrets

For automated expiration alerts, set the following repository secret:

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Name: `NOTIFICATION_WEBHOOK`
4. Value: Your Discord or Telegram webhook URL

The alerts workflow runs daily and sends notifications for subscriptions expiring within 3 days.

## Usage

### Configure GitHub Personal Access Token

The dashboard uses the GitHub API to read and write `database.json` directly in the repository.

1. Generate a **Fine-grained Personal Access Token** at [github.com/settings/tokens](https://github.com/settings/tokens)
2. Grant **Read and write** access to **Contents** for this repository
3. Open the dashboard in your browser and enter your PAT in the configuration section
4. The token is stored locally in your browser (localStorage) and never transmitted elsewhere

### Add Subscriptions

1. Open the dashboard
2. Click **Add Subscription**
3. Fill in the client name, platform, start date, and optional promo code
4. The prorating engine automatically calculates the correct amount based on the start date within the billing cycle
5. Click **Save** to commit the subscription to `database.json`

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Hosting | GitHub Pages |
| Styling | Tailwind CSS (CDN) |
| Icons | Font Awesome (CDN) |
| Data Storage | GitHub API (commits to `database.json`) |
| Automation | GitHub Actions (scheduled workflows) |
| Notifications | Discord / Telegram webhooks |

## License

This project is provided as-is for personal subscription management use.
