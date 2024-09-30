import express from 'express';
import {
    addEvent,
    addGenre,
    addRef,
    deleteEventFromEvents,
    deleteEventIdFromGenre,
    deleteEventIdFromRef,
    deleteGenreById,
    getEventById,
    getEventNameYear,
    getEventsByGenre,
    getEventsByRegion,
    getGenres,
    getGenresById,
    getReferencesById,
    getRegions,
    updateEvent,
    updateGenre,
    updateRef
} from "../models/database.js";

const router = express.Router();

// Home Route
router.get('/', async function(req,res){
    res.render('home.ejs');
});


// Get all events, genres and regions
router.get('/events', async function (req,res) {
    const event_name_year = await getEventNameYear();

    const genres = await getGenres();
    const regions = await getRegions();

    genres.unshift({
        "genre": "All"
    });

    regions.unshift({
        "region": "All"
    });

    const result = {
        "event_name_year" : event_name_year,
        "genres" : genres,
        "regions" : regions
    };
    res.send(result);
});

// Add new event details
router.post('/events', async function(req,res){
    const { name, start_year, end_year, region, description, ref, watched, genre } = req.body
    const add_event = await addEvent(name, start_year, end_year, region, description);

    const event_id = add_event.insertId;
    const add_ref = await addRef(ref, watched, event_id);
    const add_genre = await addGenre(genre,event_id);

    const result = {
        "add_event" : add_event,
        "add_ref" : add_ref,
        "add_genre" : add_genre
    }
    res.send(result);
})

// API to get all events for the selected region
router.get('/region/:region', async function(req, res) {
    const event_name_year_by_region = await getEventsByRegion(req.param('region'));
    const result = {
        "event_name_year_by_region" : event_name_year_by_region
    };
    res.send(result);
});

// API to get all events for the selected genre
router.get('/genre/:genre', async function(req, res) {
    const genre = req.param('genre');
    const event_name_year_by_genre = await getEventsByGenre(genre);
    const result = {
        "event_name_year_by_genre" : event_name_year_by_genre
    };
    res.send(result);
});

// Get event details for a given event id
router.get('/event/:id', async function(req,res){
    const id = req.param('id');
    const event_details = await getEventById(id);
    const genres = await getGenresById(id);
    const references = await getReferencesById(id);
    const result = {
        "event_details" : event_details,
        "genres" : genres,
        "references" : references
    }
    res.send(result);
})

// Update event details for a given event id
router.post('/event/:id', async function(req,res){
    const id = req.param('id');
    const { name, start_year, end_year, region, description, ref, watched, genre } = req.body

    const update_event = await updateEvent(name, start_year, end_year, region, description, id);
    const update_ref = await updateRef(ref, watched, id);
    const update_genre = await updateGenre(genre,id);

    const result = {
        "update_event" : update_event,
        "update_ref" : update_ref,
        "update_genre" : update_genre
    }
    res.send(result);
})

// Delete event details for a given event id
router.delete('/event/:id', async function(req,res){
    const id = req.param('id');
    const delete_event_id_from_genre = await deleteEventIdFromGenre(id);
    const delete_event_id_from_ref = await deleteEventIdFromRef(id);
    const delete_id_from_events = await deleteEventFromEvents(id);
    const result = {
        "delete_event_id_from_genre" : delete_event_id_from_genre,
        "delete_event_id_from_ref" : delete_event_id_from_ref,
        "delete_id_from_events" : delete_id_from_events
    }
    res.send(result);
})

// Delete event details for a given event id
router.delete('/genre/:id', async function(req,res){
    const id = req.param('id');
    const result = await deleteGenreById(id);

    res.send(result);
})

export default router;