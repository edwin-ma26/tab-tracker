document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:3000/data"; // Server endpoint for fetching data
    const UPDATE_TASK_URL = "http://localhost:3000/update-task"; // Server endpoint for updating the task
    const content = document.getElementById("content"); // Element to display data
    const errorElement = document.getElementById("error"); // Element to display errors
    const taskForm = document.getElementById("taskForm"); // Form element for updating the task
    const taskInput = document.getElementById("taskInput"); // Input field for new task
  
    // Fetch data from the server
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        const data = await res.json();
  
        // Clear previous content
        content.innerHTML = "";
  
        // Check if task is defined
        if (!data.task) {
          content.innerHTML = `
            <h2>Define Task</h2>
            <form id="taskForm">
              <label for="taskInput">Task:</label>
              <input type="text" id="taskInput" placeholder="Enter your task" required />
              <button type="submit">Submit</button>
            </form>
          `;
  
          // Attach event listener to the new form
          document.getElementById("taskForm").addEventListener("submit", updateTask);
        } else {
          // Display the current state if task is defined
          content.innerHTML = `
            <h2>Data Received from Server</h2>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Task:</strong> ${data.task}</p>
            <p><strong>On Task (AI Response):</strong> ${data.aiResponse}</p>
          `;
        }
      } catch (error) {
        // Display error message
        errorElement.textContent = error.message;
      }
    };
  
    // Submit new task to the server
    const updateTask = async (event) => {
      event.preventDefault(); // Prevent form submission from reloading the page
  
      const newTask = document.getElementById("taskInput").value;
  
      if (!newTask) {
        errorElement.textContent = "Task cannot be empty.";
        return;
      }
  
      try {
        const res = await fetch(UPDATE_TASK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ task: newTask }),
        });
  
        if (!res.ok) {
          throw new Error("Failed to update the task on the server.");
        }
  
        const result = await res.json();
  
        // Fetch updated data after task is updated
        fetchData();
  
        // Clear error messages
        errorElement.textContent = "";
      } catch (error) {
        // Display error message
        errorElement.textContent = error.message;
      }
    };
  
    // Fetch the data when the popup is opened
    fetchData();
  });
  