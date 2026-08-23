function fetchLeaderboard() {
    try {
        const response = await fetch('players.json');
        const data =.json = await response.json();
        
        // Handle both older standalone lists and newer structured styles safely
        const players = data.players || data;
        
        const tbody = document.getElementById('leaderboardBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Sort by highest tournament points
        let sortedPlayers = Object.values(players).sort((a, b) => (b.puntos || 0) - (a.puntos || 0));

        if (sortedPlayers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No matches recorded yet.</td></tr>`;
            return;
        }

        sortedPlayers.forEach((player, index) => {
            const wins = player.victorias !== undefined ? player.victorias : (player.wins || 0);
            const puntos = player.puntos || 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>#${index + 1}</strong></td>
                <td>${player.name}</td>
                <td>${wins}</td>
                <td style="color:#00d2ff; font-weight:bold;">${puntos}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Failed to load rankings:", error);
    }
}

fetchLeaderboard();
