// Base starting Elo rating for new players
const STARTING_ELO = 1200;
// K-Factor dictates how fast points swing per match
const K_FACTOR = 32;

// Load data from browser memory, or start empty if new
let players = JSON.parse(localStorage.getItem('sc2_rankings')) || {};

// Function to calculate and update Elo ratings
function recordMatch(winnerName, loserName) {
    // Add players to the database tracker if they are brand new
    if (!players[winnerName]) players[winnerName] = { name: winnerName, elo: STARTING_ELO, wins: 0, losses: 0 };
    if (!players[loserName]) players[loserName] = { name: loserName, elo: STARTING_ELO, wins: 0, losses: 0 };

    let oldWinnerElo = players[winnerName].elo;
    let oldLoserElo = players[loserName].elo;

    // Elo Probability Math Formula
    let expectedWinnerScore = 1 / (1 + Math.pow(10, (oldLoserElo - oldWinnerElo) / 400));
    let expectedLoserScore = 1 / (1 + Math.pow(10, (oldWinnerElo - oldLoserElo) / 400));

    // Calculate new ratings
    players[winnerName].elo = Math.round(oldWinnerElo + K_FACTOR * (1 - expectedWinnerScore));
    players[loserName].elo = Math.round(oldLoserElo + K_FACTOR * (0 - expectedLoserScore));

    // Increment win/loss trackers
    players[winnerName].wins += 1;
    players[loserName].losses += 1;

    // Save back to local storage memory
    localStorage.setItem('sc2_rankings', JSON.stringify(players));
    
    // Refresh visual leaderboard
    renderLeaderboard();
}

// Function to build and show the leaderboard sorted by highest score
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

    // Convert object to array and sort by Elo points
    let sortedPlayers = Object.values(players).sort((a, b) => b.elo - a.elo);

    if (sortedPlayers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">No matches recorded yet.</td></tr>`;
        return;
    }

    sortedPlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>#${index + 1}</strong></td>
            <td>${player.name}</td>
            <td>${player.wins}</td>
            <td>${player.losses}</td>
            <td style="color:#00d2ff; font-weight:bold;">${player.elo}</td>
        `;
        tbody.appendChild(row);
    });
}

// Handle Form Submissions
document.getElementById('matchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const winnerInput = document.getElementById('winner');
    const loserInput = document.getElementById('loser');

    const winner = winnerInput.value.trim();
    const loser = loserInput.value.trim();

    if (winner === loser) {
        alert("A player cannot play against themselves!");
        return;
    }

    recordMatch(winner, loser);

    // Clear inputs for the next match entry
    winnerInput.value = '';
    loserInput.value = '';
});

// Run automatically on startup
renderLeaderboard();
