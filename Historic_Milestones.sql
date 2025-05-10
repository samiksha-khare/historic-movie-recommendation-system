CREATE DATABASE Historic_Milestones;
USE Historic_Milestones;
CREATE TABLE Events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(500) NOT NULL,
    start_year INT,
    end_year INT,
    region VARCHAR(100),
    description VARCHAR(5000),
    created TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Event_References (
    ref_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT,
    ref VARCHAR(1000),
    watched BOOLEAN DEFAULT FALSE,
    created TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (event_id)
        REFERENCES Events (id)
);

CREATE TABLE Event_Genres (
    genre_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT,
    genre VARCHAR(1000),
    created TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (event_id)
        REFERENCES Events (id)
);


INSERT INTO Events (name, start_year, end_year, region, description) VALUES
('The Renaissance', 1300, 1600, 'Europe', 'A period of revival in art, literature, and learning.'),
('The Reformation', 1517, 1648, 'Europe', 'A movement for religious reform leading to the creation of Protestantism.'),
('The Enlightenment', 1715, 1789, 'Europe', 'Intellectual movement emphasizing reason and individualism.'),
('The Industrial Revolution', 1760, 1840, 'Europe', 'Transition to new manufacturing processes.'),
('American Revolution', 1775, 1783, 'North America', 'War of independence by the American colonies against Britain.'),
('French Revolution', 1789, 1799, 'Europe', 'A period of radical social and political change in France.'),
('Napoleonic Wars', 1803, 1815, 'Europe', 'Series of major conflicts involving Napoleon''s French Empire.'),
('Mexican War of Independence', 1810, 1821, 'North America', 'Mexico''s war for independence from Spanish rule.'),
('The Great Famine', 1845, 1852, 'Europe', 'A period of mass starvation in Ireland.'),
('American Civil War', 1861, 1865, 'North America', 'Conflict between Northern and Southern states of the USA.'),
('Meiji Restoration', 1868, 1912, 'Asia', 'Period of rapid modernization and industrialization in Japan.'),
('Unification of Germany', 1871, 1871, 'Europe', 'The process of consolidating various German states into a single nation.'),
('Spanish-American War', 1898, 1898, 'North America', 'Conflict between the USA and Spain, leading to the end of Spanish colonial rule in the Americas.'),
('World War I', 1914, 1918, 'Global', 'A global war originating in Europe.'),
('Russian Revolution', 1917, 1923, 'Europe', 'Series of revolutions leading to the establishment of the Soviet Union.'),
('Treaty of Versailles', 1919, 1919, 'Europe', 'Treaty that ended World War I and redrew European borders.'),
('The Great Depression', 1929, 1939, 'Global', 'A severe worldwide economic depression.'),
('World War II', 1939, 1945, 'Global', 'A global conflict involving most of the world''s nations.'),
('United Nations Formation', 1945, 1945, 'Global', 'Establishment of an international organization to promote peace.'),
('Indian Independence', 1947, 1947, 'Asia', 'India''s independence from British rule.'),
('Chinese Civil War', 1927, 1949, 'Asia', 'Conflict between the Chinese Nationalist Party and the Communist Party.'),
('Korean War', 1950, 1953, 'Asia', 'Conflict between North Korea and South Korea.'),
('Cuban Revolution', 1953, 1959, 'North America', 'Armed revolt led by Fidel Castro against the Cuban government.'),
('Civil Rights Movement', 1954, 1968, 'North America', 'Movement to end racial discrimination in the USA.'),
('Vietnam War', 1955, 1975, 'Asia', 'Conflict between communist North Vietnam and non-communist South Vietnam.'),
('Cuban Missile Crisis', 1962, 1962, 'North America', 'A 13-day confrontation between the USA and the Soviet Union over missiles in Cuba.'),
('Apollo 11 Moon Landing', 1969, 1969, 'Global', 'The first manned mission to land on the Moon.'),
('Fall of Saigon', 1975, 1975, 'Asia', 'Marked the end of the Vietnam War and the start of reunification.'),
('Iranian Revolution', 1978, 1979, 'Asia', 'Overthrow of Iran''s monarchy and establishment of an Islamic republic.'),
('Fall of the Berlin Wall', 1989, 1989, 'Europe', 'Event symbolizing the end of the Cold War and division of Germany.'),
('Dissolution of the USSR', 1991, 1991, 'Europe/Asia', 'The breakup of the Soviet Union into independent states.'),
('Rwandan Genocide', 1994, 1994, 'Africa', 'Mass murder of Tutsi by Hutu extremists in Rwanda.'),
('End of Apartheid', 1994, 1994, 'Africa', 'The end of racial segregation policies in South Africa.'),
('September 11 Attacks', 2001, 2001, 'North America', 'Terrorist attacks on the USA.'),
('War in Afghanistan', 2001, 2021, 'Asia', 'Conflict following the 9/11 attacks, targeting Al-Qaeda and Taliban.'),
('Iraq War', 2003, 2011, 'Asia', 'Invasion of Iraq by a coalition led by the USA.'),
('Global Financial Crisis', 2007, 2009, 'Global', 'Severe worldwide economic crisis.'),
('Arab Spring', 2010, 2012, 'Middle East/North Africa', 'Series of pro-democracy uprisings.'),
('Syrian Civil War', 2011, NULL, 'Asia', 'Ongoing conflict in Syria.'),
('Brexit', 2016, 2020, 'Europe', 'The United Kingdom''s withdrawal from the European Union.'),
('COVID-19 Pandemic', 2019, NULL, 'Global', 'Global pandemic caused by the coronavirus SARS-CoV-2.'),
('Black Death', 1347, 1351, 'Europe', 'A devastating global epidemic of bubonic plague.'),
('Thirty Years'' War', 1618, 1648, 'Europe', 'A series of wars fought in Central Europe.'),
('Glorious Revolution', 1688, 1689, 'Europe', 'The overthrow of King James II of England.'),
('Seven Years'' War', 1756, 1763, 'Global', 'A global conflict known as the first "world war".'),
('Haitian Revolution', 1791, 1804, 'Caribbean', 'Successful anti-slavery and anti-colonial insurrection in Haiti.'),
('Louisiana Purchase', 1803, 1803, 'North America', 'Acquisition of French territory by the USA.'),
('War of 1812', 1812, 1815, 'North America', 'Conflict between the USA and Britain.'),
('Taiping Rebellion', 1850, 1864, 'Asia', 'Massive civil war in southern China.'),
('Unification of Italy', 1848, 1871, 'Europe', 'The process of consolidating Italian states into a single nation.'),
('Boxer Rebellion', 1899, 1901, 'Asia', 'Anti-foreigner uprising in China.'),
('Russo-Japanese War', 1904, 1905, 'Asia', 'Conflict between Russia and Japan over imperial ambitions.'),
('Suez Crisis', 1956, 1956, 'Middle East', 'Invasion of Egypt by Israel, followed by the UK and France.'),
('Prague Spring', 1968, 1968, 'Europe', 'Period of political liberalization in Czechoslovakia.');

-- Populate Event_Genres with sample data
INSERT INTO Event_Genres (event_id, genre) VALUES
(1, 'Art'),
(1, 'Literature'),
(1, 'Philosophy'),
(2, 'Religion'),
(2, 'Social Movement'),
(3, 'Philosophy'),
(3, 'Science'),
(4, 'Industry'),
(4, 'Technology'),
(5, 'War'),
(5, 'Politics'),
(6, 'Politics'),
(6, 'Social Movement'),
(7, 'War'),
(7, 'Politics'),
(8, 'War'),
(8, 'Politics'),
(9, 'Social Crisis'),
(10, 'War'),
(10, 'Politics'),
(11, 'Politics'),
(11, 'Industry'),
(12, 'Politics'),
(13, 'War'),
(13, 'Politics'),
(14, 'War'),
(15, 'Politics'),
(15, 'Social Movement'),
(16, 'Politics'),
(17, 'Economics'),
(17, 'Social Crisis'),
(18, 'War'),
(19, 'Politics'),
(19, 'International Relations'),
(20, 'Politics'),
(21, 'War'),
(21, 'Politics'),
(22, 'War'),
(22, 'Politics'),
(23, 'Politics'),
(23, 'Social Movement'),
(24, 'War'),
(24, 'Politics'),
(25, 'Politics'),
(25, 'International Relations'),
(26, 'Science'),
(26, 'Technology'),
(27, 'War'),
(27, 'Politics'),
(28, 'Politics'),
(28, 'Social Movement'),
(29, 'Politics'),
(30, 'Politics'),
(31, 'Social Crisis'),
(32, 'Politics'),
(32, 'Social Movement'),
(33, 'Terrorism'),
(33, 'Politics'),
(34, 'War'),
(34, 'Politics'),
(35, 'War'),
(35, 'Politics'),
(36, 'Economics'),
(36, 'Social Crisis'),
(37, 'Politics'),
(37, 'Social Movement'),
(38, 'War'),
(38, 'Politics'),
(39, 'Politics'),
(40, 'Health'),
(40, 'Social Crisis'),
(41, 'Health'),
(41, 'Social Crisis'),
(42, 'War'),
(42, 'Politics'),
(43, 'Politics'),
(44, 'War'),
(44, 'Politics'),
(45, 'War'),
(45, 'Social Movement'),
(46, 'Politics'),
(46, 'Expansion'),
(47, 'War'),
(47, 'Politics'),
(48, 'War'),
(48, 'Social Movement'),
(49, 'Politics'),
(50, 'War'),
(50, 'Social Movement');

-- Populate Event_References with sample data
INSERT INTO Event_References (event_id, ref) VALUES
(1, 'https://www.britannica.com/event/Renaissance'),
(2, 'https://www.history.com/topics/reformation'),
(3, 'https://www.history.com/topics/enlightenment'),
(4, 'https://www.history.com/topics/industrial-revolution'),
(5, 'https://www.history.com/topics/american-revolution'),
(6, 'https://www.history.com/topics/french-revolution'),
(7, 'https://www.britannica.com/event/Napoleonic-Wars'),
(8, 'https://www.britannica.com/event/Mexican-War-of-Independence'),
(9, 'https://www.history.com/topics/irish-potato-famine'),
(10, 'https://www.history.com/topics/american-civil-war'),
(11, 'https://www.britannica.com/event/Meiji-Restoration'),
(12, 'https://www.britannica.com/event/Unification-of-Germany'),
(13, 'https://www.history.com/topics/spanish-american-war'),
(14, 'https://www.history.com/topics/world-war-i'),
(15, 'https://www.history.com/topics/russian-revolution'),
(16, 'https://www.history.com/topics/world-war-i/treaty-of-versailles'),
(17, 'https://www.history.com/topics/great-depression'),
(18, 'https://www.history.com/topics/world-war-ii'),
(19, 'https://www.un.org/en/about-us/history-of-the-un'),
(20, 'https://www.history.com/topics/india/india-independence'),
(21, 'https://www.history.com/topics/china/chinese-civil-war'),
(22, 'https://www.history.com/topics/korean-war'),
(23, 'https://www.history.com/topics/cold-war/cuban-revolution'),
(24, 'https://www.history.com/topics/civil-rights-movement'),
(25, 'https://www.history.com/topics/vietnam-war'),
(26, 'https://www.history.com/topics/cold-war/cuban-missile-crisis'),
(27, 'https://www.history.com/topics/space-exploration/moon-landing-1969'),
(28, 'https://www.history.com/topics/vietnam-war/fall-of-saigon'),
(29, 'https://www.history.com/topics/middle-east/iranian-revolution'),
(30, 'https://www.history.com/topics/cold-war/berlin-wall'),
(31, 'https://www.history.com/topics/russia/ussr-dissolution'),
(32, 'https://www.history.com/topics/rwanda/rwanda-genocide'),
(33, 'https://www.history.com/topics/africa/apartheid'),
(34, 'https://www.history.com/topics/21st-century/9-11-attacks'),
(35, 'https://www.history.com/topics/21st-century/war-in-afghanistan'),
(36, 'https://www.history.com/topics/21st-century/iraq-war'),
(37, 'https://www.history.com/topics/21st-century/2008-financial-crisis'),
(38, 'https://www.history.com/topics/middle-east/arab-spring'),
(39, 'https://www.history.com/topics/middle-east/syrian-civil-war'),
(40, 'https://www.history.com/topics/brexit'),
(41, 'https://www.history.com/topics/21st-century/pandemics-timeline'),
(42, 'https://www.history.com/topics/black-death'),
(43, 'https://www.history.com/topics/war/thirty-years-war'),
(44, 'https://www.history.com/topics/british-history/glorious-revolution'),
(45, 'https://www.history.com/topics/war/seven-years-war'),
(46, 'https://www.history.com/topics/caribbean/haitian-revolution'),
(47, 'https://www.history.com/topics/westward-expansion/louisiana-purchase'),
(48, 'https://www.history.com/topics/war-of-1812'),
(49, 'https://www.history.com/topics/china/taiping-rebellion'),
(50, 'https://www.history.com/topics/italian-unification');


select * from Events;
-- id, name, sy
SELECT id,name, start_year from Events order by start_year;

-- genre
SELECT DISTINCT genre from Event_Genres order by genre;

-- region
SELECT DISTINCT region from Events order by region;

SELECT id, name, start_year from Events where region = "Europe";

SELECT e.id, e.name, e.start_year from Events as e
JOIN Event_Genres as eg ON e.id = eg.event_id
WHERE eg.genre = "War"
ORDER BY e.start_year;

UPDATE Event_Genres SET genre = 'War' WHERE genre = 'Space Exploration';


-- drop table Events;
-- drop table Event_References;
-- drop table Event_Genres;
select * from Events where name = "";
delete from Events where name = ""; 

-- SELECT e.id, e.name, e.start_year, e.end_year, e.region, e.description, eg.genre, er.ref, er.watched FROM Events as e
-- JOIN Event_Genres as eg ON e.id = eg.event_id
-- JOIN Event_References as er ON e.id = er.event_id
-- where e.id =1;

SELECT id, name, start_year, end_year, region, description FROM Events where id =60;
SELECT genre FROM Event_Genres where event_id =1;
SELECT ref, watched FROM Event_References where event_id=60;

UPDATE Events SET name = 'GaSa', start_year=2000, end_year= null, region='India', description='love love' WHERE id =60;
UPDATE Event_References SET ref = 'http', watched = True WHERE event_id=60;
UPDATE Event_Genres SET genre = 'Romanace' WHERE event_id=60; 
 
INSERT INTO Event_References (event_id,ref, watched) VALUES (69,'https://www.britannica.com/event/Renaissance', False) ;
INSERT INTO Event_References (event_id,ref, watched) VALUES (69,'https://test', True) ;


-- DELETE FROM Event_Genres where event_id =72;
-- DELETE FROM Event_References where event_id=69;
-- DELETE FROM Events where id =72;

Select * from Event_References where ref=' ';
select * from Event_References where  watched = True ;
Select * from Event_Genres where genre='';
Select * from Event_Genres where genre_id>=100;
DELETE FROM Event_Genres where genre_id>=100;

UPDATE Event_Genres SET genre = 'g' WHERE event_id = 62;





-- New changes
ALTER TABLE Event_Genres MODIFY genre VARCHAR(255);
ALTER TABLE Event_Genres ADD UNIQUE (event_id, genre);