// Function to pull rankings from the server database
async function fetchLeaderboard() {
    const response = await fetch('/api/players');
    const players = await response.json();
    renderLeaderboard(players);
}

function renderLeaderboard(players) {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

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

// Submit match to server
document.getElementById('matchForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const winnerInput = document.getElementById('winner');
    const loserInput = document.getElementById('loser');

    const winner = winnerInput.value.trim();
    const loser = loserInput.value.trim();

    if (winner === loser) {
        alert("A player cannot play against themselves!");
        return;
    }

    const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner, loser })
    });

    const data = await response.json();
    if (data.success) {
        renderLeaderboard(data.players);
        winnerInput.value = '';
        loserInput.value = '';
    }
});

// Load immediately on open
fetchLeaderboard();
