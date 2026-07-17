<p align="center">
  <img src="./image.png" alt="Backyard World Cup application preview" width="42" />
</p>

<h1 align="center">Backyard World Cup</h1>

<p align="center">
  A real-time party tournament companion where every guest represents a country.
</p>

## 1. About

<p align="justify">
Backyard World Cup started as a birthday-party idea: turn a casual get-together into a small World Cup of our own. Each guest receives a cup decorated with a national flag and a unique QR code. Scanning it opens a personal invitation, assigns that country to the guest, and lets them join the tournament by entering their name. From that moment, every challenge, prediction, and point contributes to a shared live leaderboard.
</p>

<p align="justify">
The application is designed to stay out of the way of the party. Players join without passwords through anonymous sessions, while the host controls the event from a dedicated administrator panel. Challenges can be opened, started, and closed in real time, and the mobile-first interface keeps scores and active tasks easy to follow on any guest's phone.
</p>

### Highlights

|                                |                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| 🏳️ **Country invitations**     | Unique QR links assign each participant to a World Cup team.                           |
| 🏆 **Live leaderboard**        | Scores and ranking changes are synchronized across devices in real time.               |
| 🎮 **Interactive challenges**  | Quizzes, Hall of Fame picks, match predictions, and offline activities share one flow. |
| 🎛️ **Host dashboard**          | The organizer controls challenge states, reviews submissions, and awards points.       |
| 🔐 **Session ownership**       | Supabase Anonymous Auth and Row Level Security connect each player to their device.    |
| 📱 **Mobile-first experience** | A responsive, game-inspired interface built for phones around the party table.         |

## 2. Built with

<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript_6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3FCF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages" />
</p>

## 3. Getting started

### Prerequisites

- Node.js 22 or newer
- Yarn
- A Supabase project

### Installation

Clone the repository and install its dependencies:

```bash
git clone https://github.com/Chris-ai/backyard-world-cup.git
cd backyard-world-cup
yarn install
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

In your Supabase project:

1. Enable **Anonymous Sign-Ins** under Authentication settings.
2. Prepare the `players`, `challenges`, `results`, and `bets` tables.
3. Apply the included Supabase security and migration scripts in the SQL Editor.
4. Enable Realtime for the tables used by the leaderboard and challenge flow.

Start the development server:

```bash
yarn dev
```

Before deploying, verify the project:

```bash
yarn lint
yarn build
```
