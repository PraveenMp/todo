import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToTasks, addTask as addTaskFirebase, updateTask } from '../firebase/firestore'

export default function Office() {
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
        category: 'Office'
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

  const officeTasks = tasks.filter(t => t.category === 'Office')
  const activeTasks = officeTasks.filter(t => !t.completed)
  const completedTasks = officeTasks.filter(t => t.completed)

  return (
    <main className="main">
      <h2 className="title">Office</h2>

      <div className="input-row">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new office task..."
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
            <p>No active office tasks</p>
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
          <p>No completed office tasks</p>
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
