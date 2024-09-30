CREATE DATABASE Historic_Milestones;
USE Historic_Milestones;
CREATE TABLE Events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(500) NOT NULL,
    end_year INT,
    region VARCHAR(100),
    brief_description VARCHAR(5000),
    watched BOOLEAN
);
CREATE TABLE Event_References (
    ref_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT,
    ref VARCHAR(1000),
    FOREIGN KEY (event_id)
        REFERENCES Events (id)
);

CREATE TABLE Event_Genres (
    genre_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT,
    genre VARCHAR(1000),
    FOREIGN KEY (event_id)
        REFERENCES Events (id)
);

-- Example events
INSERT INTO Events (name, end_year, region, brief_description, watched) VALUES
('Moon Landing', 1969, 'Global', 'The first manned moon landing by Apollo 11.', FALSE),
('Fall of the Berlin Wall', 1989, 'Europe', 'The fall of the Berlin Wall, marking the end of the Cold War.', FALSE),
('Invention of the Internet', 1990, 'Global', 'The invention and popularization of the Internet.', FALSE),
('Signing of the Magna Carta', 1215, 'Europe', 'The signing of the Magna Carta in England.', FALSE),
('Discovery of Penicillin', 1928, 'Europe', 'The discovery of penicillin by Alexander Fleming.', FALSE);

INSERT INTO Event_References (event_id, ref) VALUES
(1, 'https://www.nasa.gov/mission_pages/apollo/missions/apollo11.html'),
(2, 'https://www.history.com/topics/cold-war/berlin-wall'),
(3, 'https://www.internetsociety.org/internet/history-internet/'),
(4, 'https://www.history.com/topics/british-history/magna-carta'),
(5, 'https://www.nobelprize.org/prizes/medicine/1945/fleming/biographical/');

INSERT INTO Event_Genres (event_id, genre) VALUES
(1, 'Space Exploration'),
(2, 'Political Change'),
(3, 'Technology'),
(4, 'Historical Document'),
(5, 'Medical Discovery');




                    

