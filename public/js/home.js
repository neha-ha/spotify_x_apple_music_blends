// Error bubble
function showBubble(message) {
    const bubble = document.getElementById('bubble');
    bubble.textContent = message;
    bubble.style.display = 'block';
    requestAnimationFrame(() => { bubble.classList.add('show'); });
    setTimeout(() => { bubble.classList.remove('show'); 
    setTimeout(() => { bubble.style.display = 'none'; }, 500); }, 3000);
}

// Validate inputs in text box
function validateInputs() {
    const username1 = document.getElementById('username1').value.trim();
    const username2 = document.getElementById('username2').value.trim();
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!username1) {
        showBubble('Username 1 is required.');
        return false;
    }
    if (!username2) {
        showBubble('Username 2 is required.');
        return false;
    }
    if (!usernameRegex.test(username1) || !usernameRegex.test(username2)) {
        showBubble('Usernames can only contain letters, numbers, and underscores.');
        return false;
    }
    return true;
}

// Shows spinner
function showLoader() {
    document.querySelector('.button-text').style.display = 'none';
    document.querySelector('.spinner').style.display = 'flex';
}

// hide spinner
function hideLoader() {
    document.querySelector('.button-text').style.display = 'block';
    document.querySelector('.spinner').style.display = 'none';
}

// Generate button
document.getElementById('generatePlaylistBtn').addEventListener('click', async () => {
    if (!validateInputs()) {
        return;
    }
    showLoader();
    await blendPlaylist();
    hideLoader();
    console.log("loader hid");
    showPopup();
});


function saveAndRedirect() {
    if (!validateInputs()) {
        return;
    }
    var urlParams = new URLSearchParams(window.location.search);
    var accessToken = urlParams.get('access_token');
    const name1 = document.getElementById('username1').value;
    const name2 = document.getElementById('username2').value;
    hideLoader();

    const url = 'http://localhost:3000/create-playlist?access_token=' + accessToken + '&user1=' + name1 + '&user2=' + name2;
    history.pushState(null, '', url);

    window.location.href = 'http://localhost:3000/create-playlist?access_token=' + accessToken + '&user1=' + name1 + '&user2=' + name2;
    
}

