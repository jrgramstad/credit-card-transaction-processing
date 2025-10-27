-- Properties Table
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories Table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cardholders Table
CREATE TABLE cardholders (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  card_last_4 TEXT NOT NULL,
  role TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  posted_date DATE NOT NULL,
  transaction_date DATE,
  source TEXT NOT NULL, -- 'Capital One' or 'Home Depot'
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  property TEXT,
  category TEXT,
  cardholder_name TEXT,
  card_last_4 TEXT,
  order_number TEXT,
  store_location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed Data for Properties
INSERT INTO properties (name, active, sort_order) VALUES
('Chatham Forney', TRUE, 1),
('Emerson Forney', TRUE, 2),
('Grove Richardson', TRUE, 3),
('Nelson Denison', TRUE, 4),
('Angelina', TRUE, 5),
('Pemrose', TRUE, 6),
('Woodbrook', TRUE, 7),
('Winter Park', TRUE, 8),
('Melanie', TRUE, 9),
('Lemmon', TRUE, 10),
('Sydney', TRUE, 11),
('Oak Creek Hutchins', TRUE, 12),
('Weston', TRUE, 13),
('Ash Hill', TRUE, 14),
('Santa Fe Farmersville', TRUE, 15),
('Sleeth', TRUE, 16),
('Chapman Lancaster', TRUE, 17),
('Office', TRUE, 97),
('Maintenance', TRUE, 98),
('Other', TRUE, 99);

-- Seed Data for Categories
INSERT INTO categories (name, active, sort_order) VALUES
('Gas/Automotive', TRUE, 1),
('Job Supplies', TRUE, 2),
('Storage', TRUE, 3),
('Utilities', TRUE, 4),
('Fraudulent charge', TRUE, 5),
('Office Supplies', TRUE, 6),
('Cleaning', TRUE, 7),
('Pest Control', TRUE, 8),
('Mowing', TRUE, 9),
('Maintenance Task', TRUE, 10),
('Other', TRUE, 99);

-- Seed Data for Cardholders
INSERT INTO cardholders (full_name, card_last_4, role, active) VALUES
('Ashley Gramstad', '5757', 'Owner', TRUE),
('Jessica', '8622', 'Back Office', TRUE),
('Thomas Tolbert', '6101', 'Project Manager', TRUE),
('Christian Rojas', '3891', 'Operations', TRUE),
('Elijah', '3876', 'Staff', TRUE),
('Ryder Holliman', '0000', 'Crew Leader', TRUE),
('Omar Martinez', '0000', 'Maintenance', TRUE),
('Kalen Bates', '0000', 'Property Manager', TRUE),
('Unknown', '0000', 'Unknown', TRUE);
