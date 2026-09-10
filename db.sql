-- CREATE DATABASE IF NOT EXISTS surfera;

-- CREATE TABLE IF NOT EXISTS users (
--    user_id UUID DEFAULT uuidv7() PRIMARY KEY,
--    name VARCHAR(150) NOT NULL,
--    email VARCHAR(200) NOT NULL UNIQUE,
--    password VARCHAR(255) NOT NULL,
--    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );


CREATE TYPE booking_status AS ENUM ('Confirmed', 'Cancelled', 'Refunded');
CREATE TYPE room_tier AS ENUM ('Shared room', 'Private room', 'Couple package');

CREATE TABLE IF NOT EXISTS camps (
   camp_id SERIAL PRIMARY KEY,
   start_date DATE NOT NULL,
   end_date DATE NOT NULL,

   CONSTRAINT chk_dates CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS camp_room_pricing (
   pricing_id SERIAL PRIMARY KEY,
   camp_id INT NOT NULL REFERENCES camps(camp_id) ON DELETE CASCADE,
   room_type room_tier NOT NULL,
   price_eur NUMERIC(6, 2) NOT NULL,
   total_slots INT NOT NULL DEFAULT 10,
   booked_slots INT NOT NULL DEFAULT 0,

   UNIQUE(camp_id, room_type),
   CONSTRAINT chk_slots CHECK (total_slots >= booked_slots)

);

CREATE TABLE IF NOT EXISTS campers (
   camper_id SERIAL PRIMARY KEY,
   name VARCHAR(50) NOT NULL,
   email VARCHAR(200) UNIQUE NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
   reservation_id SERIAL PRIMARY KEY,
   camper_id INT NOT NULL REFERENCES campers(camper_id) ON DELETE RESTRICT,
   camp_id INT NOT NULL REFERENCES camps(camp_id) ON DELETE RESTRICT,
   pricing_id INT NOT NULL REFERENCES camp_room_pricing(pricing_id) ON DELETE RESTRICT,
   status booking_status NOT NULL DEFAULT 'Confirmed',
   amount_due NUMERIC(6, 2) NOT NULL,
   note TEXT,
   reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);