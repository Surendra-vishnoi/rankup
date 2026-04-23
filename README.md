# RankUp ⚡

[![Live Site](https://img.shields.io/badge/Live-Site-emerald?style=for-the-badge&logo=render&logoColor=white)](https://rankup-zvji.onrender.com/)

**RankUp** is a premium, high-performance community platform designed for Codeforces enthusiasts and competitive programmers. It bridges the gap between problem-solving and community discussion, offering a seamless, glass-morphic experience for sharing insights, tracking contests, and accessing official editorials.

## 🚀 Key Features

- **Hub & Discussions**: A real-time feed for insights, doubts, and general CP discussion with full Markdown, LaTeX, and code syntax highlighting.
- **Wing Editorials ⭐**: Official, high-quality solutions authored by CP Wing members. Features a progressive hint system to avoid spoilers and a clean, expandable interface.
- **Contests Hub 🏆**: Stay updated with upcoming Codeforces contests. Includes real-time contest tracking and dedicated community messaging channels for live competition discussion.
- **Live CF Sync 🔄**: Automated background synchronization with the Codeforces API. User ratings, ranks, and solved counts are kept up-to-date in real-time.
- **The Drafting Room 🖋️**: A professional workspace for Wing members to compose structured editorials with multiple hints and full solution previews.
- **Admin Console**: Robust moderation tools and platform management secured for administrators.
- **Verification System**: Secure account linking via Codeforces compilation errors to ensure authentic handle ownership.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion for premium animations.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas for global data persistence.
- **Authentication**: JWT-based secure auth with `cookie-parser`.
- **Integrations**: Codeforces API (user info, status, and contest data).

## 📦 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas cluster
- Codeforces Account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Surendra-vishnoi/rankup.git
   cd rankup
   ```

2. **Install Dependencies:**
   ```bash
   # Root & Backend
   npm install

   # Frontend
   cd frontend
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   ```

4. **Run Locally:**
   ```bash
   # From the root directory
   npm run dev
   ```

## 🎨 Design Philosophy

RankUp follows a **"Deep Space"** aesthetic—utilizing glass-morphism, subtle gradients, and high-contrast typography to create a focused, premium environment that complements the rigorous nature of competitive programming.

---
Built with ❤️ by the **RankUp Team**.
