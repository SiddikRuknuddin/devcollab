# 🚀 DevCollab — Modern Collaborative Workspace for Developers

<div align="center">

![DevCollab Banner](https://img.shields.io/badge/DevCollab-Developer%20Ecosystem-6366f1?style=for-the-badge&logo=codeforces&logoColor=white)
<br/>

[![MERN Stack](https://img.shields.io/badge/Stack-MERN%20(React%20+%20Node%20+%20Mongo)-10b981?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Socket.io](https://img.shields.io/badge/RealTime-Socket.io%20%2B%20WebRTC-010101?style=for-the-badge&logo=socketdotio)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Frontend-Vite%208-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**DevCollab** is an all-in-one, modern collaborative developer platform designed to help engineers, open-source contributors, and software teams build, review, discuss, and ship software together in real-time.

[Explore Features](#-key-features) • [Quick Start](#-quick-start-guide) • [Architecture](#-architecture--tech-stack) • [API Overview](#-api-endpoints-overview) • [Contributing](#-contributing)

</div>

---

## 🌟 Key Features

### 🛠️ 1. Project Management & Agile Kanban
* **Interactive Kanban Board:** Drag-and-drop tasks across `To Do`, `In Progress`, and `Completed`.
* **Task Priorities & Bounties:** Assign difficulty levels (`Low`, `Medium`, `High`, `Critical`), set monetary bounties, claim tasks, and release escrow rewards.
* **Sprint Velocity Analytics:** Real-time analytics calculating completion rate, velocity points, and sprint burn-down metrics.
* **Milestone Roadmaps:** Schedule project deadlines, track milestones, and toggle progress completions.

### 👥 2. Real-Time Pair Programming & Live Tools
* **Multi-player Live Code Editor:** Real-time collaborative pair-programming powered by Socket.io room events.
* **Architecture Whiteboard:** Interactive collaborative whiteboard canvas to design system architectures, component trees, and workflows.
* **In-Browser Code Sandbox & Runner:** Execute JavaScript, Python, and CSS snippets safely inside isolated evaluation containers.
* **Team Chat & Code Snippets:** Live project messaging channels with typing indicators, online member status, and syntax-highlighted code sharing.
* **Voice Huddle & Video Meetings:** Instant floating voice channels and WebRTC meeting rooms for synchronous standups.

### 🛡️ 3. AI-Powered Developer Tools
* **AI Code Reviewer & Vulnerability Scanner:** Automated code audit engine that flags SQL injection, XSS vulnerabilities, race conditions, and unoptimized algorithms.
* **Smart Refactoring:** Provides side-by-side refactored code recommendations and security health scores (0-100).
* **Direct File Ingestion:** Upload `.js`, `.py`, `.ts`, `.sql`, `.java`, `.cpp` source files directly into the reviewer with auto-detected syntax parsing.
* **AI Teammate Matchmaker:** Heuristic skill-scoring algorithm that recommends registered developers who match the project's tech stack.

### 📁 4. Project Asset & File Vault
* **Direct File Uploads:** Upload architecture PDFs, wireframes, zip packages, and documentation directly (up to 25MB).
* **Dual Storage Engine:** Seamless fallback between Cloudinary cloud CDN and local server static storage (`/uploads/projects`).
* **Design & Spec Bookmarking:** Link Figma prototypes, Notion PRDs, and Google Drive assets alongside binary files.

### 📜 5. Verified Developer Identity & Public Portfolios
* **Public Portfolio Pages:** Shareable profile links (`/portfolio/:id`) showcasing completed projects, technical skills, badges, and endorsements.
* **Verified Credentials & Certificates:** Upload authentic PDF or Image certifications with direct verification links.
* **GitHub Live Feed:** Integrates with GitHub REST API to display live repository stars, forks, open issues, language distributions, and commit feeds.
* **Peer Skill Endorsements:** Upvote and endorse teammates for specific technical proficiencies.

### 💬 6. Developer Community Discussions
* **Threaded Technical Discussions:** Ask questions, share insights, and discuss tech stacks with tags.
* **Upvotes & Nested Comments:** Community voting algorithm and nested discussion replies.
* **Instant Notifications:** In-app notification center alerting users about team invites, task assignments, and mentions.

### 🎨 7. Modern UI / UX Design
* **Adaptive Dark & Light Themes:** Ultra-fast, flicker-free theme switching with curated HSL color tokens.
* **Glassmorphism & Micro-animations:** Polished modern styling, custom scrollbars, and fluid responsive layouts.

---

## 🏛️ Architecture & Tech Stack

```
devcollab/
├── client/                     # Frontend (React 19 + Vite)
│   ├── src/
│   │   ├── components/         # Modular UI components (Kanban, AIReviewer, Whiteboard, etc.)
│   │   ├── context/            # AuthContext & ThemeContext
│   │   ├── pages/              # Route pages (Dashboard, Profile, ProjectDetails, etc.)
│   │   ├── services/           # Axios API client & Socket.io connection manager
│   │   └── index.css           # Global CSS variables, themes, & utility classes
│   └── vite.config.js          # Vite build & plugin configuration
│
└── server/                     # Backend (Node.js + Express + MongoDB)
    ├── controllers/            # Route logic (projects, tasks, ai, users, messages, etc.)
    ├── middleware/             # Auth JWT guard, Multer file upload, & Rate limiting
    ├── models/                 # Mongoose schemas (User, Project, Task, Message, etc.)
    ├── routes/                 # REST API endpoints
    ├── services/               # GitHub API integration & external webhooks
    ├── utils/                  # Cloudinary helpers & webhook dispatchers
    ├── uploads/                # Local asset fallback storage (avatars, certs, projects)
    └── server.js               # HTTP & Socket.io server entry point
```

### Technology Matrix

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router v7, Axios, Lucide Icons, Vanilla CSS |
| **Backend** | Node.js, Express.js 4, Socket.io 4, Multer, Bcrypt.js, JSON Web Tokens (JWT) |
| **Database** | MongoDB, Mongoose ODM |
| **Storage & Cloud** | Cloudinary API (with automatic local disk fallback) |
| **APIs & Webhooks** | GitHub REST API v3, Discord Webhooks, Slack Webhooks |

---

## ⚡ Quick Start Guide

### Prerequisites
Make sure you have installed on your local environment:
* [Node.js](https://nodejs.org/) (v18.0.0 or later)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* [MongoDB](https://www.mongodb.com/) (Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

### 1. Clone the Repository
```bash
git clone https://github.com/SiddikRuknuddin/devcollab.git
cd devcollab
```

---

### 2. Configure Backend (`server`)

1. Navigate to the server folder and install dependencies:
```bash
cd server
npm install
```

2. Create a `.env` file in the `server/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/devcollab
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# Optional: Cloudinary Storage (if omitted, files are saved locally to /uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: Email Service for Verification Tokens
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

3. Start the backend server:
```bash
npm run dev
```
> The API and Socket.io server will start running on **`http://localhost:5000`**.

---

### 3. Configure Frontend (`client`)

1. In a new terminal window, navigate to the client folder and install dependencies:
```bash
cd client
npm install
```

2. (Optional) Create a `.env` file in the `client/` directory:
```env
VITE_API_URL=http://localhost:5000
```

3. Launch the Vite development server:
```bash
npm run dev
```
> Open your browser at **`http://localhost:5173`** to access DevCollab.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **POST** | `/api/auth/register` | Register a new developer account | ❌ |
| **POST** | `/api/auth/login` | Login and receive JWT token | ❌ |
| **GET** | `/api/users/profile` | Get current user's complete profile | ✅ |
| **PUT** | `/api/users/profile` | Update profile (skills, bio, certs, social links) | ✅ |
| **POST** | `/api/users/profile/image` | Upload custom profile avatar image | ✅ |
| **POST** | `/api/users/profile/certificate-upload` | Upload PDF or image certificate file | ✅ |
| **GET** | `/api/users/portfolio/:id` | Fetch public portfolio & stats (Recruiters) | ❌ |
| **GET** | `/api/projects/my` | Retrieve logged-in user's projects | ✅ |
| **POST** | `/api/projects` | Create a new project workspace | ✅ |
| **GET** | `/api/projects/:id` | Get project details, members & roadmap | ✅ |
| **POST** | `/api/projects/:id/files/upload` | Upload 25MB project asset/document | ✅ |
| **GET** | `/api/tasks/project/:projectId` | Fetch Kanban tasks & bounties | ✅ |
| **POST** | `/api/tasks` | Create task with priority & bounty | ✅ |
| **POST** | `/api/ai/code-review` | Trigger AI code security & quality scan | ✅ |
| **GET** | `/api/messages/project/:projectId` | Fetch historical chat messages | ✅ |

---

## 🔒 Security Best Practices Implemented
* **Password Hashing:** Passwords are encrypted using `bcryptjs` with auto-salted rounds.
* **JWT Authentication:** Strict authorization middleware verifying bearer tokens on protected endpoints.
* **Rate Limiting:** Prevents brute-force attempts on sensitive authentication endpoints.
* **Input Sanitization & CORS:** Strict CORS origin policies and nosniff / frameguard HTTP headers.
* **Safe Error Handling:** Production mode masks sensitive database stack traces.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the Project (`https://github.com/SiddikRuknuddin/devcollab/fork`)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/SiddikRuknuddin">Siddik Ruknuddin</a> and open-source contributors.</sub>
</div>
