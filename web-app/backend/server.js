const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");
require("dotenv").config();

// 🔹 Load Firebase credentials from JSON file
const serviceAccount = require("./firebase-service-account.json");

// 🔹 Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// 🔹 Initialize Firestore Database
const db = admin.firestore();

// 🔹 OpenAI API Config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// 🔹 Express App Setup
const app = express();
app.use(cors({
    origin: ["chrome-extension://oehikgocpjlkcoleagecmfeaihdkabed", "http://localhost:3001"],
    methods: ["POST", "GET"],
}));
app.use(express.json());

// 🔹 Route: Track User Tab Activity
app.post("/track", async (req, res) => {
    try {
        // Log the incoming request data
        console.log("Received request data:", req.body);

        const { userId, url, title, timestamp, sessionId } = req.body;

        // Check if required fields are present
        if (!userId || !url || !title || !timestamp || !sessionId) {
            console.log("Missing required fields:", req.body);
            return res.status(400).json({ error: "Missing required fields." });
        }

        // 🔹 Verify User Exists in Firebase
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found." });
        }

        // 🔹 Get User's Current Task (or Default to General Productivity)
        const task = userDoc.data().currentTask || "General Productivity";
        console.log("User's current task:", task);

        // 🔹 Construct the OpenAI prompt
        const prompt = `The current task is: "${task}".\nThe user is visiting the page titled "${title}" at ${url}.\nDoes this page align with the task? Please respond with just "Yes" or "No".`;

        // Log the OpenAI prompt
        console.log("Constructing OpenAI prompt:", prompt);

        // 🔹 Call OpenAI API to classify the tab
        const aiResponse = await axios.post(OPENAI_API_URL, {
            model: "gpt-3.5-turbo", // Or "gpt-3.5-turbo"
            messages: [
                { role: "system", content: "You are a productivity assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // Correctly use the API key from .env
            }
        });
        

        // Log the OpenAI response
        console.log("OpenAI Response:", aiResponse.data);

        // Determine if the tab is "on-task"
        const isOnTask = aiResponse.data.choices[0].message.content.trim().toLowerCase() === "yes";

        // 🔹 Save Tab Tracking Result in Firebase
        const tabData = {
            url,
            title,
            timestamp,
            onTask: isOnTask
        };

        console.log("Saving tab data to Firebase:", tabData);

        await db.collection("users").doc(userId)
            .collection("sessions").doc(sessionId)
            .collection("tabs").add(tabData);

        // Respond with the result
        res.status(200).json({ success: true, onTask: isOnTask });
    } catch (error) {
        console.error("Error processing request:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

// 🔹 Route: Get User Tracking Data
app.get("/data", async (req, res) => {
    try {
        const { userId, sessionId } = req.query;

        if (!userId || !sessionId) {
            return res.status(400).json({ error: "Missing required query parameters." });
        }

        const tabsRef = db.collection("users").doc(userId)
            .collection("sessions").doc(sessionId)
            .collection("tabs");

        const snapshot = await tabsRef.get();
        if (snapshot.empty) {
            return res.status(404).json({ error: "No tracking data found." });
        }

        let tabs = [];
        snapshot.forEach(doc => tabs.push({ id: doc.id, ...doc.data() }));

        res.status(200).json(tabs);
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "Failed to fetch data." });
    }
});

// 🔹 Route: Update User's Current Task
app.post("/update-task", async (req, res) => {
    try {
        const { userId, task } = req.body;

        if (!userId || !task) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        await db.collection("users").doc(userId).update({ currentTask: task });

        res.status(200).json({ success: true, message: "Task updated successfully." });
    } catch (error) {
        console.error("Error updating task:", error.message);
        res.status(500).json({ error: "Failed to update task." });
    }
});

// 🔹 Start the Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
