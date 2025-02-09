// /backend/server.js

// Import necessary modules
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

// Import and initialize Firebase Admin SDK
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Ensure this file exists and is configured

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();

const app = express();

// Use CORS middleware
app.use(
  cors({
    origin: [
      "chrome-extension://aghajednkenmojcnpncdjcbbenhmpfii",
      "http://localhost:3001",
    ], // Replace with your actual extension ID if needed
    methods: ["POST", "GET"],
  })
);

// Middleware to parse JSON requests
app.use(express.json());

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Store the most recent data
let currentData = null;
let task = null;

// Define route to handle tab tracking and OpenAI API call
app.post("/track", async (req, res) => {
  try {
    // Ensure the task is defined
    if (!task) {
      return res
        .status(400)
        .send({ error: "Task is not defined. Please define the current task using /update-task." });
    }

    const { url, title, timestamp } = req.body;

    if (!url || !title || !timestamp) {
      return res
        .status(400)
        .send({ error: "Missing required fields: url, title, or timestamp." });
    }

    // Construct the prompt for OpenAI API
    const prompt = `The current task is: \"${task}\".
The user is visiting the page with the title: \"${title}\" and URL: ${url}.
Does this page align with the task? Please respond with just a "Yes" or "No".`;

    // Call OpenAI API
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a productivity assistant." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // Save the current data (for the GET /data endpoint)
    currentData = { url, title, task, timestamp, aiResponse };

    // --------- FIREBASE INTEGRATION ---------
    // For testing, we use a sample user ID and session ID.
    // In production, pass a valid ID token and user/session details.
    const sampleUserId = req.body.userId || "sampleUserId";
    const sampleSessionId = req.body.sessionId || "sampleSession";

    // Create a reference to the "tabsTracked" subcollection (matches your rules)
    const tabsRef = firestore
      .collection("users")
      .doc(sampleUserId)
      .collection("sessions")
      .doc(sampleSessionId)
      .collection("tabsTracked");

    // Add the tab data to Firestore
    await tabsRef.add({
      url,
      title,
      timestamp,
      onTask: aiResponse.trim().toLowerCase() === "yes", // Convert to boolean
      duration: 0, // Placeholder value, update later as needed
      assignedTaskId: "sampleTaskId", // Sample task ID
    });
    // ------------------------------------------

    // Respond back with the data
    res.status(200).send(currentData);
  } catch (error) {
    console.error("Error calling OpenAI API or writing to Firestore:", error.message);
    res.status(500).send({ error: "Failed to process the request." });
  }
});

// Define route to display the current data
app.get("/data", (req, res) => {
  if (!currentData) {
    return res.status(404).send({ error: "No data available." });
  }
  res.status(200).send(currentData);
});

// Define route to update the task
app.post("/update-task", (req, res) => {
  const { task: newTask } = req.body;

  if (!newTask) {
    return res.status(400).send({ error: "Task is required to update." });
  }

  // Update the task
  task = newTask;

  // Update task in currentData if it exists
  if (currentData) {
    currentData.task = newTask;
  }

  res.status(200).send({ message: "Task updated successfully.", task });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
