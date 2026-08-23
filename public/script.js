async function fetchMatrixLeaderboard() {
    try {
        const response = await fetch('players.json');
        const data = await response.json();
        
        const players = data.players || {};
        const history = data.history || [];

        // Gather all unique player name strings alphabetically
        const playerNames = Object.keys(players).sort();
        
        const table = document.querySelector("table");
        if (!table) return;
        table.innerHTML = ""; // Clear out everything

        if (playerNames.length === 0) {
            table.innerHTML = "<p style='text-align:center;'>No matches found yet.</p>";
            return;
        }

        // Map old match records to a lookup template
        const matchMap = {};
        history.forEach(match => {
            matchMap[`${match.winner}_vs_${match.loser}`] = match.score_string;
        });

        // 1. GENERATE THE TOP ROW HEADERS
        const headerRow = document.createElement("tr");
        const cornerCell = document.createElement("th");
        cornerCell.textContent = "PLAYERS";
        headerRow.appendChild(cornerCell);

        playerNames.forEach(name => {
            const th = document.createElement("th");
            th.textContent = name;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // 2. GENERATE INTERSECTION VALUE CELLS
        playerNames.forEach(rowPlayer => {
            const row = document.createElement("tr");

            // Left side Player header column cell
            const leftHeader = document.createElement("td");
            leftHeader.style.fontWeight = "bold";
            leftHeader.style.backgroundColor = "#1e293b";
            leftHeader.textContent = rowPlayer;
            row.appendChild(leftHeader);

            playerNames.forEach(colPlayer => {
                const cell = document.createElement("td");
                cell.style.textAlign = "center";

                if (rowPlayer === colPlayer) {
                    cell.textContent = "—";
                    cell.style.backgroundColor = "#0f172a";
                    cell.style.color = "#475569";
                } else {
                    const winKey = `${rowPlayer}_vs_${colPlayer}`;
                    const loseKey = `${colPlayer}_vs_${rowPlayer}`;

                    if (matchMap[winKey]) {
                        cell.textContent = matchMap[winKey];
                        cell.style.backgroundColor = "#16a34a"; // Green cell for row winner
                        cell.style.color = "white";
                    } else if (matchMap[loseKey]) {
                        const parts = matchMap[loseKey].split("-");
                        cell.textContent = parts.length === 2 ? `${parts[1]}-${parts[0]}` : "L";
                        cell.style.backgroundColor = "#991b1b"; // Red cell for row loser
                        cell.style.color = "#fca5a5";
                    } else {
                        cell.textContent = "vs";
                        cell.style.color = "#64748b";
                    }
                }
                row.appendChild(cell);
            });
            table.appendChild(row);
        });

    } catch (error) {
        console.error("Failed to compile matrix table:", error);
    }
}

fetchMatrixLeaderboard();
