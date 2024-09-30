import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import events from './routes/events.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Init app
const app = express();

// Load view engine
app.set('views', path.join(__dirname ,'views'));
app.set('public', path.join(__dirname, 'public')); // css, js
app.set('view engine', 'ejs');

app.use('/public', express.static(__dirname + '/public'));

app.use(express.json());


//Routes
app.use('/', events);

// Start Server
app.listen(3000, function(){
    console.log('Listening to port 3000..')
})

