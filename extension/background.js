const API_URL = "http://localhost:3000/track"; // Replace with your web app's URL

// Array of sites that default to `isOnTask = true`
const productiveSites = [
    "chat.openai.com",
    "google.com",
    "bing.com"
];

// Listen for active tab changes
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, tab => {
        let isOnTask = false; // Default to false

        // Check if the URL matches any productive sites
        if (tab.url && productiveSites.some(site => tab.url.includes(site))) {
            isOnTask = true;
        }

        const data = {
            url: tab.url,
            title: tab.title || "Unknown Title", // Handle case where title may be undefined
            timestamp: new Date().toISOString(),
            isOnTask: isOnTask // Include the task status
        };

        // Send the data to your web app
        fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
        .then(response => response.text())
        .then(serverResponse => console.log("Server Response:", serverResponse))
        .catch(error => console.error("Error:", error));
    });
});

