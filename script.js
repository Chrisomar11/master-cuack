// 🔑 PASTE YOUR SECURE GITHUB PERSONAL ACCESS TOKEN HERE
const GITHUB_TOKEN = "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";
const REPO_NAME = "Chrisomar11/master-cuack";
const FILE_PATH = "players.json";
const REPLAYS_DIR = "replays";

let currentDatabase = { players: {}, history: [] };

// Main entry wrapper to initialize web operations
async function initWebInterface() {
    await fetchMatrixLeaderboard();
    setupFormListeners();
}

// 🌐 Pull data from repository database file
async function fetchMatrixLeaderboard() {
    try {
        // Cache bust query ensures the browser fetches fresh scores instead of loaded history pages
        const response = await fetch(`players.json?t=${Date.now()}`);
        currentDatabase = await response.json();
        
        const players = currentDatabase.players || {};
        const history = currentDatabase.history || [];

        // Ranks layout preprocessing
        const rankedPlayers = Object.values(players).sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
        const statsMap = {};
        rankedPlayers.forEach((p, idx) => {
            statsMap[p.name] = { rank: idx + 1, victorias: p.victorias || 0, puntos: p.puntos || 0 };
        });

        const playerNames = Object.keys(players).sort();
        
        // 🔄 Sync Registered players into Web Dropdowns
        updateDropdownMenus(playerNames);

        const table = document.getElementById("matrixTable");
        if (!table) return;
        table.innerHTML = ""; 

        if (playerNames.length === 0) {
            table.innerHTML = "<tr><td>No tournament players registered yet. Submit a match to create profiles!</td></tr>";
            return;
        }

        const matchMap = {};
        history.forEach(match => {
            matchMap[`${match.winner}_vs_${match.loser}`] = {
                score: match.score_string,
                replay: match.replay_url || ""
            };
        });

        // HEADERS BUILDING
        const headerRow = document.createElement("tr");
        const cornerCell = document.createElement("th");
        cornerCell.textContent = "PLAYERS";
        headerRow.appendChild(cornerCell);

        playerNames.forEach(name => {
            const th = document.createElement("th");
            th.textContent = name;
            headerRow.appendChild(th);
        });

        const thRank = document.createElement("th"); thRank.textContent = "RANK"; thRank.className = "stats-header"; headerRow.appendChild(thRank);
        const thWins = document.createElement("th"); thWins.textContent = "V"; thWins.className = "stats-header"; headerRow.appendChild(thWins);
        const thPts = document.createElement("th"); thPts.textContent = "PTS"; thPts.className = "stats-header"; headerRow.appendChild(thPts);
        table.appendChild(headerRow);

        // ROWS COMPILING
        playerNames.forEach(rowPlayer => {
            const row = document.createElement("tr");

            const leftHeader = document.createElement("td");
            leftHeader.className = "player-row-header";
            leftHeader.textContent = rowPlayer;
            row.appendChild(leftHeader);

            playerNames.forEach(colPlayer => {
                const cell = document.createElement("td");

                if (rowPlayer === colPlayer) {
                    cell.textContent = "—"; cell.className = "blocker-cell";
                } else {
                    const winKey = `${rowPlayer}_vs_${colPlayer}`;
                    const loseKey = `${colPlayer}_vs_${rowPlayer}`;

                    if (matchMap[winKey]) {
                        let matchInfo = matchMap[winKey];
                        cell.style.backgroundColor = "#16a34a"; cell.style.color = "white";
                        if (matchInfo.replay) {
                            cell.innerHTML = `<div>${matchInfo.score}</div><a href="${matchInfo.replay}" download class="replay-btn">📥 Replay</a>`;
                        } else { cell.textContent = matchInfo.score; }
                    } else if (matchMap[loseKey]) {
                        let matchInfo = matchMap[loseKey];
                        const parts = matchInfo.score.split("-");
                        const displayedScore = parts.length === 2 ? `${parts[1]}-${parts[0]}` : "L";
                        cell.style.backgroundColor = "#991b1b"; cell.style.color = "#fca5a5"; cell.className = "loser-cell";
                        if (matchInfo.replay) {
                            cell.innerHTML = `<div>${displayedScore}</div><a href="${matchInfo.replay}" download class="replay-btn">📥 Replay</a>`;
                        } else { cell.textContent = displayedScore; }
                    } else {
                        cell.textContent = "vs"; cell.className = "unplayed-cell";
                    }
                }
                row.appendChild(cell);
            });

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

function updateDropdownMenus(playerNames) {
    const wSelect = document.getElementById("winnerSelect");
    const lSelect = document.getElementById("loserSelect");
    if (!wSelect || !lSelect) return;

    wSelect.innerHTML = '<option value="">-- Choose Winner --</option>';
    lSelect.innerHTML = '<option value="">-- Choose Loser --</option>';

    playerNames.forEach(name => {
        wSelect.innerHTML += `<option value="${name}">${name}</option>`;
        lSelect.innerHTML += `<option value="${name}">${name}</option>`;
    });
}

// 📦 API Helper to fetch raw tracker data or shas from GitHub API
async function getGitHubFileInfo(path) {
    const url = `https://github.com{REPO_NAME}/contents/${path}`;
    const res = await fetch(url, {
        headers: { "Authorization": `token ${GITHUB_TOKEN}` }
    });
    if (!res.ok) return null;
    return await res.json();
}

// 🚀 API Helper to push binary or raw strings live to GitHub
async function uploadToGitHub(path, message, base64Content, sha = null) {
    const url = `https://github.com{REPO_NAME}/contents/${path}`;
    const body = { message, content: base64Content, branch: "main" };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Upload operation failed.");
    }
    return await res.json();
}

// Helper tool to convert attached browser files into Base64 binaries
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

function setupFormListeners() {
    const form = document.getElementById("webMatchForm");
    const undoBtn = document.getElementById("undoBtn");

    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const winner = document.getElementById("winnerSelect").value;
            const loser = document.getElementById("loserSelect").value;
            const pointsGained = parseInt(document.getElementById("pointsGained").value);
            const scoreStr = document.getElementById("disputedScore").value.trim();
            const fileInput = document.getElementById("replayFile");

            if (!winner || !loser) { alert("Please pick both a Winner and a Loser."); return; }
            if (winner === loser) { alert("A player cannot play against themselves!"); return; }

            try {
                let replayUrl = "";

                // 1. Handle Replay File Upload directly via browser stream
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const filename = `${winner}_vs_${loser}_${scoreStr}_${Date.now()}.SC2Replay`;
                    const githubReplayPath = `${REPLAYS_DIR}/${filename}`;
                    const base64Content = await fileToBase64(file);

                    // Safety overwrite check
                    const existingFile = await getGitHubFileInfo(githubReplayPath);
                    const sha = existingFile ? existingFile.sha : null;

                    await uploadToGitHub(githubReplayPath, `Web App: Uploaded replay ${filename}`, base64Content, sha);
                    replayUrl = `replays/${filename}`;
                }

                // 2. Fetch fresh Master database template to check structural changes
                const dbFileInfo = await getGitHubFileInfo(FILE_PATH);
                if (!dbFileInfo) throw new Error("Could not find master database file on GitHub.");
                
                const data = JSON.parse(atob(dbFileInfo.content.replace(/\s/g, '')));
                const players = data.players || {};
                const history = data.history || [];

                if (!players[winner]) players[winner] = { name: winner, victorias: 0, puntos: 0 };
                if (!players[loser]) players[loser] = { name: loser, victorias: 0, puntos: 0 };
                    players[winner].victorias += 1;
                    players[winner].puntos += pointsGained;
                    history.push({winner, loser, points_gained: pointsGained, score_string: scoreStr, replay_url: replayUrl});
                    // 3. Push adjusted database json back upconst updatedBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
                    await uploadToGitHub(FILE_PATH, Web App: Logged match ${winner} vs ${loser}, updatedBase64, dbFileInfo.sha);alert("Match successfully uploaded directly to GitHub server!");
                form.reset();
                // Allow a slight lag pause before reloading layoutssetTimeout(fetchMatrixLeaderboard, 1500);
                } catch (err) {alert(Error logging match results:\n${err.message});
                               console.error(err);}});}
                if (undoBtn) {undoBtn.addEventListener("click", async function() {
                    if (!confirm("Are you sure you want to delete the last recorded match?")) return;
                    try {const dbFileInfo = await getGitHubFileInfo(FILE_PATH);
                        if (!dbFileInfo) return;
                        const data = JSON.parse(atob(dbFileInfo.content.replace(/\s/g, '')));
                        const history = data.history || [];
                        const players = data.players || {};
                        if (history.length === 0) { alert("No historical match records found to undo.");
                        return;
                                                  }const lastMatch = history.pop();
                        const winner = lastMatch.winner;
                         const points = lastMatch.points_gained;
                         if (players[winner]) {players[winner].victorias = Math.max(0, players[winner].victorias - 1);
                                               players[winner].puntos = Math.max(0, players[winner].puntos - points);
                                              }const updatedBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
                         await uploadToGitHub(FILE_PATH, Web App: Reverted last match checkpoint, updatedBase64, dbFileInfo.sha);
                         alert("Last match erased from system registers.");
                         setTimeout(fetchMatrixLeaderboard, 1500);
                        } catch (err) {alert(Undo execution failed:\n${err.message});}});}}
// Kick off processes on site startupwindow.onload = initWebInterface;
