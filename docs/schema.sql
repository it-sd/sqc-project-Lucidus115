\encoding UTF8

DROP TABLE IF EXISTS user_account;
DROP TABLE IF EXISTS project;

CREATE TABLE user_account (
  id SERIAL PRIMARY KEY,
  username VARCHAR(25) NOT NULL,
  password TEXT NOT NULL,
  email VARCHAR(254) NOT NULL,
  registered_date TIMESTAMP WITH TIME ZONE,
  projects INT[] NULL
);

CREATE TABLE project (
  id SERIAL PRIMARY KEY,
  title VARCHAR(25) NOT NULL,
  date_created TIMESTAMP WITH TIME ZONE,
  date_modified TIMESTAMP WITH TIME ZONE,
  sound_data TEXT NOT NULL,
  user_id INT NOT NULL
);

INSERT INTO user_account (username, password, email, registered_date)
  VALUES
  (
    'TestUser', 
    'password', 
    'notareal@email.bruh', 
    '2023-02-20 0:0:0+02'
  ),
  (
    'Autumn', 
    'thiswillbeencryptedl8r', 
    'alsonotareal@email.bruh', 
    '2023-02-20 12:34:56+02'
  ),  
  (
    'Aieee!!', 
    'qwerty', 
    'againnotareal@email.bruh', 
    '2023-02-22 05:06:07-04'
  );