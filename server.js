const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, 'players.json');
const STARTING_ELO = 1200;
const K_FACTOR = 32;

app.use(express.json());
// Serve your front-end HTML/CSS/JS files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Helper helper function to read data safely
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({}));
        return {};
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Get the current player standings
app.get('/api/players', (req, res) => {
    res.json(readData());
});

// Post a new match result and calculate Elo
app.post('/api/match', (req, res) => {
    const { winner, loser } = req.body;
    if (!winner || !loser || winner === loser) {
        return res.status(400).json({ error: "Invalid players submitted." });
    }

    let players = readData();

    // Initialize players if brand new
    if (!players[winner]) players[winner] = { name: winner, elo: STARTING_ELO, wins: 0, losses: 0 };
    if (!players[loser]) players[loser] = { name: loser, elo: STARTING_ELO, wins: 0, losses: 0 };

    let oldWinnerElo = players[winner].elo;
    let oldLoserElo = players[loser].elo;

    // Elo Math Calculation
    let expectedWinnerScore = 1 / (1 + Math.pow(10, (oldLoserElo - oldWinnerElo) / 400));
    let expectedLoserScore = 1 / (1 + Math.pow(10, (oldWinnerElo - oldLoserElo) / 400));

    players[winner].elo = Math.round(oldWinnerElo + K_FACTOR * (1 - expectedWinnerScore));
    players[loser].elo = Math.round(oldLoserElo + K_FACTOR * (0 - expectedLoserScore));

    players[winner].wins += 1;
    players[loser].losses += 1;

    // Save to server database text file
    fs.writeFileSync(DATA_FILE, JSON.stringify(players, null, 2));
    res.json({ success: true, players });
});

app.listen(PORT, () => {
    console.log(`🚀 SC2 Backend Server running at http://localhost:${PORT}`);
});
