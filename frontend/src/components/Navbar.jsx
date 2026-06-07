import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Brain, Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f17]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">FlowPilot AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/pricing" className="text-slate-400 hover:text-white transition-colors text-sm">Pricing</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">Dashboard</Link>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors text-sm">Logout</button>
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-400 hover:text-white transition-colors text-sm">Login</Link>
              <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Get Started Free
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0f0f17] border-b border-white/10 px-4 py-4 flex flex-col gap-4">
          <Link to="/pricing" className="text-slate-400" onClick={() => setMenuOpen(false)}>Pricing</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-400" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="text-left text-slate-400">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-400" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="text-indigo-400" onClick={() => setMenuOpen(false)}>Get Started Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
