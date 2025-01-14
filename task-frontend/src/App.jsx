import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Create a Socket connection to the backend
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const socket = io(backendUrl);

function App() {
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [taskStatus, setTaskStatus] = useState("pending");
  const [filter, setFilter] = useState("all");

  // Fetch tasks from the backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${backendUrl}/tasks`);
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();

    // Listen for task changes through socket events
    socket.on("taskAdded", () => fetchTasks());
    socket.on("taskUpdated", () => fetchTasks());
    socket.on("taskDeleted", () => fetchTasks());

    // Clean up socket event listeners
    return () => {
      socket.off("taskAdded");
      socket.off("taskUpdated");
      socket.off("taskDeleted");
    };
  }, []);

  // Handle task submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskName) return;

    try {
      const newTask = { name: taskName, status: taskStatus };
      await axios.post(`${backendUrl}/tasks`, newTask);
      setTaskName(""); // Reset form
      toast.success("Task added successfully!");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Error adding task!");
    }
  };

  // Delete task
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${backendUrl}/tasks/${id}`);
      toast.success("Task deleted successfully!");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Error deleting task!");
    }
  };

  // Update task status
  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${backendUrl}/tasks/${id}`, { status });
      toast.success("Task status updated!");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Error updating task status!");
    }
  };

  // Filter tasks based on the selected status
  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-8 px-4 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl md:w-[800px]">
        <h1 className="text-4xl font-semibold text-center text-gray-800 mb-6">Task <span className="text-4xl text-gray-500">Management</span></h1>

        {/* Filter Section */}
        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Enter Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              required
            />
          </div>
          <div>
            <select
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
          >
            Add Task
          </button>
        </form>

        {/* Tasks List */}
        <div className="mt-8 space-y-6">
          {filteredTasks.length === 0 ? (
            <p className="text-center text-gray-500">No tasks available</p>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-md shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex flex-col">
                  <span
                    className={`text-lg font-medium ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-800"}`}
                  >
                    {task.name}
                  </span>
                  <span
                    className={`text-sm font-semibold ${task.status === "completed" ? "text-green-500" : "text-yellow-500"}`}
                  >
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusChange(task.id, "completed")}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}

export default App;
