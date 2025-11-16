import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToTasks, addTask as addTaskFirebase, updateTask, deleteTask as deleteTaskFirebase } from '../firebase/firestore'
import { X } from 'lucide-react'

export default function Projects() {
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
        category: 'Projects'
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

  const deleteTask = async (taskId) => {
    if (!currentUser || !confirm('Are you sure you want to delete this task?')) return
    
    try {
      await deleteTaskFirebase(currentUser.uid, taskId)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const projectTasks = tasks.filter(t => t.category === 'Projects')
  const activeTasks = projectTasks.filter(t => !t.completed)
  const completedTasks = projectTasks.filter(t => t.completed)

  return (
    <main className="main">
      <h2 className="title">Projects</h2>

      <div className="input-row">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new project task..."
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
            <p>No active project tasks</p>
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
          <p>No completed project tasks</p>
        ) : (
          completedTasks.map(task => (
            <div key={task.id} className="task" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="task-completed">{task.text}</span>
                {task.category && <span className="badge">{task.category}</span>}
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  padding: '4px 8px',
                  background: '#FECACA',
                  color: '#DC2626',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  flexShrink: 0
                }}
                title="Delete task"
              >
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
