import 'dotenv/config';
import mysql from 'mysql2';

const sql = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

export async function getEventNameYear() {
    const result = await sql.query("SELECT id,name, start_year from Events order by start_year;");
    return result[0];
}

export async function getGenres(){
    const result = await sql.query("SELECT DISTINCT genre from Event_Genres order by genre;");
    return result[0];
}

export async function getRegions(){
    const result = await sql.query("SELECT DISTINCT region from Events order by region;");
    return result[0];
}

export async function addEvent(name, start_year, end_year, region, description) {
    const result = await sql.query(
        `insert into events (name, start_year, end_year, region, description) values (?,?,?,?,?)`,
        [name, start_year, end_year, region, description]
        )
    console.log(result[0]);
    return result[0];
}

export async function addRef(ref, watched, event_id){
    const result = await sql.query(`INSERT INTO Event_References (ref, watched, event_id) VALUES (?,?,?)`,[ref, watched, event_id]);
    return result[0];
}

export async function addGenre(genre, event_id){
    const result = await sql.query(`INSERT INTO Event_Genres (genre,event_id) VALUES (?,?)`,[genre, event_id]);
    return result[0];
}

export async function getEventsByRegion(region){
    const result = await sql.query(`SELECT id, name, start_year from Events where region = ? order by start_year`,[region]);
    // console.log(result[0]);
    return result[0];
}

export async function getEventsByGenre(genre){
    const result = await sql.query(
        `SELECT e.id, e.name, e.start_year from Events as e
        JOIN Event_Genres as eg ON e.id = eg.event_id
        WHERE eg.genre = ?
        ORDER BY e.start_year`,
        [genre]
    );
    return result[0];
}

export async function getEventById(id){
    const result = await sql.query(`SELECT id, name, start_year, end_year, region, description FROM Events where id = ? `,[id]);
    console.log(result[0]);
    return result[0];
}

export async function getGenresById(id){
    const result = await sql.query(`SELECT genre, genre_id FROM Event_Genres where event_id = ? `,[id]);
    console.log(result[0]);
    return result[0];
}

export async function getReferencesById(id){
    const result = await sql.query(`SELECT ref, watched FROM Event_References where event_id = ? `,[id]);
    console.log(result[0]);
    return result[0];
}

export async function updateEvent(name, start_year, end_year, region, description, id){
    const result = await sql.query(`UPDATE Events SET name = ?, start_year = ?, end_year = ?, region = ?, description = ?  WHERE id = ?`,[name, start_year, end_year, region, description, id]);
    console.log(result[0]);
    return result[0];
}

export async function updateRef(ref,watched,event_id){
    const result = await sql.query(`UPDATE Event_References SET ref = ?, watched = ? WHERE event_id = ?`,[ref,watched,event_id]);
    console.log(result[0]);
    return result[0];
}

export async function updateGenre(genre, event_id) {
    const results = []; // To store results for each genre operation
    if(genre && genre.trim() !== '') {
        const genres = genre.split(',');

        for (let i = 0; i < genres.length; i++) {
            const genreName = genres[i].trim(); // Trim whitespace if needed
            // Use upsert logic
            const result = await sql.query(`
            INSERT INTO Event_Genres (event_id, genre)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE genre = ?
        `, [event_id, genreName, genreName]);

            results.push(result);
        }
    }

    return results;
}

export async function deleteEventIdFromGenre(event_id){
    const result = await sql.query(`DELETE FROM Event_Genres where event_id =?;`,[event_id]);
    console.log(result[0]);
    return result[0];
}

export async function deleteEventIdFromRef(event_id){
    const result = await sql.query(`DELETE FROM Event_References where event_id =?;`,[event_id]);
    console.log(result[0]);
    return result[0];
}

export async function deleteEventFromEvents(id){
    const result = await sql.query(`DELETE FROM Events where id =?;`,[id]);
    console.log(result[0]);
    return result[0];
}

export async function deleteGenreById(id){
    const result = await sql.query(`DELETE FROM Event_Genres where genre_id =?;`,[id]);
    console.log(result[0]);
    return result[0];
}








