<<<<<<< HEAD
// A place to store the current run values for instant calculation
let currentStrikerRuns = 0;
let currentNonStrikerRuns = 0;
let currentExtraRuns = 0;

// This function gets the match ID from the URL (e.g., ?match=match1)
function getMatchId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('match');
}

// This function is called by the "Update All Fields" button.
function updateScoreboard() {
    const matchId = getMatchId();
    if (!matchId) {
        alert("No match specified in URL!");
        return;
    }

    // Gathers ALL data from the form, including the automatically updated 'bolls' fields
    const scoreboardData = {
        team1_name: document.getElementById('team1-name-input').value,
        team1_wickets: document.getElementById('team1-wickets-input').value,
        team2_name: document.getElementById('team2-name-input').value,
        overs: document.getElementById('overs-input').value,
        current_batting_team: document.getElementById('current-batting-team-input').value,
        striker_name: document.getElementById('striker-name-input').value,
        striker_runs: document.getElementById('striker-runs-input').value,
        striker_bolls: document.getElementById('striker-bolls-input').value,
        non_striker_name: document.getElementById('non-striker-name-input').value,
        non_striker_runs: document.getElementById('non-striker-runs-input').value,
        non_striker_bolls: document.getElementById('non-striker-bolls-input').value,
        bowler_name: document.getElementById('bowler-name-input').value
    };

    // Sends the data to the server for the correct match
    fetch(`/api/update-scoreboard?match=${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreboardData),
    })
    .then(response => response.ok ? response.text() : Promise.reject('Update failed'))
    .then(message => {
        console.log(message);
        alert('Scoreboard updated successfully!');
    })
    .catch(error => {
        console.error('Error updating scoreboard:', error);
        alert('An error occurred. Please check the server connection.');
    });
}

// This function calculates the total and updates the display
function updateTotalRunsDisplay() {
    const total = currentStrikerRuns + currentNonStrikerRuns + currentExtraRuns;
    const totalRunsDisplay = document.getElementById('total-runs-display');
    if(totalRunsDisplay) {
        totalRunsDisplay.textContent = total;
    }
}

// This new function saves ONLY the extra runs to the server
async function saveExtrasUpdate() {
    const matchId = getMatchId();
    try {
        await fetch(`/api/update-scoreboard?match=${matchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team1_extra: String(currentExtraRuns) })
        });
    } catch (error) {
        console.error('Failed to save extra runs:', error);
    }
}

// This function loads the initial values into the control panel
async function loadInitialValues() {
    const matchId = getMatchId();
    if (!matchId) {
        document.body.innerHTML = "<h1>Error: No match specified.</h1>";
        return;
    }

    document.getElementById('match-title').textContent = `Controlling: ${matchId.replace('match', 'Match ')}`;

    try {
        const response = await fetch(`/api/scoreboard-data?match=${matchId}`);
        if (!response.ok) throw new Error('Failed to load initial data.');
        const data = await response.json();

        document.getElementById('team1-name-input').value = data.team1_name || '';
        document.getElementById('team1-wickets-input').value = data.team1_wickets || '';
        document.getElementById('team2-name-input').value = data.team2_name || '';
        document.getElementById('overs-input').value = data.overs || '';
        document.getElementById('current-batting-team-input').value = data.current_batting_team || '';
        document.getElementById('striker-name-input').value = data.striker_name || '';
        document.getElementById('striker-runs-input').value = data.striker_runs || '';
        document.getElementById('striker-bolls-input').value = data.striker_bolls || '0';
        document.getElementById('non-striker-name-input').value = data.non_striker_name || '';
        document.getElementById('non-striker-runs-input').value = data.non_striker_runs || '';
        document.getElementById('non-striker-bolls-input').value = data.non_striker_bolls || '0';
        document.getElementById('bowler-name-input').value = data.bowler_name || '';

        currentStrikerRuns = parseInt(data.striker_runs) || 0;
        currentNonStrikerRuns = parseInt(data.non_striker_runs) || 0;
        currentExtraRuns = parseInt(data.team1_extra) || 0;

        updateTotalRunsDisplay();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        document.getElementById('match-title').textContent = `Error loading data for ${matchId}.`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadInitialValues();

    // --- NEW AUTOMATIC COUNTING AND RESET LOGIC ---

    // Get all the necessary input fields
    const strikerNameInput = document.getElementById('striker-name-input');
    const strikerRunsInput = document.getElementById('striker-runs-input');
    const strikerBollsInput = document.getElementById('striker-bolls-input');

    const nonStrikerNameInput = document.getElementById('non-striker-name-input');
    const nonStrikerRunsInput = document.getElementById('non-striker-runs-input');
    const nonStrikerBollsInput = document.getElementById('non-striker-bolls-input');
    
    // AUTO-INCREMENT STRIKER BALLS: When runs are changed, increment balls by 1.
    strikerRunsInput.addEventListener('change', () => {
        let balls = parseInt(strikerBollsInput.value) || 0;
        balls++;
        strikerBollsInput.value = balls;
    });

    // RESET STRIKER BALLS: When striker name is changed, reset balls to 0.
    strikerNameInput.addEventListener('change', () => {
        strikerBollsInput.value = '0';
    });

    // AUTO-INCREMENT NON-STRIKER BALLS: When runs are changed, increment balls by 1.
    nonStrikerRunsInput.addEventListener('change', () => {
        let balls = parseInt(nonStrikerBollsInput.value) || 0;
        balls++;
        nonStrikerBollsInput.value = balls;
    });

    // RESET NON-STRIKER BALLS: When non-striker name is changed, reset balls to 0.
    nonStrikerNameInput.addEventListener('change', () => {
        nonStrikerBollsInput.value = '0';
    });

    // --- END OF NEW LOGIC ---

    // --- Existing logic for Extras and Total Runs Display ---
    const increaseExtrasBtn = document.getElementById('increase-extras-btn');
    const decreaseExtrasBtn = document.getElementById('decrease-extras-btn');

    increaseExtrasBtn.addEventListener('click', () => {
        currentExtraRuns++;
        updateTotalRunsDisplay();
        saveExtrasUpdate();
    });

    decreaseExtrasBtn.addEventListener('click', () => {
        if (currentExtraRuns > 0) {
            currentExtraRuns--;
            updateTotalRunsDisplay();
            saveExtrasUpdate();
        }
    });

    strikerRunsInput.addEventListener('input', () => {
        currentStrikerRuns = parseInt(strikerRunsInput.value) || 0;
        updateTotalRunsDisplay();
    });
    
    nonStrikerRunsInput.addEventListener('input', () => {
        currentNonStrikerRuns = parseInt(nonStrikerRunsInput.value) || 0;
        updateTotalRunsDisplay();
    });
=======
// A place to store the current run values for instant calculation
let currentStrikerRuns = 0;
let currentNonStrikerRuns = 0;
let currentExtraRuns = 0;

// This function gets the match ID from the URL (e.g., ?match=match1)
function getMatchId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('match');
}

// This function is called by the "Update All Fields" button.
function updateScoreboard() {
    const matchId = getMatchId();
    if (!matchId) {
        alert("No match specified in URL!");
        return;
    }

    // Gathers ALL data from the form, including the automatically updated 'bolls' fields
    const scoreboardData = {
        team1_name: document.getElementById('team1-name-input').value,
        team1_wickets: document.getElementById('team1-wickets-input').value,
        team2_name: document.getElementById('team2-name-input').value,
        overs: document.getElementById('overs-input').value,
        current_batting_team: document.getElementById('current-batting-team-input').value,
        striker_name: document.getElementById('striker-name-input').value,
        striker_runs: document.getElementById('striker-runs-input').value,
        striker_bolls: document.getElementById('striker-bolls-input').value,
        non_striker_name: document.getElementById('non-striker-name-input').value,
        non_striker_runs: document.getElementById('non-striker-runs-input').value,
        non_striker_bolls: document.getElementById('non-striker-bolls-input').value,
        bowler_name: document.getElementById('bowler-name-input').value
    };

    // Sends the data to the server for the correct match
    fetch(`/api/update-scoreboard?match=${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreboardData),
    })
    .then(response => response.ok ? response.text() : Promise.reject('Update failed'))
    .then(message => {
        console.log(message);
        alert('Scoreboard updated successfully!');
    })
    .catch(error => {
        console.error('Error updating scoreboard:', error);
        alert('An error occurred. Please check the server connection.');
    });
}

// This function calculates the total and updates the display
function updateTotalRunsDisplay() {
    const total = currentStrikerRuns + currentNonStrikerRuns + currentExtraRuns;
    const totalRunsDisplay = document.getElementById('total-runs-display');
    if(totalRunsDisplay) {
        totalRunsDisplay.textContent = total;
    }
}

// This new function saves ONLY the extra runs to the server
async function saveExtrasUpdate() {
    const matchId = getMatchId();
    try {
        await fetch(`/api/update-scoreboard?match=${matchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team1_extra: String(currentExtraRuns) })
        });
    } catch (error) {
        console.error('Failed to save extra runs:', error);
    }
}

// This function loads the initial values into the control panel
async function loadInitialValues() {
    const matchId = getMatchId();
    if (!matchId) {
        document.body.innerHTML = "<h1>Error: No match specified.</h1>";
        return;
    }

    document.getElementById('match-title').textContent = `Controlling: ${matchId.replace('match', 'Match ')}`;

    try {
        const response = await fetch(`/api/scoreboard-data?match=${matchId}`);
        if (!response.ok) throw new Error('Failed to load initial data.');
        const data = await response.json();

        document.getElementById('team1-name-input').value = data.team1_name || '';
        document.getElementById('team1-wickets-input').value = data.team1_wickets || '';
        document.getElementById('team2-name-input').value = data.team2_name || '';
        document.getElementById('overs-input').value = data.overs || '';
        document.getElementById('current-batting-team-input').value = data.current_batting_team || '';
        document.getElementById('striker-name-input').value = data.striker_name || '';
        document.getElementById('striker-runs-input').value = data.striker_runs || '';
        document.getElementById('striker-bolls-input').value = data.striker_bolls || '0';
        document.getElementById('non-striker-name-input').value = data.non_striker_name || '';
        document.getElementById('non-striker-runs-input').value = data.non_striker_runs || '';
        document.getElementById('non-striker-bolls-input').value = data.non_striker_bolls || '0';
        document.getElementById('bowler-name-input').value = data.bowler_name || '';

        currentStrikerRuns = parseInt(data.striker_runs) || 0;
        currentNonStrikerRuns = parseInt(data.non_striker_runs) || 0;
        currentExtraRuns = parseInt(data.team1_extra) || 0;

        updateTotalRunsDisplay();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        document.getElementById('match-title').textContent = `Error loading data for ${matchId}.`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadInitialValues();

    // --- NEW AUTOMATIC COUNTING AND RESET LOGIC ---

    // Get all the necessary input fields
    const strikerNameInput = document.getElementById('striker-name-input');
    const strikerRunsInput = document.getElementById('striker-runs-input');
    const strikerBollsInput = document.getElementById('striker-bolls-input');

    const nonStrikerNameInput = document.getElementById('non-striker-name-input');
    const nonStrikerRunsInput = document.getElementById('non-striker-runs-input');
    const nonStrikerBollsInput = document.getElementById('non-striker-bolls-input');
    
    // AUTO-INCREMENT STRIKER BALLS: When runs are changed, increment balls by 1.
    strikerRunsInput.addEventListener('change', () => {
        let balls = parseInt(strikerBollsInput.value) || 0;
        balls++;
        strikerBollsInput.value = balls;
    });

    // RESET STRIKER BALLS: When striker name is changed, reset balls to 0.
    strikerNameInput.addEventListener('change', () => {
        strikerBollsInput.value = '0';
    });

    // AUTO-INCREMENT NON-STRIKER BALLS: When runs are changed, increment balls by 1.
    nonStrikerRunsInput.addEventListener('change', () => {
        let balls = parseInt(nonStrikerBollsInput.value) || 0;
        balls++;
        nonStrikerBollsInput.value = balls;
    });

    // RESET NON-STRIKER BALLS: When non-striker name is changed, reset balls to 0.
    nonStrikerNameInput.addEventListener('change', () => {
        nonStrikerBollsInput.value = '0';
    });

    // --- END OF NEW LOGIC ---

    // --- Existing logic for Extras and Total Runs Display ---
    const increaseExtrasBtn = document.getElementById('increase-extras-btn');
    const decreaseExtrasBtn = document.getElementById('decrease-extras-btn');

    increaseExtrasBtn.addEventListener('click', () => {
        currentExtraRuns++;
        updateTotalRunsDisplay();
        saveExtrasUpdate();
    });

    decreaseExtrasBtn.addEventListener('click', () => {
        if (currentExtraRuns > 0) {
            currentExtraRuns--;
            updateTotalRunsDisplay();
            saveExtrasUpdate();
        }
    });

    strikerRunsInput.addEventListener('input', () => {
        currentStrikerRuns = parseInt(strikerRunsInput.value) || 0;
        updateTotalRunsDisplay();
    });
    
    nonStrikerRunsInput.addEventListener('input', () => {
        currentNonStrikerRuns = parseInt(nonStrikerRunsInput.value) || 0;
        updateTotalRunsDisplay();
    });
>>>>>>> eb627643d2a644adbd4a0cd77d5b4bc2698e513d
});