import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock3, ClipboardList, Plus, Search, Trash2, Pencil, X, ListTodo, LayoutDashboard, CalendarDays, AlertCircle } from "lucide-react";
import { taskApi } from "./services/api";

const emptyForm = { title: "", description: "", priority: "Medium", status: "Pending", dueDate: "" };

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    try {
      setError("");
      setTasks(await taskApi.getAll());
    } catch (err) { setError(`${err.message}. Make sure the backend is running on port 5000.`); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadTasks(); }, []);

  const counts = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === "Pending").length,
    progress: tasks.filter(t => t.status === "In Progress").length,
    completed: tasks.filter(t => t.status === "Completed").length
  }), [tasks]);

  const visibleTasks = useMemo(() => tasks.filter(task => {
    const matchesFilter = filter === "All" || task.status === filter;
    const term = query.toLowerCase();
    const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  }), [tasks, filter, query]);

  function openCreate() { setEditing(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(task) {
    setEditing(task.id);
    setForm({ title: task.title, description: task.description || "", priority: task.priority, status: task.status, dueDate: task.dueDate || "" });
    setModalOpen(true);
  }
  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editing) await taskApi.update(editing, form);
      else await taskApi.create(form);
      setModalOpen(false);
      await loadTasks();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function removeTask(id) {
    if (!window.confirm("Delete this task?")) return;
    try { await taskApi.remove(id); await loadTasks(); }
    catch (err) { setError(err.message); }
  }
  async function changeStatus(task, status) {
    try { await taskApi.update(task.id, { status }); await loadTasks(); }
    catch (err) { setError(err.message); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><ListTodo size={22}/></span><span>Task<span className="brand-accent">Flow</span></span></div>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><LayoutDashboard size={18}/> Overview</button>
      <button className="nav-item" onClick={() => setFilter("All")}><ClipboardList size={18}/> All tasks <span className="nav-count">{counts.total}</span></button>
      <div className="side-label side-label-spaced">TASK STATUS</div>
      {["Pending", "In Progress", "Completed"].map(status => <button key={status} className={`nav-item ${filter === status ? "selected" : ""}`} onClick={() => setFilter(status)}><span className={`status-dot ${status.toLowerCase().replace(" ", "-")}`}/>{status}</button>)}
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CheckCircle2 size={18}/></div><strong>Stay on track</strong><p>Small steps every day lead to big results.</p></div><span className="version">TASKFLOW · PERSONAL WORKSPACE</span></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><div className="eyebrow">WORKSPACE / OVERVIEW</div><h1>My Tasks</h1><p className="subtitle">Plan your work and get things done.</p></div><button className="primary-btn" onClick={openCreate}><Plus size={18}/> New task</button></header>
      {error && <div className="error-banner"><AlertCircle size={18}/>{error}<button onClick={() => setError("")}><X size={16}/></button></div>}
      <section className="stats-grid">
        <StatCard icon={<ClipboardList/>} label="Total tasks" value={counts.total} tone="purple"/>
        <StatCard icon={<Clock3/>} label="Pending" value={counts.pending} tone="orange"/>
        <StatCard icon={<Circle/>} label="In progress" value={counts.progress} tone="blue"/>
        <StatCard icon={<CheckCircle2/>} label="Completed" value={counts.completed} tone="green"/>
      </section>

      <section className="tasks-section">
        <div className="section-heading"><div><h2>Task list</h2><p>Keep an eye on everything you need to do.</p></div><div className="task-tools"><div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks..."/></div><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter tasks"><option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option></select></div></div>
        {loading ? <div className="empty-state">Loading tasks...</div> : visibleTasks.length === 0 ? <div className="empty-state"><div className="empty-icon"><ListTodo size={26}/></div><h3>{tasks.length ? "No matching tasks" : "Nothing on your list yet"}</h3><p>{tasks.length ? "Try another search or filter." : "Create your first task and start making progress."}</p>{!tasks.length && <button className="primary-btn" onClick={openCreate}><Plus size={17}/> Create a task</button>}</div> :
          <div className="task-list">{visibleTasks.map(task => <article className="task-card" key={task.id}>
            <button className={`task-check ${task.status === "Completed" ? "checked" : ""}`} title="Mark completed" onClick={() => changeStatus(task, task.status === "Completed" ? "Pending" : "Completed")}>{task.status === "Completed" ? <CheckCircle2 size={21}/> : <Circle size={21}/>}</button>
            <div className="task-info"><div className="task-title-row"><h3 className={task.status === "Completed" ? "done" : ""}>{task.title}</h3><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div>{task.description && <p className="task-description">{task.description}</p>}<div className="task-meta"><span className={`status-pill ${task.status.toLowerCase().replace(" ", "-")}`}>{task.status}</span>{task.dueDate && <span className="due-date"><CalendarDays size={14}/>{new Date(`${task.dueDate}T00:00:00`).toLocaleDateString()}</span>}</div></div>
            <div className="task-actions"><select aria-label="Change task status" value={task.status} onChange={e => changeStatus(task, e.target.value)}><option>Pending</option><option>In Progress</option><option>Completed</option></select><button title="Edit task" onClick={() => openEdit(task)}><Pencil size={16}/></button><button title="Delete task" className="delete-btn" onClick={() => removeTask(task.id)}><Trash2 size={16}/></button></div>
          </article>)}</div>}
      </section>
      <footer className="footer">Built with React + Express <span>·</span> Tasks are stored in a local JSON file</footer>
    </main>

    {modalOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}><form className="modal" onSubmit={submit}>
      <div className="modal-heading"><div><span className="eyebrow">{editing ? "UPDATE YOUR WORK" : "MAKE IT HAPPEN"}</span><h2>{editing ? "Edit task" : "Create a task"}</h2></div><button type="button" className="icon-btn" onClick={() => setModalOpen(false)}><X size={19}/></button></div>
      <label>Task title<input autoFocus required maxLength="100" placeholder="e.g. Prepare project presentation" value={form.title} onChange={e => setForm({...form, title:e.target.value})}/></label>
      <label>Description <span className="optional">· optional</span><textarea rows="3" maxLength="500" placeholder="Add a few details..." value={form.description} onChange={e => setForm({...form, description:e.target.value})}/></label>
      <div className="form-row"><label>Priority<select value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value})}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label></div>
      <label>Due date <span className="optional">· optional</span><input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})}/></label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create task"}</button></div>
    </form></div>}
  </div>;
}

function StatCard({ icon, label, value, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong></div></div>;
}
export default App;
