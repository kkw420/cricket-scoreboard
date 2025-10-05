const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Define the path for our persistent data storage
const DATA_DIR = '/var/data';
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Ensure the data directory exists before we try to use it
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.static(__dirname));

const readData = () => {
    try {
        const rawData = fs.readFileSync(DATA_FILE);
        if (rawData.length === 0) return { matches: {} };
        return JSON.parse(rawData);
    } catch (error) {
        console.error("Error reading data.json, starting with a default structure.", error);
        return { matches: {} };
    }
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

app.get('/api/scoreboard-data', (req, res) => {
    const matchId = req.query.match;
    if (!matchId) return res.status(400).send('Match ID is required.');
    const data = readData();
    const matchData = data.matches[matchId];
    if (!matchData) return res.status(404).send('Match data not found.');
    res.json(matchData);
});

app.post('/api/update-scoreboard', (req, res) => {
    const matchId = req.query.match;
    if (!matchId) return res.status(400).send('Match ID is required.');
    const newData = req.body;
    const data = readData();
    if (!data.matches || !data.matches[matchId]) {
        return res.status(404).send('Match data not found.');
    }
    data.matches[matchId] = { ...data.matches[matchId], ...newData };
    writeData(data);
    res.status(200).send('Scoreboard updated successfully.');
});

// --- NEW ENDPOINT TO SAVE THE CALCULATED TOTAL RUNS ---
app.post('/api/save-total-runs', (req, res) => {
    const matchId = req.query.match;
    const { totalRuns } = req.body; // Get totalRuns from the request

    if (!matchId) {
        return res.status(400).send('Match ID is required.');
    }
    if (totalRuns === undefined) {
        return res.status(400).send('Total runs are required.');
    }

    const data = readData();
    if (data.matches && data.matches[matchId]) {
        // Update the 'team1_runs' field with the new calculated total
        data.matches[matchId].team1_runs = String(totalRuns);
        writeData(data);
        res.status(200).send('Total runs saved successfully.');
    } else {
        res.status(404).send('Match not found.');
    }
});
// --- END OF NEW ENDPOINT ---

app.post('/api/setup-match', (req, res) => {
    const { organizerName, matchNumber, teamA, teamB, tossWinner, tossDecision } = req.body;
    const matchId = `match${matchNumber}`;
    const data = readData();
    data.tournament_organizer = organizerName;
    if (!data.matches) data.matches = {};
    const battingTeam = tossDecision === 'Bat' ? tossWinner : (tossWinner === teamA ? teamB : teamA);
    
    data.matches[matchId] = {
        team1_name: teamA,
        team2_name: teamB,
        toss: `${tossWinner} won the toss and chose to ${tossDecision}`,
        team1_runs: "0",
        team1_wickets: "0",
        team1_extra: "0", 
        overs: "0.0",
        current_batting_team: battingTeam,
        striker_name: "Striker",
        striker_runs: "0",
        striker_bolls: "0", // ADDED
        non_striker_name: "Non-Striker",
        non_striker_runs: "0",
        non_striker_bolls: "0", // ADDED
        bowler_name: "Bowler"
    };
    
    writeData(data);
    res.status(200).json({ message: 'Match setup successful.', matchId: matchId });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});