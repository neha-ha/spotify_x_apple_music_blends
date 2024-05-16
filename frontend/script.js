// Hover Effects
function hoverEffect(hovering, id) {
    let element = document.getElementById(id);
    if (hovering) {
        if (id === 'spotify') {
            element.style.filter = 'brightness(120%)';
        } else if (id === 'apple') {
            element.style.filter = 'brightness(160%)';
        }
    } else {
        element.style.filter = 'brightness(100%)';
    }
}

// Spotify Login
function loginSpotify() {
    window.location.href = 'http://localhost:8888/login';
}

// Apple Login
function loginApple() {
    window.location.href = 'http://localhost:8888/loginApple';
}







