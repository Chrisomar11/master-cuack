async function fetchLeaderboard() {
    try {
        // Fetch the static JSON file directly from your GitHub folder
        const response = await fetch('players.json');
        const players = await response.json();
        
        const tbody = document.getElementById('leaderboardBody');
        tbody.innerHTML = '';

        let sortedPlayers = Object.values(players).sort((a, b) => b.elo - a.elo);

        if (sortedPlayers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No matches recorded yet.</td></tr>`;
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
    } catch (error) {
        console.error("Failed to load rankings:", error);
    }
}

// Check for updates every time the page loads
fetchLeaderboard();
