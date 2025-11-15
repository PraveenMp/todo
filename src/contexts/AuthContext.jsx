import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange } from '../firebase/auth'
import { getUserSettings, saveUserSettings } from '../firebase/firestore'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user)
      
      if (user) {
        // Load user settings
        const settings = await getUserSettings(user.uid)
        setDarkMode(settings.darkMode || false)
        
        if (settings.darkMode) {
          document.body.classList.add('dark-mode')
        } else {
          document.body.classList.remove('dark-mode')
        }
      } else {
        // Load from localStorage for non-authenticated users
        const stored = localStorage.getItem('darkMode')
        const isDark = stored === 'true'
        setDarkMode(isDark)
        
        if (isDark) {
          document.body.classList.add('dark-mode')
        } else {
          document.body.classList.remove('dark-mode')
        }
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const toggleDarkMode = async (newMode) => {
    setDarkMode(newMode)
    
    if (newMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }

    if (currentUser) {
      await saveUserSettings(currentUser.uid, { darkMode: newMode })
    } else {
      localStorage.setItem('darkMode', newMode)
    }
  }

  const value = {
    currentUser,
    loading,
    darkMode,
    setDarkMode: toggleDarkMode
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
