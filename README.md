# Minigame Application

A full-stack web application featuring interactive minigames with authentication, leaderboards, and real-time multiplayer functionality.

## 📋 Project Overview

This is a comprehensive minigame platform built as a portfolio project. It includes multiple games (Chess, Tic Tac Toe, Memory Cards) with user authentication, game statistics, leaderboards, and user reviews. The application uses WebSockets for real-time communication and is containerized with Docker for easy deployment.

## 🎥 Project Demo

<p align="center">
  <a href="https://youtu.be/GaN6YzGxbr4">
    <img
      src="https://img.youtube.com/vi/GaN6YzGxbr4/maxresdefault.jpg"
      alt="Watch Project Demo"
      width="700"
    />
  </a>
</p>

<p align="center">
  ▶️ <b>Click the image above to watch the project demo</b>
</p>

**Video link**

[**https://youtu.be/GaN6YzGxbr4**](https://youtu.be/GaN6YzGxbr4)

## ✨ Features

- **User Authentication**: Sign up and login functionality
- **Multiple Games**: 
  - Chess
  - Tic Tac Toe
  - Memory Cards
- **Real-time Multiplayer**: WebSocket-based live game updates
- **Leaderboards**: Global and game-specific rankings
- **User Reviews**: Rate and review games
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Socket.io** for real-time communication
- **Database**: MongoDB/SQL (configured in db.js)
- **Containerized**: Docker

### Frontend
- **Next.js** with TypeScript
- **React with Redux** (RTK - Redux Toolkit)
- **Tailwind CSS** for styling
- **ESLint** for code quality
- **Containerized**: Docker

## 📁 Project Structure

```
minigame/
├── backend/              # Express.js server
│   ├── index.js          # Server entry point
│   ├── db.js             # Database configuration
│   ├── seed.js           # Database seeding
│   ├── package.json
│   ├── Dockerfile
│   ├── controller/       # Route controllers
│   │   ├── gameControll.js
│   │   └── UserControll.js
│   ├── models/           # Database models
│   │   ├── Game.js
│   │   ├── GameRule.js
│   │   ├── LeaderboardEntry.js
│   │   ├── Review.js
│   │   └── User.js
│   ├── routes/           # API routes
│   │   ├── gameRoutes.js
│   │   └── userRoutes.js
│   └── sockets/          # WebSocket handlers
│       ├── memorySocket.js
│       └── TickTakSocket.js
│
├── frontend/             # Next.js application
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Home page
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── StoreProvider.tsx
│   │   ├── auth/         # Authentication pages
│   │   └── games/        # Game pages
│   ├── components/       # React components
│   │   ├── Navbar.tsx
│   │   └── games/        # Game components
│   ├── lib/              # Utilities and store
│   │   ├── store.ts      # Redux store
│   │   ├── hooks.ts
│   │   ├── features/     # Redux slices
│   │   └── service/      # API calls
│   ├── public/           # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── Dockerfile
│
├── docker-compose.yml    # Docker Compose configuration
└── README.md             # This file
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Docker & Docker Compose (optional, for containerized setup)
- MongoDB or your configured database

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```
   PORT=5000
   DATABASE_URL=your_database_url
   NODE_ENV=development
   ```

4. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the frontend directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

## 🐳 Docker Setup

To run the entire application using Docker Compose:

1. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

3. **Stop the services**
   ```bash
   docker-compose down
   ```

## 📦 Available Scripts

### Backend
- `npm start` - Start the server
- `npm run dev` - Start with nodemon (development)
- `npm run seed` - Seed the database

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm start` - Start production server

## 🔌 API Endpoints

### User Routes (`/api/users`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Game Routes (`/api/games`)
- `GET /` - Get all games
- `GET /:id` - Get game details
- `POST /:id/play` - Start game session
- `POST /:id/review` - Add game review
- `GET /leaderboard` - Get leaderboard

## 🎮 WebSocket Events

### Memory Game (`memorySocket.js`)
- `start_game` - Initialize game
- `card_flip` - Player flips a card
- `game_end` - Game session ends

### Tic Tac Toe (`TickTakSocket.js`)
- `create_room` - Create game room
- `join_room` - Join existing room
- `make_move` - Make a move
- `game_result` - Emit game result

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Commit and push
5. Submit a pull request



## 📧 Contact

For questions or feedback, please reach out through your preferred communication channel.
