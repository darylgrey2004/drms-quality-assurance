// js/landing.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page JS loaded successfully');
    
    const form = document.getElementById('loginForm');
    
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();  // prevent actual post
            
            console.log('Login form submitted - redirecting to homepage.html');
            
            // subtle feedback: change button text temporarily
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            btn.innerText = 'redirecting...';
            btn.disabled = true;
            btn.classList.add('opacity-70');
            
            // redirect to homepage.html (main system)
            setTimeout(() => {
                window.location.href = 'homepage.html';
            }, 300);
        });
    } else {
        console.error('Login form not found!');
    }
});