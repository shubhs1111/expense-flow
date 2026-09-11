# Expense Flow

A full-stack personal expense tracking app with real-time cloud sync, voice input, and rich analytics.

**Live:** [fullyoperationalexpenseapp.web.app](https://fullyoperationalexpenseapp.web.app)

## Features

- **Multi-user auth** — Email/password and Google sign-in via Firebase Auth
- **Cloud sync** — All data stored in Firestore, accessible from any device
- **Voice input** — Speak transactions using Web Speech API with smart parsing
- **Dark mode** — Full theme support with system preference detection
- **Insights dashboard** — Category breakdown, week-over-week, month-over-month comparisons, top expenses with delta tracking
- **Trend charts** — Interactive daily/weekly/monthly spending charts rendered on canvas
- **Wallet overview** — Track current account, savings, investments, and credit card with billing cycle support
- **Export/Import** — JSON backup and restore
- **Search & filter** — Filter transaction history by category, type, or keyword
- **Keyboard shortcuts** — Ctrl+N to quickly add a transaction

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks, no build step)
- **Backend:** Firebase (Auth + Firestore)
- **Hosting:** Firebase Hosting
- **Voice:** Web Speech API (SpeechRecognition)
- **Charts:** Custom canvas rendering

## Architecture

```
index.html          — App structure, auth screens, all UI
styles.css          — Theming (light/dark), responsive layout, all components
app.js              — Application logic, Firebase integration, voice parsing
firebase.json       — Hosting and Firestore config
firestore.rules     — Security rules (per-user data isolation)
```

Each user's data is stored at `users/{uid}` in Firestore with security rules ensuring complete privacy — users can only read and write their own data.

## Running Locally

1. Clone the repo
2. Start any local server, e.g.:
   ```bash
   python -m http.server 3456
   ```
3. Open `http://localhost:3456`

## Deployment

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

## Screenshots

### Login
Clean auth screen with email/password and Google sign-in.

### Dashboard
Track spending across accounts with credit card billing cycle support.

### Insights
Category breakdown, spending trends, and month-over-month comparisons.

### Voice Input
Speak your transactions — the parser handles amounts, categories, accounts, and dates.

## License

MIT
