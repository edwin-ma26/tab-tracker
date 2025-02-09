const axios = require("axios");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ensure your API key is set in the .env

const OPENAI_API_URL = "https://api.openai.com/v1/completions"; // OpenAI endpoint

async function classifyTab(task, url, title) {
    try {
        // Construct the prompt that will be sent to OpenAI
        const prompt = `The current task is: "${task}".\nThe user is visiting the page titled: "${title}" at URL: ${url}.\nDoes this page align with the task? Please respond with just "Yes" or "No".`;

        // Make the API call to OpenAI
        const response = await axios.post(OPENAI_API_URL, {
            model: "gpt-3.5-turbo", // Use "gpt-4" instead of "gpt-4o"
            messages: [
                { role: "system", content: "You are a productivity assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0, // Keeps the response consistent and short (Yes or No)
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}` // Include your OpenAI API key here
            }
        });

        // Extract the AI response (Yes/No)
        const aiResponse = response.data.choices[0].message.content.trim().toLowerCase();

        // Return the AI's answer (either 'yes' or 'no')
        return aiResponse;
    } catch (error) {
        console.error("Error calling OpenAI API:", error.message);
        throw new Error("OpenAI API request failed");
    }
}

module.exports = { classifyTab };
