/**
 * Javascript file to make all API calls
 */


/**
 * API call to /events to get all the milestone events
 * @returns {Promise<any>}
 */
async function getEvents() {
    const response = await fetch('/events');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
}

// call api (i.e goes to route. In this case it goes to '/genre/:genre' `--> /genre/${genre}`)
async function getEventsByGenre(genre) {
    try {
        const response = await fetch(`/genre/${genre}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        document.getElementById('response').textContent = 'Error fetching data';
    }
}

async function getEventsByRegion(region) {
    try {
        region = encodeURIComponent(region);
        const response = await fetch(`/region/${region}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        document.getElementById('response').textContent = 'Error fetching data';
    }
}

async function addNewEvent(newEventData) {
    try {
        const response = await fetch('/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEventData)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log("data: ", data);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        document.getElementById('response').textContent = 'Error fetching data';
    }
}

async function getEventDetailsById(id) {
    const response = await fetch(`/event/${id}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
}

async function deleteEventById(id) {
    const response = await fetch(`/event/${id}`, {
        method: 'DELETE'
    })
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
}

async function deleteGenre(id){
    const response = await fetch(`/genre/${id}`, {
        method: 'DELETE'
    })
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
}

async function updateEvent(eventDetails, eventId) {
    try {
        const response = await fetch(`/event/${eventId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventDetails)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log("data: ", data);

    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}