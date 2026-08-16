require('dotenv').config();

if (!process.env.MONGODB_URI) {
  console.error('[fatal] MONGODB_URI is not set.');
  console.error('        Local: copy .env.example to .env and fill it in.');
  console.error('        Render: add MONGODB_URI (and SESSION_SECRET, NODE_ENV=production) in the service Environment tab.');
  process.exit(1);
}

const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { seed } = require('./seed/seed');
const Question = require('./models/Question');
const { flashMiddleware, trackActivity, loadUser } = require('./middleware/index');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    name: 'getselected.sid',
    secret: process.env.SESSION_SECRET || 'dev-insecure-session-secret-change-me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(flashMiddleware);
app.use(loadUser);
app.use(trackActivity);

// Global template helpers
app.locals.appName = 'GET SELECTED';
app.locals.appTagline = 'Practice. Prepare. Get Selected.';
app.locals.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
app.locals.env = process.env.NODE_ENV || 'development';
app.locals.formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
app.locals.formatTime = (sec) => {
  sec = Math.round(sec || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
app.locals.pct = (n) => Math.round(n || 0);

// Rate limiting for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

app.use('/login', authLimiter);
app.use('/signup', authLimiter);

app.use(require('./routes/public'));
app.use(require('./routes/auth'));
app.use(require('./routes/dashboard'));
app.use(require('./routes/practice'));
app.use(require('./routes/tests'));
app.use(require('./routes/companies'));
app.use(require('./routes/coding'));
app.use(require('./routes/leaderboard'));
app.use(require('./routes/profile'));
app.use(require('./routes/bookmarks'));
app.use(require('./routes/daily'));
app.use('/admin', require('./routes/admin'));

app.get('/healthz', (req, res) => res.json({ ok: true, app: 'get-selected' }));

// 404
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Page not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[error]', err.message, err.stack);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  res.status(500).render('errors/500', { title: 'Something went wrong', error: app.get('env') === 'development' ? err.message : null });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const qCount = await Question.countDocuments({});
  if (qCount === 0) {
    console.log('[server] Database is empty - running seed...');
    await seed({ disconnect: false });
    console.log('[server] Seed finished.');
  }

  app.listen(PORT, () => {
    console.log(`[server] GET SELECTED running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[fatal] Failed to start server:', err.message);
  process.exit(1);
});
