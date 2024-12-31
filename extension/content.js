console.log("Content script loaded for:", window.location.href);

// Initialize a MutationObserver for dynamic content handling
const observer = new MutationObserver(() => {
    if (window.location.hostname === "www.youtube.com" && window.location.pathname === "/watch") {
        console.log("YouTube video page detected");
        const videoTitleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
        if (videoTitleElement && videoTitleElement.textContent.trim()) {
            const videoTitle = videoTitleElement.textContent.trim();
            console.log("Dynamically Loaded Video Title:", videoTitle);

            chrome.runtime.sendMessage({
                type: "youtube",
                title: videoTitle,
                url: window.location.href
            });

            observer.disconnect(); // Stop observing once the title is found
        }
    } else if (window.location.hostname === "www.amazon.com") {
        console.log("Amazon detected");
        const productTitleElement = document.querySelector('#productTitle');
        if (productTitleElement && productTitleElement.textContent.trim()) {
            const productTitle = productTitleElement.textContent.trim();
            console.log("Amazon Product Title:", productTitle);

            chrome.runtime.sendMessage({
                type: "amazon",
                title: productTitle,
                url: window.location.href
            });

            observer.disconnect(); // Stop observing once the title is found
        }
    } else if (window.location.hostname === "www.quora.com") {
        console.log("Quora detected");
        const questionTitleElement = document.querySelector('div.q-text');
        if (questionTitleElement && questionTitleElement.textContent.trim()) {
            const questionTitle = questionTitleElement.textContent.trim();
            console.log("Quora Question Title:", questionTitle);

            chrome.runtime.sendMessage({
                type: "quora",
                title: questionTitle,
                url: window.location.href
            });

            observer.disconnect(); // Stop observing once the question title is found
        }
    } else if (window.location.hostname === "discord.com") {
        console.log("Discord detected");
        const channelTitleElement = document.querySelector('.name-2SL4ev');
        if (channelTitleElement && channelTitleElement.textContent.trim()) {
            const channelTitle = channelTitleElement.textContent.trim();
            console.log("Discord Channel Name:", channelTitle);

            chrome.runtime.sendMessage({
                type: "discord",
                title: channelTitle,
                url: window.location.href
            });

            observer.disconnect(); // Stop observing once the channel name is found
        }
    } else if (window.location.hostname === "twitter.com") {
        console.log("X (Twitter) detected");
        const tweetContentElement = document.querySelector('article div[lang]');
        if (tweetContentElement && tweetContentElement.textContent.trim()) {
            const tweetContent = tweetContentElement.textContent.trim();
            console.log("X Tweet Content:", tweetContent);

            chrome.runtime.sendMessage({
                type: "twitter",
                content: tweetContent,
                url: window.location.href
            });

            observer.disconnect(); // Stop observing once the tweet is found
        }
    }
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });
