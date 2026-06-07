import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Link } from 'react-router-dom'
import { User, CreditCard, Key, ArrowUpRight } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const copyToken = () => {
    const token = localStorage.getItem('fp_token')
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const planColor = { free: 'text-slate-400', pro: 'text-indigo-400', enterprise: 'text-purple-400' }

  return (
    <div className="pt-16 min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        {/* Profile */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-4 h-4 text-slate-400" />
            <h2 className="text-white font-semibold">Profile</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Name</span>
              <span className="text-white">{user?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Member since</span>
              <span className="text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <h2 className="text-white font-semibold">Plan & Billing</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className={`font-semibold capitalize ${planColor[user?.plan] || 'text-white'}`}>{user?.plan} Plan</span>
              {user?.plan === 'free' && <p className="text-slate-400 text-xs mt-1">50 runs/month • 3 workflows</p>}
              {user?.plan === 'pro' && <p className="text-slate-400 text-xs mt-1">Unlimited runs & workflows</p>}
              {user?.plan === 'enterprise' && <p className="text-slate-400 text-xs mt-1">Unlimited everything + team seats</p>}
            </div>
            {user?.plan !== 'enterprise' && (
              <Link to="/pricing" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                Upgrade <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Extension Token */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-4 h-4 text-slate-400" />
            <h2 className="text-white font-semibold">Extension Auth Token</h2>
          </div>
          <p className="text-slate-400 text-sm mb-4">Copy this token and paste it in the FlowPilot extension to link your account.</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-slate-400 text-xs font-mono truncate">
              {localStorage.getItem('fp_token')?.slice(0, 40)}...
            </div>
            <button onClick={copyToken} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
