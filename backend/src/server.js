import 'babel-polyfill';
import express from 'express';
import * as fs from 'fs';
import bodyParser from 'body-parser';
import cors from 'cors';

// Import any routes we're going to be using
import leaderboard from './leaderboard';

// Create server
const app = express();

// Specifically enable CORS for pre-flight options requests
app.options('*', cors())

// Enable body parsers for reading POST data. We set up this app to 
// accept JSON bodies and x-www-form-urlencoded bodies. If you wanted to
// process other request tpes, like form-data or graphql, you would need
// to include the appropriate parser middlewares here.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  limit: '2mb',
  extended: true,
}));

// CORS allows these API routes to be requested directly by browsers
app.use(cors());

// Disable caching
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
});

// Enable routes we want to use
leaderboard(app);

// Start server
app.listen(process.env.PORT || 3333, null, async err => {
    if (err) {
        console.error(err.message);
    }
    console.log('[koji] backend started');
});
