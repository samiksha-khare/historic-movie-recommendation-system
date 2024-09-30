// document.addEventListener('DOMContentLoaded', async () => {
//     try {
//         const response = await fetch('/events');
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         const data = await response.json();
//         // console.log(data);
//         await populateTable(data.event_name_year);
//         populateGenreListInDropdown(data.genres);
//         populateRegionListInDropdown(data.regions);
//
//     } catch (error) {
//         console.error('There was a problem with the fetch operation:', error);
//         document.getElementById('response').textContent = 'Error fetching data';
//     }
// });
//
// // Select genre from dropdown (action), so that we get event name and start year of selected genre
// document.getElementById('genre').addEventListener('change', async (genre) => {
//     console.log(genre.target.value);
//     await getEventsByGenre(genre.target.value)
// })
//
// document.getElementById('region').addEventListener('change', async (region) => {
//     console.log(region.target.value);
//     await getEventsByRegion(region.target.value)
// })
//
// // Submit new event
// document.getElementById('addNewEvent').addEventListener('click', async () => {
//     let watched = document.getElementById('addWatched').value;
//     if(watched === 'on') {
//         watched = true;
//     } else {
//         watched = false;
//     }
//     const newEventDetails = {
//         'name' : document.getElementById('addEventName').value || '',
//         'start_year' : document.getElementById('addStartYear').value || null,
//         'end_year' : document.getElementById('addEndYear').value || null,
//         'region' : document.getElementById('addRegion').value || '',
//         'description' : document.getElementById('addDescription').value || '',
//         'genre' : document.getElementById('addGenre').value || '',
//         'watched' : watched,
//     };
//     console.log("newEventDetails: ", newEventDetails);
//     await addNewEvent(newEventDetails);
// })
//
//
// // Populate all events in the table
// async function populateTable(event_name_year) {
//     const tableBody = document.querySelector('#eventsTable tbody');
//     tableBody.innerHTML = ''; // Clear any existing rows
//
//     for(let i=0; i < event_name_year.length; i++) {
//         const row = document.createElement('tr');
//         // getting the values and adding hyperlink inside <a> </a>
//         row.innerHTML = `
//                 <td>${i+1}</td>
//                 <td> <a class="eventName" id="${event_name_year[i].id}" href="#"> ${event_name_year[i].name}</a></td>
//                 <td>${event_name_year[i].start_year}</td>
//             `;
//         tableBody.appendChild(row);
//     }
//
//     // Get information of the event, on clicking the hyperlink
//     const eventNames = document.getElementsByClassName('eventName');
//     for (let i=0; i < eventNames.length; i++) {
//         eventNames[i].addEventListener('click', async (event) => {
//             console.log('event: ', event.target.id);
//
//             const response = await getEventDetailsById(event.target.id);
//             console.log(response);
//             document.getElementById("event_name").textContent = response.event_details[0].name;
//             document.getElementById("event_start_year").textContent = response.event_details[0].start_year;
//             document.getElementById("event_end_year").textContent = response.event_details[0].end_year;
//             document.getElementById("event_region").textContent = response.event_details[0].region;
//             document.getElementById("event_description").textContent = response.event_details[0].description;
//
//             // to get multiple values of genres for given event id
//             let genres = [];
//             for (let j= 0; j < response.genres.length; j++) {
//                 genres.push(
//                     {
//                         genre: response.genres[j].genre,
//                         genre_id: response.genres[j].genre_id,
//                     }
//                 );
//             }
//             console.log("genres: ", genres);
//             let genres_list = genres.map(genre => {
//                 return `<span data-genre-id="${genre.genre_id}">${genre.genre}</span>`;
//             });
//
//             // Create a comma-separated list
//             // Update the inner HTML of the event_genres element
//             document.getElementById("event_genres").innerHTML = genres_list.join(", ");
//
//             document.getElementById('event_references').innerHTML = ''; // '' represents that everytime inner html is blank for that particular id
//             for (let j= 0; j < response.references.length; j++) {
//
//                 const div = document.createElement('div');
//                 const refHtml = `<a href="${response.references[j].ref}" target="_blank">${response.references[j].ref} </a>`; // target="_blank" -> open hyperlink in new tab
//
//                 let watchedHtml = '';
//
//                 if (response.references[j].watched === 1) {
//                     watchedHtml = `<label>Watched:</label><span>Yes</span></br>`;
//                 } else {
//                     watchedHtml = `<label>Watched:</label><span>No</span></br>`;
//                 }
//
//                 div.innerHTML = refHtml + watchedHtml;
//                 document.getElementById("event_references").appendChild(div);
//             }
//
//             document.getElementById("edit_event").value = event.target.id;
//             document.getElementById("delete_event").value = event.target.id;
//             $('#eventModal').modal('show');
//         });
//     }
// }
//
// async function getEventDetailsById(id) {
//     const response = await fetch(`/event/${id}`);
//     if (!response.ok) {
//         throw new Error('Network response was not ok');
//     }
//     const data = await response.json();
//     return data;
// }
//
//
//
// document.getElementById("edit_event").addEventListener('click', async(event) => {
//     console.log(event.target.value);
//     const data = await getEventDetailsById(event.target.value);
//     console.log(data);
//     document.getElementById("editEventName").value = data.event_details[0].name;
//     document.getElementById("editStartYear").value = data.event_details[0].start_year;
//     document.getElementById("editEndYear").value = data.event_details[0].end_year;
//     document.getElementById("editRegion").value = data.event_details[0].region;
//     document.getElementById("editDescription").value = data.event_details[0].description;
//     document.getElementById("editGenres").value = '';
//
//     let genres = [];
//     for (let j= 0; j < data.genres.length; j++) {
//         genres.push(
//             {
//                 genre: data.genres[j].genre,
//                 genre_id: data.genres[j].genre_id,
//             }
//         );
//     }
//     console.log("genres: ", genres);
//     let genres_list = genres.map(genre => {
//         console.log(genre.genre);
//         return `
//             <li data-genre-id="${genre.genre_id}">${genre.genre}<a href="#"> X </a></li>
//     `;
//     });
// console.log("genres_list: ", genres_list);
//     // Create a comma-separated list
//     // Update the inner HTML of the event_genres element
//     document.getElementById("deleteGenres").innerHTML = genres_list.join('');
//
//
//     // to get multiple references and watched checkbox
//     document.getElementById('editReferences').innerHTML = '';
//     for (let j= 0; j < data.references.length; j++) {
//         const div = document.createElement('div');
//         const refHtml = `<input type="text" id=${j} name="references" value="${data.references[j].ref}">`;
//
//         let watchedHtml = '';
//
//         if (data.references[j].watched === 1) {
//             watchedHtml = `<label>Watched:</label><input type="checkbox" checked></br>`;
//         } else {
//             watchedHtml = `<label>Watched:</label><input type="checkbox"></br>`;
//         }
//
//         div.innerHTML = refHtml + watchedHtml;
//
//         document.getElementById("editReferences").appendChild(div);
//     }
//
//
//     document.getElementById("save_button").value = event.target.value;
//     $('#editModal').modal('show');
// })
//
// document.getElementById("save_button").addEventListener('click', async(event) => {
//     const eventId = event.target.value;
//     console.log(eventId);
//     const fetchedEventDetails = await fetchUpdatedEventDetails(eventId);
//     try {
//         const response = await fetch(`/event/${eventId}`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(fetchedEventDetails)
//         });
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//
//         const data = await response.json();
//         console.log("data: ", data);
//
//     } catch (error) {
//         console.error('There was a problem with the fetch operation:', error);
//     }
// })
//
// async function fetchUpdatedEventDetails(id){
//     const fetchEventName = document.getElementById("editEventName").value;
//     console.log("hi: ",fetchEventName)
//     console.log("id: ",id)
//
//     const fetchedValues = {
//         'name' : document.getElementById('editEventName').value || '',
//         'start_year' : document.getElementById('editStartYear').value || null,
//         'end_year' : document.getElementById('editEndYear').value || null,
//         'region' : document.getElementById('editRegion').value || '',
//         'description' : document.getElementById('editDescription').value || '',
//         'genre' : document.getElementById('editGenres').value || '',
//         // 'watched' : watched,
//     };
//     console.log(fetchedValues);
//     return fetchedValues;
// }
//
// document.getElementById('delete_event').addEventListener('click', async (event) => {
//     console.log(event.target.value);
//     const response = await deleteEventById(event.target.value);  // event.target.value this has event id fetched from above code which is document.getElementById("delete_event").value = event.target.id;
//     console.log(response);
// });
//
// async function deleteEventById(id) {
//     const response = await fetch(`/event/${id}`, {
//         method: 'DELETE'
//     })
//     if (!response.ok) {
//         throw new Error('Network response was not ok');
//     }
//     const data = await response.json();
//     return data;
// }
//
// function populateGenreListInDropdown(genres) {
//     const dropdownGenre = document.getElementById('genre');
//     // dropdownGenre.innerHTML = ''; // Clear any existing rows
//
//     for(let i=0; i < genres.length; i++) {
//         const option = document.createElement('option');
//         option.value = genres[i].genre;
//         option.textContent = genres[i].genre;
//         dropdownGenre.appendChild(option);
//     }
// }
//
// function populateRegionListInDropdown(regions) {
//     const dropdownRegion = document.getElementById('region');
//
//     for(let i=0; i<regions.length; i++) {
//         const option = document.createElement('option');
//         option.value = regions[i].region; // .region is to get value (e.g USA )from each object
//         option.textContent = regions[i].region;
//         dropdownRegion.appendChild(option);
//     }
// }
//
// // cal api (i.e goes to route. In this case it goes to '/genre/:genre' `--> /genre/${genre}`)
// async function getEventsByGenre(genre) {
//     try {
//         const response = await fetch(`/genre/${genre}`);
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         const data = await response.json();
//         console.log(data);
//         await populateTable(data.event_name_year_by_genre);
//     } catch (error) {
//         console.error('There was a problem with the fetch operation:', error);
//         document.getElementById('response').textContent = 'Error fetching data';
//     }
// }
//
//
// async function getEventsByRegion(region) {
//     try {
//         region = encodeURIComponent(region);
//         const response = await fetch(`/region/${region}`);
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         const data = await response.json();
//         await populateTable(data.event_name_year_by_region);
//     } catch (error) {
//         console.error('There was a problem with the fetch operation:', error);
//         document.getElementById('response').textContent = 'Error fetching data';
//     }
// }
//
// async function addNewEvent(newEventData) {
//     try {
//         const response = await fetch('/events', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(newEventData)
//         });
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//
//         const data = await response.json();
//         console.log("data: ", data);
//
//     } catch (error) {
//         console.error('There was a problem with the fetch operation:', error);
//         document.getElementById('response').textContent = 'Error fetching data';
//     }
// }
//
