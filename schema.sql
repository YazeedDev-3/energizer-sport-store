-- Energizer Sport Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS energizersport;
USE energizersport;

CREATE TABLE IF NOT EXISTS users (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  password      VARCHAR(255)  NOT NULL,
  email         VARCHAR(191)  NOT NULL UNIQUE,
  role          ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS products (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(191)  NOT NULL UNIQUE,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  cata          TINYINT       NOT NULL,
  image         VARCHAR(255),
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS orders (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  total         DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  note          TEXT,
  payment_type  VARCHAR(50),
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ROW_FORMAT=DYNAMIC;

-- ====================
-- Seed Data
-- Plain-text passwords: both users use "password123"
-- ====================
INSERT IGNORE INTO users (username, password, email, role) VALUES
  ('user',  '$2b$10$5iyJwAG5Q8PSVPGn5v9g.eIwK6UUqV6UDMqmcayaVMJqINwFm4WO2', 'user@test.com',  'customer'),
  ('admin', '$2b$10$wlAwnQ/EQ0wWkHEoZ2fPle1hQ4KY5LvhFKt2t9H2le03k5X.aoFF6', 'admin@test.com', 'admin');

INSERT IGNORE INTO products (title, description, price, cata, image) VALUES
  ('Chocolate Protein', 'High quality whey protein with rich chocolate flavor. Supports muscle growth and recovery.', 199.00, 1, 'Chocolate_Protein.png'),
  ('Vanilla Protein',   'Smooth vanilla whey protein. Perfect post-workout shake for muscle recovery.',              199.00, 1, 'Vanilla_Protein.png'),
  ('Creatine',          'Pure creatine monohydrate. Increases strength, power, and muscle performance.',             30.00,  2, 'creatine.png'),
  ('Pre-Workout',       'Advanced pre-workout formula. Boosts energy, focus, and endurance during training.',        50.00,  3, 'pre-workout.png'),
  ('Vitamins',          'Daily multivitamin complex. Supports overall health and immune system.',                    45.00,  4, 'Vitamins.png'),
  ('Snack',     'Healthy snack. Great for on-the-go nutrition.',                               25.00,  5, 'snack.png'),
  ('Shaker',            'Premium quality shaker bottle. Leak-proof with measurement markings.',                     35.00,  5, 'shaker.png');
