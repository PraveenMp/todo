import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Briefcase, Home, Folder, FileText, CreditCard, Menu, X, Moon, Sun, LogOut, User, CheckSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { logOut } from '../firebase/auth'

const defaultCategories = [
  { id: 'all-tasks', name: 'All Tasks', icon: 'LayoutGrid', path: '/', isDefault: true },
  { id: 'office', name: 'Office', icon: 'Briefcase', path: '/office', isDefault: true },
  { id: 'home', name: 'Home', icon: 'Home', path: '/home', isDefault: true },
  { id: 'projects', name: 'Projects', icon: 'Folder', path: '/projects', isDefault: true },
]

const defaultDocuments = []

const iconMap = {
  LayoutGrid: <LayoutGrid size={18} />,
  Briefcase: <Briefcase size={18} />,
  Home: <Home size={18} />,
  Folder: <Folder size={18} />,
  FileText: <FileText size={18} />,
  CreditCard: <CreditCard size={18} />,
}

export default function Sidebar({ darkMode, setDarkMode }) {
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
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#4F46E5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden'
            }}>
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'User'} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <User size={18} color="white" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '500', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.displayName || 'User'}
              </div>
              <div style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.email}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Todo Menu Section */}
      <div style={{ marginBottom: '20px' }}>
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? 'active' : ''}
          style={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 0',
            fontWeight: '600',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          <CheckSquare size={18} />
          Todo List
        </NavLink>
      </div>

      {/* Documents Section */}
      <div style={{ marginBottom: '20px' }}>
        <NavLink 
          to="/documents" 
          className={({ isActive }) => isActive ? 'active' : ''}
          style={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 0',
            fontWeight: '600',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          <FileText size={18} />
          My Documents
        </NavLink>
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
