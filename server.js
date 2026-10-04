const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Uploads Directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `daedalus-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`);
  }
});
const upload = multer({ storage });

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(uploadDir));

app.use(session({
  secret: 'daedalus_secure_vault_session_key_99',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Authentication Guard
function authRequired(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Sign in required.' });
}

// ======================== PUBLIC API ======================== //
app.get('/api/business-data', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM company_info WHERE id = 1').get();
    const services = db.prepare('SELECT * FROM services ORDER BY id ASC').all();
    const projects = db.prepare('SELECT * FROM agency_projects ORDER BY id DESC').all();
    res.json({ company, services, projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================== AUTHENTICATION API ======================== //
app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.admin) });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid admin username or password' });
  }
  req.session.admin = { id: user.id, username: user.username };
  res.json({ success: true, username: user.username });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ======================== ADMIN CRUD API ======================== //

// 1. Update Company & Founder Info
app.put('/api/company-info', authRequired, (req, res) => {
  const {
    company_name, tagline, hero_headline, hero_subtext,
    founder_name, founder_role, founder_bio, founder_portfolio_url,
    instagram_url, contact_email, contact_phone, contact_location
  } = req.body;

  db.prepare(`
    UPDATE company_info SET
      company_name = ?, tagline = ?, hero_headline = ?, hero_subtext = ?,
      founder_name = ?, founder_role = ?, founder_bio = ?, founder_portfolio_url = ?,
      instagram_url = ?, contact_email = ?, contact_phone = ?, contact_location = ?
    WHERE id = 1
  `).run(
    company_name, tagline, hero_headline, hero_subtext,
    founder_name, founder_role, founder_bio, founder_portfolio_url,
    instagram_url, contact_email, contact_phone, contact_location
  );

  res.json({ success: true });
});

// 2. Services CRUD
app.post('/api/services', authRequired, (req, res) => {
  const { icon, title, description, deliverables } = req.body;
  const result = db.prepare(`
    INSERT INTO services (icon, title, description, deliverables) VALUES (?, ?, ?, ?)
  `).run(icon || '⚙️', title, description, deliverables || '');
  res.json({ id: result.lastInsertRowid, success: true });
});

app.delete('/api/services/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 3. Projects CRUD (with image upload)
app.post('/api/projects', authRequired, upload.single('image'), (req, res) => {
  const { title, category, description, live_url, client_name } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : '';
  const result = db.prepare(`
    INSERT INTO agency_projects (title, category, description, image_url, live_url, client_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, category, description, image_url, live_url, client_name || '');
  res.json({ id: result.lastInsertRowid, success: true });
});

app.delete('/api/projects/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM agency_projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Start Server binding to 0.0.0.0 for Cloud compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`  Daedalus & Co. Business Server Running!      `);
  console.log(`  Public Website : http://localhost:${PORT}      `);
  console.log(`  Admin Studio   : http://localhost:${PORT}/admin `);
  console.log(`===============================================`);
});