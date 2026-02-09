// script.js

function logCurrentDateTime() {
    const now = new Date();
    console.log("Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS):", now.toISOString().slice(0, 19).replace("T", " "));
}

// Call the function to log the current date and time
logCurrentDateTime();