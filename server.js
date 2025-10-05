const express = require('express');
const path = require('path');
const redis = require('redis');
const app = express();
const PORT = process.env.PORT || 3000;

// --- NEW: Redis Database Connection ---
// It will get the connection URL from the environment variables we set on Render
const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const REDIS_KEY = 'scoreboardData'; // The key where we store all our match data in Redis

// --- End of New Redis Code ---

app.use(express.json());
app.use(express.static(__dirname));

// --- MODIFIED: readData and writeData functions ---
const readData = async () => {
    try {
        const rawData = await redisClient.get(REDIS_KEY);
        if (rawData) {
            return JSON.parse(rawData);
        } else {
            // If no data exists in Redis, return a default structure
            return { matches: {} };
        }
    } catch (error) {
        console.error("Error reading from Redis:", error);
        return { matches: {} };
    }
};

const writeData = async (data) => {
    try {
        await redisClient.set(REDIS_KEY, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing to Redis:", error);
    }
};
// --- End of Modified Functions ---

// All API endpoints are now 'async' to work with the database
app.get('/api/scoreboard-data', async (req, res) => {
    const matchId = req.query.match;
    if (!matchId) return res.status(400).send('Match ID is required.');
    const data = await readData();
    const matchData = data.matches[matchId];
    if (!matchData) return res.status(404).send('Match data not found.');
    res.json(matchData);
});

app.post('/api/update-scoreboard', async (req, res) => {
    const matchId = req.query.match;
    if (!matchId) return res.status(400).send('Match ID is required.');
    const newData = req.body;
    const data = await readData();
    if (!data.matches || !data.matches[matchId]) {
        return res.status(404).send('Match data not found.');
    }
    data.matches[matchId] = { ...data.matches[matchId], ...newData };
    await writeData(data);
    res.status(200).send('Scoreboard updated successfully.');
});

app.post('/api/save-total-runs', async (req, res) => {
    const matchId = req.query.match;
    const { totalRuns } = req.body;
    if (!matchId || totalRuns === undefined) {
        return res.status(400).send('Match ID and total runs are required.');
    }
    const data = await readData();
    if (data.matches && data.matches[matchId]) {
        data.matches[matchId].team1_runs = String(totalRuns);
        await writeData(data);
        res.status(200).send('Total runs saved successfully.');
    } else {
        res.status(404).send('Match not found.');
    }
});

app.post('/api/setup-match', async (req, res) => {
    const { organizerName, matchNumber, teamA, teamB, tossWinner, tossDecision } = req.body;
    const matchId = `match${matchNumber}`;
    const data = await readData();
    data.tournament_organizer = organizerName;
    if (!data.matches) data.matches = {};
    const battingTeam = tossDecision === 'Bat' ? tossWinner : (tossWinner === teamA ? teamB : teamA);
    
    data.matches[matchId] = {
        team1_name: teamA, team2_name: teamB, toss: `${tossWinner} won and chose to ${tossDecision}`,
        team1_runs: "0", team1_wickets: "0", team1_extra: "0", overs: "0.0",
        current_batting_team: battingTeam, striker_name: "Striker", striker_runs: "0",
        striker_bolls: "0", non_striker_name: "Non-Striker", non_striker_runs: "0",
        non_striker_bolls: "0", bowler_name: "Bowler"
    };
    
    await writeData(data);
    res.status(200).json({ message: 'Match setup successful.', matchId: matchId });
});

// Connect to Redis and then start the server
redisClient.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
});