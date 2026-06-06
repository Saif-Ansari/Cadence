import { useState, useEffect } from 'react';

function App() {
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Runs once when the component mounts — fetches habits from the server
  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      // /api/habits gets proxied to http://localhost:5000/api/habits by Vite
      const res = await fetch('/api/habits');
      const data = await res.json();
      setHabits(data);
    } catch (err) {
      setError('Could not connect to the server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const newHabit = await res.json();
      setHabits([newHabit, ...habits]);
      setName('');
      setDescription('');
    } catch (err) {
      setError('Failed to add habit.');
    }
  };

  const toggleHabit = async (id) => {
    try {
      const res = await fetch(`/api/habits/${id}/toggle`, { method: 'PATCH' });
      const updated = await res.json();
      // Replace just the updated habit in state — no need to re-fetch all
      setHabits(habits.map((h) => (h._id === id ? updated : h)));
    } catch (err) {
      setError('Failed to update habit.');
    }
  };

  const deleteHabit = async (id) => {
    try {
      await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      setHabits(habits.filter((h) => h._id !== id));
    } catch (err) {
      setError('Failed to delete habit.');
    }
  };

  return (
    <div className="app">
      <h1>Habit Tracker</h1>

      <form onSubmit={addHabit} className="form">
        <input
          type="text"
          placeholder="Habit name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add Habit</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading habits...</p>}

      <ul className="habit-list">
        {habits.map((habit) => (
          <li key={habit._id} className={habit.isCompleted ? 'completed' : ''}>
            <div className="habit-info">
              <strong>{habit.name}</strong>
              {habit.description && <p>{habit.description}</p>}
            </div>
            <div className="actions">
              <button onClick={() => toggleHabit(habit._id)}>
                {habit.isCompleted ? 'Undo' : 'Done'}
              </button>
              <button
                onClick={() => deleteHabit(habit._id)}
                className="delete"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!loading && habits.length === 0 && (
        <p className="empty">No habits yet. Add one above!</p>
      )}
    </div>
  );
}

export default App;
