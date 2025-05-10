/**
 * Javascript file for all the event listeners like content load, click of button, change of dropdown selection
 */

// On DOM load, ie event listener when we hit the url http://localhost:3000/
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // // Get all the events from API call POST /events
        // const data = await getEvents();
        //
        // // Populate table
        // await populateTable(data.event_name_year);
        // // Populate Genre and Region Dropdown
        // populateGenreListInDropdown(data.genres);
        // populateRegionListInDropdown(data.regions);

        await populatePageContent();

    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        document.getElementById('response').textContent = 'Error fetching data';
    }
});

// Select genre from dropdown (action), so that we get event name and start year of selected genre
document.getElementById('genre').addEventListener('change', async (genre) => {
    // console.log(genre.target.value);
    const response = await getEventsByGenre(genre.target.value);
    await populateTable(response.event_name_year_by_genre);
})

// Select region from dropdown (action), so that we get event name and start year of selected region
document.getElementById('region').addEventListener('change', async (region) => {
    console.log(region.target.value);
    const response = await getEventsByRegion(region.target.value);
    await populateTable(response.event_name_year_by_region);
})

// Submit new event
document.getElementById('addNewEvent').addEventListener('click', async () => {
    const newEventDetails = {
        'name' : document.getElementById('addEventName').value || '',
        'start_year' : document.getElementById('addStartYear').value || null,
        'end_year' : document.getElementById('addEndYear').value || null,
        'region' : document.getElementById('addRegion').value || '',
        'description' : document.getElementById('addDescription').value || '',
        'genre' : document.getElementById('addGenre').value || '',
        'watched' : false,
    };
    console.log("newEventDetails: ", newEventDetails);
    await addNewEvent(newEventDetails);
    await populatePageContent();
})

// Action on clicking edit_event button
document.getElementById("edit_event").addEventListener('click', async(event) => {
    console.log(event.target.value);
    const data = await getEventDetailsById(event.target.value);
    populateEditPopUp(data, event.target.value);
})

// Save events after edit
document.getElementById("save_button").addEventListener('click', async(event) => {
    const eventId = event.target.value;
    console.log(eventId);
    const fetchedEventDetails = await fetchUpdatedEventDetails(eventId);
    await updateEvent(fetchedEventDetails, eventId);
    await populatePageContent();
})

document.getElementById('delete_event').addEventListener('click', async (event) => {
    console.log(event.target.value);
    const response = await deleteEventById(event.target.value);  // event.target.value this has event id fetched from above code which is document.getElementById("delete_event").value = event.target.id;
    console.log(response);

   await populatePageContent();

});

// Add event listener for click on delete links (event delegation)
document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete_genre')) {
        event.preventDefault(); // Prevent default anchor behavior
        const genreId = event.target.getAttribute('data-genre-id');
        console.log('Genre ID to delete:', genreId);
        // Call your delete function here
        await deleteGenre(genreId);

        const eventID = document.getElementById("edit_event").value
        const data = await getEventDetailsById(eventID);
        populateEditPopUp(data, eventID);
    }
});

async function fetchUpdatedEventDetails(id){
    const fetchedValues = {
        'name' : document.getElementById('editEventName').value || '',
        'start_year' : document.getElementById('editStartYear').value || null,
        'end_year' : document.getElementById('editEndYear').value || null,
        'region' : document.getElementById('editRegion').value || '',
        'description' : document.getElementById('editDescription').value || '',
        'watched': false,
    };

    if (document.getElementById('editGenres').value.trim() !== '') {
        fetchedValues.genre = document.getElementById('editGenres').value.trim();
    }

    // if (document.getElementById('editRef').value.trim() !== '') {
    //     fetchedValues.ref = document.getElementById('editRef').value.trim();
    // }

    console.log(fetchedValues);
    return fetchedValues;
}

async function populatePageContent() {
    // Get all the events from API call POST /events
    const data = await getEvents();

    // Populate table
    await populateTable(data.event_name_year);
    // Populate Genre and Region Dropdown
    populateGenreListInDropdown(data.genres);
    populateRegionListInDropdown(data.regions);
}
