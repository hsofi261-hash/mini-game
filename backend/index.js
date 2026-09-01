const express = require('express')
const http = require('http'); // 1. Import HTTP core module
const { Server } = require('socket.io');
const sequelize = require('./db');
const cookieParser = require("cookie-parser");
const cors = require('cors')

const UserRoutes = require('./routes/userRoutes')
const GameRoutes = require('./routes/gameRoutes')
const registerTicTacToeSocket = require('./sockets/TickTakSocket');
const registerMemorySocket = require('./sockets/memorySocket');

const app = express();
const PORT = 5000

app.use(cors({
  origin: 'http://localhost:3000', // Adjust to client URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


app.use('/auth', UserRoutes)
app.use('/game', GameRoutes)


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

// Delegate connection events to the game socket module
registerTicTacToeSocket(io.of('/tictactoe'));
registerMemorySocket(io.of('/memory'));



async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database connected successfully via Sequelize');

    server.listen(PORT, () => {
      console.log(`Backend service & Socket.IO running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();