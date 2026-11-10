const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const dataFile = path.join(__dirname, "..", "data", "tasks.json");
const validStatuses = ["Pending", "In Progress", "Completed"];
const validPriorities = ["Low", "Medium", "High"];

async function readTasks() {
  try {
    const content = await fs.readFile(dataFile, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeTasks(tasks) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  const tempFile = `${dataFile}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(tasks, null, 2));
  await fs.rename(tempFile, dataFile);
}

function validateTask(body, partial = false) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) errors.push("Title is required.");
  }
  if (body.status !== undefined && !validStatuses.includes(body.status)) errors.push("Invalid status.");
  if (body.priority !== undefined && !validPriorities.includes(body.priority)) errors.push("Invalid priority.");
  if (body.description !== undefined && typeof body.description !== "string") errors.push("Description must be text.");
  if (body.dueDate !== undefined && body.dueDate !== "" && Number.isNaN(Date.parse(body.dueDate))) errors.push("Due date is invalid.");
  return errors;
}

async function getTasks(req, res, next) {
  try {
    let tasks = await readTasks();
    const { status, search } = req.query;
    if (status && status !== "All") tasks = tasks.filter(t => t.status === status);
    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t => `${t.title} ${t.description}`.toLowerCase().includes(q));
    }
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(tasks);
  } catch (error) { next(error); }
}

async function getTask(req, res, next) {
  try {
    const task = (await readTasks()).find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch (error) { next(error); }
}

async function createTask(req, res, next) {
  try {
    const errors = validateTask(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });
    const tasks = await readTasks();
    const now = new Date().toISOString();
    const task = {
      id: crypto.randomUUID(),
      title: req.body.title.trim(),
      description: (req.body.description || "").trim(),
      status: req.body.status || "Pending",
      priority: req.body.priority || "Medium",
      dueDate: req.body.dueDate || "",
      createdAt: now,
      updatedAt: now
    };
    tasks.push(task);
    await writeTasks(tasks);
    res.status(201).json(task);
  } catch (error) { next(error); }
}

async function updateTask(req, res, next) {
  try {
    const errors = validateTask(req.body, true);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });
    const tasks = await readTasks();
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Task not found." });
    const current = tasks[index];
    tasks[index] = {
      ...current,
      ...(req.body.title !== undefined && { title: req.body.title.trim() }),
      ...(req.body.description !== undefined && { description: req.body.description.trim() }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      ...(req.body.priority !== undefined && { priority: req.body.priority }),
      ...(req.body.dueDate !== undefined && { dueDate: req.body.dueDate }),
      updatedAt: new Date().toISOString()
    };
    await writeTasks(tasks);
    res.json(tasks[index]);
  } catch (error) { next(error); }
}

async function deleteTask(req, res, next) {
  try {
    const tasks = await readTasks();
    const remaining = tasks.filter(t => t.id !== req.params.id);
    if (remaining.length === tasks.length) return res.status(404).json({ message: "Task not found." });
    await writeTasks(remaining);
    res.json({ message: "Task deleted successfully." });
  } catch (error) { next(error); }
}

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
