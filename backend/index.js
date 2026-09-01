const express = require('express')
const sequelize = require('./db');
const cookieParser = require("cookie-parser");
const cors = require('cors')

const UserRoutes = require('./routes/userRoutes')
const GameRoutes = require('./routes/gameRoutes')

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


app.use(express.json());

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database connected successfully via Sequelize');

    // Sync models with database
    await sequelize.sync();

    app.listen(PORT, () => {
      console.log(`Backend service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();