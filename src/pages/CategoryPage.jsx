import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToTasks, subscribeToCategories, addTask as addTaskFirebase, updateTask } from '../firebase/firestore'

export default function CategoryPage() {
  const { categoryId } = useParams()
  const { currentUser } = useAuth()
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [newTask, setNewTask] = useState('')
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    const unsubscribeTasks = subscribeToTasks(currentUser.uid, (fetchedTasks) => {
      setTasks(fetchedTasks)
      setLoading(false)
    })

    const unsubscribeCategories = subscribeToCategories(currentUser.uid, (fetchedCategories) => {
      setCategories(fetchedCategories)
    })

    return () => {
      unsubscribeTasks()
      unsubscribeCategories()
    }
  }, [currentUser])

  const currentCategory = categories.find(cat => cat.id === categoryId)
  const categoryName = currentCategory ? currentCategory.name : categoryId

  const addTask = async () => {
    if (!newTask.trim() || !currentUser) return
    
    try {
      await addTaskFirebase(currentUser.uid, {
        text: newTask.trim(),
        completed: false,
        category: categoryName
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

  const categoryTasks = tasks.filter(t => t.category === categoryName)
  const activeTasks = categoryTasks.filter(t => !t.completed)
  const completedTasks = categoryTasks.filter(t => t.completed)

  return (
    <main className="main">
      <h2 className="title">{categoryName}</h2>

      <div className="input-row">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder={`Add a new ${categoryName.toLowerCase()} task...`}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
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
            <p>No active {categoryName.toLowerCase()} tasks</p>
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
        {loading ? (
          <p>Loading tasks...</p>
        ) : completedTasks.length === 0 ? (
          <p>No completed {categoryName.toLowerCase()} tasks</p>
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
