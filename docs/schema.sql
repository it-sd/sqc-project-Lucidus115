\encoding UTF8

DROP TABLE IF EXISTS user_account;
DROP TABLE IF EXISTS project;

CREATE TABLE user_account (
  id SERIAL PRIMARY KEY,
  username VARCHAR(25) NOT NULL,
  password TEXT NOT NULL,
  email VARCHAR(254) NOT NULL,
  registered_date TIMESTAMP NOT NULL,
  projects INT[]
)

CREATE TABLE project (
  id SERIAL PRIMARY KEY,
  title VARCHAR(25) NOT NULL,
  date_created TIMESTAMP NOT NULL,
  date_modified TIMESTAMP NOT NULL,
  sound_data TEXT NOT NULL,
  user_id INT NOT NULL
)

INSERT INTO user (username, password, email, registered_date, projects) VALUES
  ('TestUser', 'password', 'notareal@email.bruh', 2023-02-20 12:12:12);