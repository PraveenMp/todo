import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToHabits, addHabit as addHabitFirebase, updateHabit as updateHabitFirebase, deleteHabit as deleteHabitFirebase } from '../firebase/firestore'
import '../styles/Habits.css'

const createHabitId = () => `habit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const getDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatMonthLabel = (date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

const getMonthDays = (monthDate) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1))
}

export default function Habits() {
  const { currentUser } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [habits, setHabits] = useState([])
  const [newHabitName, setNewHabitName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setHabits([])
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToHabits(currentUser.uid, (fetchedHabits) => {
      setHabits(fetchedHabits)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const monthDays = useMemo(() => getMonthDays(selectedMonth), [selectedMonth])

  const goToPreviousMonth = () => {
    setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
  }

  const addHabit = async () => {
    const trimmed = newHabitName.trim()
    if (!trimmed || !currentUser) return

    const newHabit = {
      id: createHabitId(),
      name: trimmed,
      records: {}
    }

    try {
      await addHabitFirebase(currentUser.uid, newHabit)
      setNewHabitName('')
    } catch (error) {
      console.error('Error adding habit:', error)
    }
  }

  const deleteHabit = async (habitId) => {
    if (!currentUser) return

    try {
      await deleteHabitFirebase(currentUser.uid, habitId)
    } catch (error) {
      console.error('Error deleting habit:', error)
    }
  }

  const toggleHabitDay = async (habitId, date) => {
    if (!currentUser) return

    const habit = habits.find(item => item.id === habitId)
    if (!habit) return

    const dateKey = getDateKey(date)
    const nextRecords = { ...(habit.records || {}) }

    if (nextRecords[dateKey]) {
      delete nextRecords[dateKey]
    } else {
      nextRecords[dateKey] = true
    }

    try {
      await updateHabitFirebase(currentUser.uid, habitId, { records: nextRecords })
    } catch (error) {
      console.error('Error updating habit:', error)
    }
  }

  return (
    <main className="habit-page">
      <div className="habit-card">
        <div className="habit-input-row">
          <input
            type="text"
            value={newHabitName}
            onChange={(event) => setNewHabitName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addHabit()
            }}
            placeholder="Enter habit name"
            className="habit-input"
          />
          <button className="habit-add-button" onClick={addHabit}>
            <Plus size={16} />
            Add Habit
          </button>

                    <div className="month-switcher" aria-label="Month navigation">
            <button type="button" className="nav-button" onClick={goToPreviousMonth} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <span className="month-label">{formatMonthLabel(selectedMonth)}</span>
            <button type="button" className="nav-button" onClick={goToNextMonth} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="habit-loading">Loading habits...</div>
        ) : (
          <div className="habit-table">
            <div className="habit-table-header">
              <div className="habit-name-column">Habits</div>
              <div className="habit-days-column">
                {monthDays.map((day) => (
                  <div key={getDateKey(day)} className="day-number-box">
                    {day.getDate()}
                  </div>
                ))}
              </div>
            </div>

            {habits.length === 0 ? (
              <div className="habit-empty-state">No habits yet. Add your first habit above.</div>
            ) : (
              habits.map((habit) => (
                <div key={habit.id} className="habit-row">
                  <div className="habit-name-column habit-name-wrap">
                    <span>{habit.name}</span>
                    <button
                      type="button"
                      className="delete-habit-button"
                      onClick={() => deleteHabit(habit.id)}
                      aria-label={`Delete ${habit.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="habit-days-column">
                    {monthDays.map((day) => {
                      const dateKey = getDateKey(day)
                      const checked = Boolean((habit.records && habit.records[dateKey]))

                      return (
                        <label key={`${habit.id}-${dateKey}`} className="habit-checkbox-wrap">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleHabitDay(habit.id, day)}
                            aria-label={`${habit.name} for ${dateKey}`}
                          />
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  )
}
