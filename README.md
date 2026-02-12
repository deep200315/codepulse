# CodePulse

> **Privacy-first coding activity tracker for VS Code**

Track your active coding time, typing speed (WPM), and language usage — all data stays 100% local. Zero telemetry, zero network calls.

![CodePulse Status Bar](https://via.placeholder.com/800x100/1e1e1e/ffffff?text=Status+Bar+Preview)

## ✨ Features

### 📊 Real-time Metrics in Your Status Bar
- **Active Time** — Only counts when you're actually typing or interacting
- **Current Language** — Shows the language you're working in with time spent
- **Typing Speed (WPM)** — Live words-per-minute calculation (30-second rolling average)

### 🔒 100% Private
- ❌ No telemetry
- ❌ No network calls
- ❌ No analytics
- ✅ All data stored locally (VS Code `globalState`)
- ✅ Full control — export your data anytime

### 📈 Daily Stats Dashboard
Click the status bar to see:
- Total active time today
- Per-language breakdown with time spent
- Total keystrokes
- Average typing speed

### 💾 Data Export
Export your coding stats as **JSON** or **CSV**:
- Via Command Palette: `CodePulse: Export Data`
- Via Quick Pick: Click status bar → select Export

### 🧠 Smart Idle Detection
- Automatically pauses tracking after 2 minutes of inactivity (configurable)
- Immediately pauses when VS Code loses focus
- No manual start/stop required

### 🗂️ Auto-cleanup
Automatically prunes data older than 90 days to keep storage lean.

## 📸 Screenshots

*Coming soon*

## 🚀 Getting Started

1. **Install** the extension from the VS Code Marketplace
2. **Start coding** — CodePulse tracks automatically
3. **Check your stats** — Click the status bar item: `⏱ 2h 30m | 📄 TS 45m | 📊 45 WPM`

### First-time Setup
A walkthrough will guide you through CodePulse's features on first launch. You can also access it anytime via:
- **Command Palette** → `Welcome: Open Walkthrough...` → `CodePulse`

## ⚙️ Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `codepulse.idleTimeout` | number | `120` | Seconds of inactivity before pausing tracking |
| `codepulse.showWpm` | boolean | `true` | Show/hide WPM in status bar |

## 📋 Commands

| Command | Description |
|---------|-------------|
| `CodePulse: Show Today's Stats` | Open Quick Pick with detailed stats |
| `CodePulse: Export Data` | Export all data as JSON or CSV |

## 🛠️ Technical Details

### Data Storage
- **Location**: VS Code `globalState` (workspace-scoped)
- **Format**: Daily aggregates with per-language breakdown
- **Retention**: 90 days (auto-pruned)

### Performance
- **Tick interval**: 10 seconds
- **WPM window**: 30 seconds (rolling average)
- **CPU overhead**: <2% during active typing (production mode)
- **Memory footprint**: ~20-50 MB (production mode)

### Privacy Guarantee
CodePulse is **completely offline**. Inspect the [source code](https://github.com/deep200315/codepulse) — you'll find zero `fetch`, `axios`, or telemetry calls.


## 🐛 Issues & Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/deep200315/codepulse/issues)

---

**Enjoy tracking your coding journey — privately! 🚀**
