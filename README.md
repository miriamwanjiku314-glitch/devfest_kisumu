# DevFest Kisumu 2026 - Speakers Schedule Application

A web application built with **Node.js** and **Express** that displays the speakers' schedule, agenda, tracks, and profiles for the **DevFest Kisumu 2026** event in Western Kenya.

---

## 🚀 Features

- **Google Developer Groups (GDG) Themed UI**: Vibrant Material Design aesthetic featuring Google Blue, Red, Yellow, and Green accents.
- **Full Interactive Schedule**: Chronological timeline grouped by time slots with multi-track layout.
- **Search & Live Filtering**: Instant search across titles, descriptions, speaker names, rooms, and topics/tags.
- **Track & Difficulty Level Filters**: Filter by stages (Victoria Hall, Riat AI Stage, Dunga Mobile/Web Stage, Kavirondo Cloud Lab) or levels (Beginner, Intermediate, Advanced).
- **Speaker Directory**: Profiles with biographies, roles, companies, social links (Twitter/X, LinkedIn, GitHub), and their scheduled sessions.
- **Interactive Details Modal**: Deep dive into session descriptions, prerequisites, and speaker bios.
- **Personal Agenda (Bookmarks)**: Star your favorite sessions; they are preserved in `localStorage` with a printable/exportable agenda view.
- **Calendar Export**: Download standard `.ics` calendar events directly from session details.
- **Dark / Light Mode**: Seamless theme toggle stored in user preferences.
- **Mobile Responsive**: Optimized for phones, tablets, and desktop displays.

---

## 📁 Project Structure

```
devfest_kisumu/
├── data/
│   └── agendas.json       # JSON file containing event, tracks, speakers, and sessions
├── public/
│   ├── css/
│   │   └── styles.css     # Responsive Google/DevFest design styling
│   ├── js/
│   │   └── app.js         # Frontend app logic, state management, search, filters
│   └── index.html         # Main single-page application interface
├── package.json           # Project manifest and dependencies
├── server.js              # Express web server and REST API
└── README.md              # Project documentation
```

---

## 🛠️ Quick Start

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm**

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

### 4. Open in Browser
Visit [http://localhost:3000](http://localhost:3000)

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/event` | Event metadata, theme, and summary statistics | - |
| `GET` | `/api/tracks` | List of all stages/tracks | - |
| `GET` | `/api/schedule` | All sessions with speaker information joined | `track`, `speaker`, `level`, `tag`, `search` |
| `GET` | `/api/schedule/:id` | Single session details by ID | - |
| `GET` | `/api/speakers` | All speakers enriched with their sessions | - |
| `GET` | `/api/speakers/:id` | Single speaker by ID | - |

### Example API Requests:
- Filter AI track: `GET /api/schedule?track=riat`
- Search for Gemini: `GET /api/schedule?search=Gemini`
- Filter by level: `GET /api/schedule?level=Intermediate`

---

## ✏️ Customizing the Agenda

To add or modify speakers, tracks, or sessions, edit the file:
`data/agendas.json`

The JSON structure is cleanly organized into `event`, `tracks`, `speakers`, and `sessions`. The Express server automatically loads the updated data on requests.
