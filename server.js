require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const warrantyRoutes = require('./routes/warranty');
const contactRoutes  = require('./routes/contact');
const productsRoutes = require('./routes/products');

const app  = express();
const PORT = process.env.PORT || 3000;

// Trust Railway's proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  validate: { xForwardedForHeader: false },
});

app.use(limiter);

// Routes
app.use('/api/warranty', warrantyRoutes);
app.use('/api/contact',  contactLimiter, contactRoutes);
app.use('/api/products', productsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    company: 'ABR Technologies',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`✅ ABR Technologies API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
});
