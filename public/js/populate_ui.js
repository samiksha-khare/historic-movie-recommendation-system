// Populate all events in the table
async function populateTable(event_name_year) {
    const tableBody = document.querySelector('#eventsTable tbody');
    tableBody.innerHTML = ''; // Clear any existing rows

    for(let i=0; i < event_name_year.length; i++) {
        const row = document.createElement('tr');
        // getting the values and adding hyperlink inside <a> </a>
        row.innerHTML = `
                <td>${i+1}</td>
                <td> <a class="eventName" id="${event_name_year[i].id}" href="#"> ${event_name_year[i].name}</a></td>
                <td>${event_name_year[i].start_year}</td>
            `;
        tableBody.appendChild(row);
    }

    // Get information of the event, on clicking the hyperlink
    const eventNames = document.getElementsByClassName('eventName');
    for (let i=0; i < eventNames.length; i++) {
        eventNames[i].addEventListener('click', async (event) => {
            console.log('event: ', event.target.id);

            const response = await getEventDetailsById(event.target.id);
            console.log(response);
            document.getElementById("event_name").textContent = response.event_details[0].name;
            document.getElementById("event_start_year").textContent = response.event_details[0].start_year;
            document.getElementById("event_end_year").textContent = response.event_details[0].end_year;
            document.getElementById("event_region").textContent = response.event_details[0].region;
            document.getElementById("event_description").textContent = response.event_details[0].description;

            // to get multiple values of genres for given event id
            let genres = [];
            for (let j= 0; j < response.genres.length; j++) {
                genres.push(
                    {
                        genre: response.genres[j].genre,
                        genre_id: response.genres[j].genre_id,
                    }
                );
            }
            console.log("genres: ", genres);
            let genres_list = genres.map(genre => {
                return `<span>${genre.genre}</span>`;
            });

            // Create a comma-separated list
            // Update the inner HTML of the event_genres element
            document.getElementById("event_genres").innerHTML = genres_list.join(", ");

            document.getElementById('event_references').innerHTML = ''; // '' represents that everytime inner html is blank for that particular id
            console.log("response.references:", response.references);
            for (let j= 0; j < response.references.length; j++) {

                if(response.references[j].ref != null) {
                    const div = document.createElement('div');
                    const refHtml = `<a href="${response.references[j].ref}" target="_blank">${response.references[j].ref} </a>`; // target="_blank" -> open hyperlink in new tab

                    let watchedHtml = '';

                    if (response.references[j].watched === 1) {
                        watchedHtml = `<label class='watch_label'>Watched:</label><span>Yes</span></br>`;
                    }
                    else {
                        watchedHtml = `<label class='watch_label'>Watched:</label><span>No</span></br>`;
                    }

                    div.innerHTML = refHtml + watchedHtml;
                    document.getElementById("event_references").appendChild(div);
                }


            }

            document.getElementById("edit_event").value = event.target.id;
            document.getElementById("delete_event").value = event.target.id;
            $('#eventModal').modal('show');
        });
    }
}

function populateGenreListInDropdown(genres) {
    const dropdownGenre = document.getElementById('genre');
    // dropdownGenre.innerHTML = ''; // Clear any existing rows

    for(let i=0; i < genres.length; i++) {
        // if (genres[i].genre.trim() !== '') {
            const option = document.createElement('option');
            option.value = genres[i].genre;
            option.textContent = genres[i].genre;
            dropdownGenre.appendChild(option);
        // }
    }
}

function populateRegionListInDropdown(regions) {
    const dropdownRegion = document.getElementById('region');

    for(let i=0; i<regions.length; i++) {
        if (regions[i].region.trim() !== '') {
            const option = document.createElement('option');
            option.value = regions[i].region; // .region is to get value (e.g USA )from each object
            option.textContent = regions[i].region;
            dropdownRegion.appendChild(option);
        }
    }
}

function populateEditPopUp(data, eventID) {
    console.log(data);
    document.getElementById("editEventName").value = data.event_details[0].name;
    document.getElementById("editStartYear").value = data.event_details[0].start_year;
    document.getElementById("editEndYear").value = data.event_details[0].end_year;
    document.getElementById("editRegion").value = data.event_details[0].region;
    document.getElementById("editDescription").value = data.event_details[0].description;
    document.getElementById("editGenres").value = '';

    let genres = [];
    for (let j= 0; j < data.genres.length; j++) {
        genres.push(
            {
                genre: data.genres[j].genre,
                genre_id: data.genres[j].genre_id,
            }
        );
    }
    console.log("genres: ", genres);
    let genres_list = genres.map(genre => {
        console.log(genre.genre);
        return `
            <li>${genre.genre}<a class="delete_genre" data-genre-id="${genre.genre_id}"href="#"> X </a></li> 
    `;
    });
    console.log("genres_list: ", genres_list);
    // Create a comma-separated list
    // Update the inner HTML of the event_genres element
    document.getElementById("deleteGenres").innerHTML = genres_list.join('');


    // to get multiple references and watched checkbox
    document.getElementById('editReferences').innerHTML = '';
    for (let j= 0; j < data.references.length; j++) {
        console.log("data.references[j]: ", data.references[j]);
        const div = document.createElement('div');
        const refHtml = `<input type="text" data-ref-id=${j} id="editRef" name="references" value="${data.references[j].ref}">`;

        let watchedHtml = '';

        if (data.references[j].watched === 1) {
            watchedHtml = `<label class="watch_label">Watched:</label><input data-watched-id=${j} id="editWatch" type="checkbox" checked></br>`;
        } else {
            console.log("here in else");
            watchedHtml = `<label class="watch_label">Watched:</label><input data-watched-id=${j} id="editWatch" type="checkbox"></br>`;
        }

        div.innerHTML = refHtml + watchedHtml;

        document.getElementById("editReferences").appendChild(div);
    }


    document.getElementById("save_button").value = eventID;
    $('#editModal').modal('show');
}