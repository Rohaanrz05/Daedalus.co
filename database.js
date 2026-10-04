const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const db = new Database(path.join(__dirname, 'daedalus.db'));

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS company_info (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT,
    tagline TEXT,
    hero_headline TEXT,
    hero_subtext TEXT,
    founder_name TEXT,
    founder_role TEXT,
    founder_bio TEXT,
    founder_portfolio_url TEXT,
    founder_image_url TEXT,
    instagram_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contact_location TEXT
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    icon TEXT,
    title TEXT,
    description TEXT,
    deliverables TEXT
  );

  CREATE TABLE IF NOT EXISTS agency_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    description TEXT,
    image_url TEXT,
    live_url TEXT,
    client_name TEXT
  );
`);

// 1. Seed Default Admin if missing (admin / daedalus2026)
const adminExists = db.prepare('SELECT id FROM admin WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('daedalus2026', 10);
  db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run('admin', hash);
}

// 2. Seed Default Company & Founder Data
const infoExists = db.prepare('SELECT id FROM company_info WHERE id = 1').get();
if (!infoExists) {
  db.prepare(`
    INSERT INTO company_info (
      id, company_name, tagline, hero_headline, hero_subtext,
      founder_name, founder_role, founder_bio, founder_portfolio_url,
      founder_image_url, instagram_url, contact_email, contact_phone, contact_location
    ) VALUES (
      1,
      'Daedalus & Co.',
      'Precision Artificial Intelligence, High-Performance Software & Heuristic Systems',
      'Architecting Next-Generation Digital Systems & AI Engineering Solutions',
      'At Daedalus & Co., we engineer mission-critical computational software, custom machine learning pipelines, and bespoke enterprise web experiences that bridge complex algorithms with commercial impact.',
      'M. Rohaan Zahid',
      'Founder, Chief Systems Architect & AI Engineer',
      'Artificial Intelligence undergraduate at Sir Syed CASE Institute of Technology specializing in predictive machine learning pipelines, heuristic route optimization, and full-stack software development. Dedicated to building reliable, high-performance architectures.',
      'https://rohaanzahid.space',
      'https://i.postimg.cc/P5FzQ0S9/mypic.jpg',
      'https://www.instagram.com/daedalus_.co',
      'rohaanzahid.04@gmail.com',
      '+92 333 8705793',
      'Islamabad, Pakistan'
    )
  `).run();
}

// 3. Seed Default Services if empty
const serviceCount = db.prepare('SELECT count(*) as count FROM services').get().count;
if (serviceCount === 0) {
  const insertService = db.prepare('INSERT INTO services (icon, title, description, deliverables) VALUES (?, ?, ?, ?)');
  insertService.run(
    '🤖',
    'Applied Artificial Intelligence & ML Pipelines',
    'Custom algorithmic models, feature engineering, predictive data scoring, automated classification, and neural pipelines tailored to domain datasets.',
    'Scikit-learn, Python, Automation Engines, Model Tuning'
  );
  insertService.run(
    '⚡',
    'High-Velocity Full-Stack Web Architecture',
    'High-performance, dynamic platforms powered by modern responsive interfaces, rock-solid APIs, custom SQLite/PostgreSQL datastores, and zero-latency caching.',
    'Node.js, Express, SQLite, Responsive UI, Micro-services'
  );
  insertService.run(
    '🛡️',
    'Enterprise Software & Core C++ Systems',
    'Robust desktop, mathematical modeling, algorithmic route optimization, and resource scheduling engines engineered for high stability and security.',
    'Object-Oriented C++, Heuristic Routing, Clean Database Schemes'
  );
}

// 4. Seed Default Showcase Projects if empty
const projCount = db.prepare('SELECT count(*) as count FROM agency_projects').get().count;
if (projCount === 0) {
  const insertProj = db.prepare('INSERT INTO agency_projects (title, category, description, image_url, live_url, client_name) VALUES (?, ?, ?, ?, ?, ?)');
  insertProj.run(
    'AI Route Optimization Engine',
    'Machine Learning / Systems',
    'Real-time heuristic path allocation engine calculating low-cost transport routes using machine learning algorithms.',
    '',
    'https://github.com/Rohaanrz05/Smart-Route-detection-system',
    'Autonomous Logistics'
  );
  insertProj.run(
    'Enterprise Aviation Reservation Infrastructure',
    'C++ Core Software',
    'High-reliability seat reservation, passenger scheduling, and automated boarding ticket verification framework.',
    '',
    'https://github.com/Rohaanrz05/airline-reservation-system-',
    'Aerospace Systems'
  );
  insertProj.run(
    'Daedalus Historical Portal & Archives',
    'Web Architecture',
    'Digital publication and historical archival engine serving high-traffic reader engagements and scholarly reviews.',
    '',
    'https://books.rohaanzahid.space',
    'Academic Publishing'
  );
}

module.exports = db;