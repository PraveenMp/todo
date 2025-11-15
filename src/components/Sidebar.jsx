import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Briefcase, Home, Folder, Settings, ChevronDown, ChevronRight, CheckSquare, FileText, CreditCard, Menu, X, Moon, Sun, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { logOut } from '../firebase/auth'
import { subscribeToCategories, subscribeToDocuments } from '../firebase/firestore'

const defaultCategories = [
  { id: 'all-tasks', name: 'All Tasks', icon: 'LayoutGrid', path: '/', isDefault: true },
  { id: 'office', name: 'Office', icon: 'Briefcase', path: '/office', isDefault: true },
  { id: 'home', name: 'Home', icon: 'Home', path: '/home', isDefault: true },
  { id: 'projects', name: 'Projects', icon: 'Folder', path: '/projects', isDefault: true },
]

const defaultDocuments = [
  { id: 'driving-licence', name: 'Driving Licence', icon: 'FileText', isDefault: true },
  { id: 'pan-info', name: 'Pan Info', icon: 'CreditCard', isDefault: true },
]

const iconMap = {
  LayoutGrid: <LayoutGrid size={18} />,
  Briefcase: <Briefcase size={18} />,
  Home: <Home size={18} />,
  Folder: <Folder size={18} />,
  FileText: <FileText size={18} />,
  CreditCard: <CreditCard size={18} />,
}

export default function Sidebar({ darkMode, setDarkMode }) {
  const [todoOpen, setTodoOpen] = useState(true)
  const [documentsOpen, setDocumentsOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const handleLogout = async () => {
    const result = await logOut()
    if (result.success) {
      navigate('/login')
    }
  }
  
  const [categories, setCategories] = useState(defaultCategories)
  const [documents, setDocuments] = useState(defaultDocuments)

  useEffect(() => {
    if (!currentUser) return
    
    const unsubscribeCategories = subscribeToCategories(currentUser.uid, (firebaseCategories) => {
      // Filter out items that match default IDs to prevent duplicates
      const defaultIds = defaultCategories.map(cat => cat.id)
      const customCategories = firebaseCategories.filter(cat => !defaultIds.includes(cat.id))
      const allCategories = [...defaultCategories, ...customCategories]
      setCategories(allCategories)
    })
    
    const unsubscribeDocuments = subscribeToDocuments(currentUser.uid, (firebaseDocuments) => {
      // Filter out items that match default IDs to prevent duplicates
      const defaultIds = defaultDocuments.map(doc => doc.id)
      const customDocuments = firebaseDocuments.filter(doc => !defaultIds.includes(doc.id))
      const allDocuments = [...defaultDocuments, ...customDocuments]
      setDocuments(allDocuments)
    })
    
    return () => {
      unsubscribeCategories()
      unsubscribeDocuments()
    }
  }, [currentUser])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button 
        className={`mobile-menu-toggle ${mobileMenuOpen ? 'menu-open' : ''}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
      <div>
        <h1>TodoApp</h1>
        <p>Your Productivity Partner</p>
        
        {currentUser && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: darkMode ? '#404040' : '#f3f4f6',
            borderRadius: '6px',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
              {currentUser.displayName || 'User'}
            </div>
            <div style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>
              {currentUser.email}
            </div>
          </div>
        )}
      </div>

      {/* Todo Menu Section */}
      <div style={{ marginBottom: '20px' }}>
        <div 
          onClick={() => setTodoOpen(!todoOpen)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 0',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          {todoOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <CheckSquare size={18} />
          Todo Menu
        </div>
        
        {todoOpen && (
          <ul style={{ marginLeft: '10px' }}>
            {categories.map((cat) => {
              const path = cat.path || `/category/${cat.id}`
              return (
                <li key={cat.id}>
                  <NavLink to={path} className={({ isActive }) => isActive ? 'active' : ''}>
                    {iconMap[cat.icon] || <Folder size={18} />}
                    {cat.name}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        )}
        
        {todoOpen && (
          <NavLink 
            to="/manage-categories" 
            className="add-category" 
            style={{ 
              textDecoration: 'none',
              marginLeft: '10px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <Settings size={16} />
            Manage Categories
          </NavLink>
        )}
      </div>

      {/* Documents Section */}
      <div style={{ marginBottom: '20px' }}>
        <div 
          onClick={() => setDocumentsOpen(!documentsOpen)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 0',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          {documentsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <FileText size={18} />
          Documents
        </div>
        
        {documentsOpen && (
          <ul style={{ marginLeft: '10px' }}>
            {documents.map((doc) => {
              const path = `/document/${doc.id}`
              return (
                <li key={doc.id}>
                  <NavLink to={path} className={({ isActive }) => isActive ? 'active' : ''}>
                    {iconMap[doc.icon] || <FileText size={18} />}
                    {doc.name}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        )}
        
        {documentsOpen && (
          <NavLink 
            to="/manage-documents" 
            className="add-category" 
            style={{ 
              textDecoration: 'none',
              marginLeft: '10px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <Settings size={16} />
            Manage Documents
          </NavLink>
        )}
      </div>

      {/* Dark Mode Toggle & Logout */}
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: darkMode ? '1px solid #404040' : '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            width: '100%',
            padding: '10px',
            background: darkMode ? '#374151' : '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: darkMode ? '#f3f4f6' : '#374151'
          }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        
        {currentUser && (
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: darkMode ? '#7f1d1d' : '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ef4444'
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        )}
      </div>
    </aside>
    </>
  )
}
