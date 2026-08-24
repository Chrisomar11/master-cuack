async function fetchMatrixLeaderboard() {
    try {
        // Fetch the master database file from your repository
        const response = await fetch('players.json');
        const data = await response.json();
        
        const players = data.players || {};
        const history = data.history || [];

        // 1. Pre-calculate structural leaderboard rankings sorted by points
        const rankedPlayers = Object.values(players).sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
        const statsMap = {};
        rankedPlayers.forEach((p, idx) => {
            statsMap[p.name] = {
                rank: idx + 1,
                victorias: p.victorias || 0,
                puntos: p.puntos || 0
            };
        });

        // Alphabetical array layout alignment for standard grid columns
        const playerNames = Object.keys(players).sort();
        const table = document.getElementById("matrixTable");
        if (!table) return;
        table.innerHTML = ""; 

        if (playerNames.length === 0) {
            table.innerHTML = "<tr><td>No tournament players registered yet.</td></tr>";
            return;
        }

        // Map historical series match data for rapid dictionary lookup
        const matchMap = {};
        history.forEach(match => {
            matchMap[`${match.winner}_vs_${match.loser}`] = {
                score: match.score_string,
                replay: match.replay_url || ""
            };
        });

        // --- TOP ROW COLUMN HEADERS GENERATION ---
        const headerRow = document.createElement("tr");
        
        // Left Corner header cell
        const cornerCell = document.createElement("th");
        cornerCell.textContent = "PLAYERS";
        headerRow.appendChild(cornerCell);

        // Core dynamic player column headers
        playerNames.forEach(name => {
            const th = document.createElement("th");
            th.textContent = name;
            headerRow.appendChild(th);
        });

        // Far-right structural tracking column headers
        const thRank = document.createElement("th"); thRank.textContent = "RANK"; thRank.className = "stats-header"; headerRow.appendChild(thRank);
        const thWins = document.createElement("th"); thWins.textContent = "V"; thWins.className = "stats-header"; headerRow.appendChild(thWins);
        const thPts = document.createElement("th"); thPts.textContent = "PTS"; thPts.className = "stats-header"; headerRow.appendChild(thPts);
        
        table.appendChild(headerRow);

        // --- INTERSECTIONS GRID GENERATION ---
        playerNames.forEach(rowPlayer => {
            const row = document.createElement("tr");

            // Vertical left-aligned row player label
            const leftHeader = document.createElement("td");
            leftHeader.className = "player-row-header";
            leftHeader.textContent = rowPlayer;
            row.appendChild(leftHeader);

            playerNames.forEach(colPlayer => {
                const cell = document.createElement("td");

                if (rowPlayer === colPlayer) {
                    // Diagonal self-match cell blocker
                    cell.textContent = "—";
                    cell.className = "blocker-cell";
                } else {
                    const winKey = `${rowPlayer}_vs_${colPlayer}`;
                    const loseKey = `${colPlayer}_vs_${rowPlayer}`;

                    if (matchMap[winKey]) {
                        // 🟢 ROW WINNER PERSPECTIVE CELL
                        let matchInfo = matchMap[winKey];
                        cell.style.backgroundColor = "#16a34a";
                        cell.style.color = "white";

                        if (matchInfo.replay) {
                            cell.innerHTML = `
                                <div style="font-weight: bold;">${matchInfo.score}</div>
                                <a href="${matchInfo.replay}" download class="replay-btn">📥 Replay</a>
                            `;
                        } else {
                            cell.textContent = matchInfo.score;
                        }

                    } else if (matchMap[loseKey]) {
                        // 🔴 ROW LOSER PERSPECTIVE CELL (Automatically inverts score syntax)
                        let matchInfo = matchMap[loseKey];
                        const parts = matchInfo.score.split("-");
                        const displayedScore = parts.length === 2 ? `${parts[1]}-${parts[0]}` : "L";
                        
                        cell.style.backgroundColor = "#991b1b";
                        cell.style.color = "#fca5a5";
                        cell.className = "loser-cell";

                        if (matchInfo.replay) {
                            cell.innerHTML = `
                                <div>${displayedScore}</div>
                                <a href="${matchInfo.replay}" download class="replay-btn">📥 Replay</a>
                            `;
                        } else {
                            cell.textContent = displayedScore;
                        }

                    } else {
                        // Match has not been played yet
                        cell.textContent = "vs";
                        cell.className = "unplayed-cell";
                    }
                }
                row.appendChild(cell);
            });

            // --- APPEND STATS COLUMNS ON THE RIGHT ---
            const s = statsMap[rowPlayer] || { rank: "-", victorias: 0, puntos: 0 };
            
            const tdRank = document.createElement("td"); tdRank.textContent = `#${s.rank}`; tdRank.className = "stats-cell"; tdRank.style.fontWeight = "bold"; row.appendChild(tdRank);
            const tdWins = document.createElement("td"); tdWins.textContent = s.victorias; tdWins.className = "stats-cell"; row.appendChild(tdWins);
            const tdPts = document.createElement("td"); tdPts.textContent = s.puntos; tdPts.className = "stats-cell points-cell"; row.appendChild(tdPts);

            table.appendChild(row);
        });

    } catch (error) {
        console.error("Failed to compile matrix table:", error);
    }
}

// Execute calculations instantly when webpage finishes opening
fetchMatrixLeaderboard();
