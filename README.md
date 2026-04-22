# RankUp

A premium MERN‑stack community platform for Codeforces enthusiasts. Features include:
- Real‑time leaderboard powered by live Codeforces rating sync
- Commenting engine with pagination, admin moderation, and wing‑member privileges
- Admin console (`/admin`) secured to the `Surendra_vishnoi` account only
- Daily background job that syncs verified users' CF ratings to MongoDB Atlas
- Glass‑morphic UI built with React, Vite, and Tailwind CSS

All data now lives in a MongoDB Atlas cluster, so any post, comment, or rating change is instantly visible to every user, whether they run the app locally or from a deployed Render instance.
