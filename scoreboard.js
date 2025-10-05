// This function gets the match ID from the URL (e.g., ?match=match1)
function getMatchId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('match');
}

document.addEventListener('DOMContentLoaded', () => {
    const matchId = getMatchId();

    if (!matchId) {
        document.body.innerHTML = "<h1>Error: No match specified in the URL. Please use a URL like scoreboard.html?match=match1</h1>";
        return;
    }

    async function fetchScoreboardData() {
        try {
            const response = await fetch(`/api/scoreboard-data?match=${matchId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            updateDisplay(data);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    function updateElement(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (element && element.textContent !== String(newValue)) {
            element.textContent = newValue;
            element.classList.add('updated');
            setTimeout(() => {
                element.classList.remove('updated');
            }, 700);
        }
    }
    
    // --- NEW FUNCTION TO SAVE THE SCORE ---
    async function saveTotalRunsToServer(newTotal) {
        try {
            await fetch(`/api/save-total-runs?match=${matchId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ totalRuns: newTotal }),
            });
        } catch (error) {
            console.error('Error saving total runs:', error);
        }
    }
    // --- END OF NEW FUNCTION ---

    function updateDisplay(data) {
        // --- MODIFIED SECTION START ---
        const strikerRuns = parseInt(data.striker_runs) || 0;
        const nonStrikerRuns = parseInt(data.non_striker_runs) || 0;
        const extraRuns = parseInt(data.team1_extra) || 0; 
        const calculatedTotalRuns = strikerRuns + nonStrikerRuns + extraRuns;
        const serverTotalRuns = parseInt(data.team1_runs) || 0;
        updateElement('team1-runs', calculatedTotalRuns);
        if (calculatedTotalRuns !== serverTotalRuns) {
            saveTotalRunsToServer(calculatedTotalRuns);
        }
        // --- MODIFIED SECTION END ---

        // Update all other elements
        updateElement('team1-name', data.team1_name);
        updateElement('team2-name', data.team2_name);
        updateElement('team1-wickets', data.team1_wickets);
        updateElement('overs', data.overs);
        updateElement('current-batting-team', data.current_batting_team);
        updateElement('striker-name', data.striker_name);
        updateElement('striker-runs', data.striker_runs);
        updateElement('striker-bolls', data.striker_bolls); // ADDED
        updateElement('non-striker-name', data.non_striker_name);
        updateElement('non-striker-runs', data.non_striker_runs);
        updateElement('non-striker-bolls', data.non_striker_bolls); // ADDED
        updateElement('bowler-name', data.bowler_name);
    }
    
    setInterval(fetchScoreboardData, 2000);
    fetchScoreboardData();
});