require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongo = require('mongoose');
const http = require('http');
const bodyparser = require('body-parser');
const db = require('./config/dbConnection.json');
const session = require('express-session');
const transporter = require('./utils/emailConfig'); // Import the transporter from middleware
const MongoStore = require('connect-mongo');
const cors = require('cors');


// Connect to MongoDB
mongo
  .connect(db.url)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

const usersRouter = require('./routes/users');
const taskRouter=require('./routes/Task')
const profileRouter = require('./routes/profile');
const projectRouter = require('./routes/project');
const notifroute = require('./routes/notification');

// const homeRouter = require('./routes/home');
const adminRouter = require('./routes/admin');


const app = express();
const socketIo = require('socket.io');
const server = http.createServer(app);

const io = socketIo(server);

app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true, // Allow cookies to be sent/received
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');



// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use a secure secret key
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: db.url, // MongoDB connection URL
      ttl: 24 * 60 * 60, // Session TTL (1 day)
    }),
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: 'lax', // Prevent CSRF attacks
    },
  })
);

app.use('/notifications',notifroute);


// Routes
app.use('/users', usersRouter);
// app.use('/', homeRouter);
app.use('/admin',adminRouter);
app.set('io', io);
app.use('/tasks',taskRouter);

app.use('/project',projectRouter);

app.use('/profiles', profileRouter);

app.post("/translate", async (req, res) => {
  const { text, targetLanguage } = req.body;

  try {
    const response = await axios.post("https://libretranslate.com/translate", {
      q: text,
      source: "auto",
      target: targetLanguage,
    });

    const translatedText = response.data.translatedText;
    res.json({ translatedText });
  } catch (error) {
    console.error("Error translating text:", error);
    res.status(500).json({ error: "Translation failed" });
  }
});

// Error handling
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
// Start server

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});