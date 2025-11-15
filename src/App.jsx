import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import AllTasks from './pages/AllTasks'
import Office from './pages/Office'
import Home from './pages/Home'
import Projects from './pages/Projects'
import CategoryPage from './pages/CategoryPage'
import ManageCategories from './pages/ManageCategories'
import DocumentPage from './pages/DocumentPage'
import ManageDocuments from './pages/ManageDocuments'

function AppContent() {
  const { darkMode, setDarkMode } = useAuth()

  return (
    <div className="layout">
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Routes>
        <Route path="/" element={<ProtectedRoute><AllTasks /></ProtectedRoute>} />
        <Route path="/office" element={<ProtectedRoute><Office /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/manage-categories" element={<ProtectedRoute><ManageCategories /></ProtectedRoute>} />
        <Route path="/category/:categoryId" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
        <Route path="/document/:documentId" element={<ProtectedRoute><DocumentPage /></ProtectedRoute>} />
        <Route path="/manage-documents" element={<ProtectedRoute><ManageDocuments /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/todo">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
