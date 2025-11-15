import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToTasks, addTask as addTaskFirebase, updateTask } from '../firebase/firestore'

export default function Home() {
  const { currentUser } = useAuth()
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToTasks(currentUser.uid, (fetchedTasks) => {
      setTasks(fetchedTasks)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const addTask = async () => {
    if (!newTask.trim() || !currentUser) return
    
    try {
      await addTaskFirebase(currentUser.uid, {
        text: newTask.trim(),
        completed: false,
        category: 'Home'
      })
      setNewTask('')
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const toggleTask = async (taskId, currentStatus) => {
    if (!currentUser) return
    
    try {
      await updateTask(currentUser.uid, taskId, { completed: !currentStatus })
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const homeTasks = tasks.filter(t => t.category === 'Home')
  const activeTasks = homeTasks.filter(t => !t.completed)
  const completedTasks = homeTasks.filter(t => t.completed)

  return (
    <main className="main">
      <h2 className="title">Home</h2>

      <div className="input-row">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new home task..."
        />
        <button onClick={addTask}>＋</button>
      </div>

      <div className="tabs">
        <button
          onClick={() => setTab('active')}
          className={tab === 'active' ? 'active' : ''}
        >
          Active
        </button>
        <button
          onClick={() => setTab('completed')}
          className={tab === 'completed' ? 'active' : ''}
        >
          Completed
        </button>
      </div>

      {tab === 'active' && (
        <div className="card">
          {loading ? (
            <p>Loading tasks...</p>
          ) : activeTasks.length === 0 ? (
            <p>No active home tasks</p>
          ) : (
            activeTasks.map(task => (
              <div key={task.id} className="task">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                />
                <span>{task.text}</span>
              </div>
            ))
          )}
        </div>
      )}

      <h3 style={{ marginTop: '30px', marginBottom: '10px' }}>Completed</h3>
      <div className="card">
        {completedTasks.length === 0 ? (
          <p>No completed home tasks</p>
        ) : (
          completedTasks.map(task => (
            <div key={task.id} className="task" style={{ justifyContent: 'space-between' }}>
              <span className="task-completed">{task.text}</span>
              {task.category && <span className="badge">{task.category}</span>}
            </div>
          ))
        )}
      </div>
    </main>
  )
}
