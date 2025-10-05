document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('setup-form');
    const teamAInput = document.getElementById('team-a');
    const teamBInput = document.getElementById('team-b');
    const tossWinnerSelect = document.getElementById('toss-winner');

    // Update toss winner options whenever team names are typed
    function updateTossOptions() {
        const teamA = teamAInput.value || 'Team A';
        const teamB = teamBInput.value || 'Team B';
        tossWinnerSelect.innerHTML = `
            <option value="${teamA}">${teamA}</option>
            <option value="${teamB}">${teamB}</option>
        `;
    }

    teamAInput.addEventListener('keyup', updateTossOptions);
    teamBInput.addEventListener('keyup', updateTossOptions);
    updateTossOptions(); // Initial call

    // Handle form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const setupData = {
            organizerName: document.getElementById('organizer-name').value,
            matchNumber: document.getElementById('match-number').value,
            teamA: teamAInput.value,
            teamB: teamBInput.value,
            tossWinner: tossWinnerSelect.value,
            tossDecision: document.getElementById('toss-decision').value
        };

        try {
            const response = await fetch('/api/setup-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(setupData)
            });

            if (!response.ok) {
                throw new Error('Server responded with an error.');
            }

            const result = await response.json();
            // Redirect to the control panel for the specific match
            window.location.href = `/control.html?match=${result.matchId}`;

        } catch (error) {
            console.error('Failed to setup match:', error);
            alert('Error setting up match. Please check the server.');
        }
    });
});