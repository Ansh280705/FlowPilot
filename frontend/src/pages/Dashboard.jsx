import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Zap, BarChart3, Clock, ArrowUpRight, Trash2 } from 'lucide-react'

const PLAN_LIMITS = { free: 50, pro: Infinity, enterprise: Infinity }

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ runsThisMonth: 0, totalWorkflows: 0, totalExecutions: 0 })
  const [workflows, setWorkflows] = useState([])
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [wRes, eRes, sRes] = await Promise.all([
        axios.get('/api/workflows'),
        axios.get('/api/executions'),
        axios.get('/api/auth/usage'),
      ])
      setWorkflows(Array.isArray(wRes.data) ? wRes.data : [])
      setExecutions(Array.isArray(eRes.data) ? eRes.data.slice(0, 5) : [])
      setStats(sRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const deleteWorkflow = async (id) => {
    if (!confirm('Delete this workflow?')) return
    await axios.delete(`/api/workflows/${id}`)
    loadData()
  }

  const plan = user?.plan || 'free'
  const runLimit = PLAN_LIMITS[plan]
  const usedRuns = stats.runsThisMonth || 0
  const runPct = runLimit === Infinity ? 0 : Math.min((usedRuns / runLimit) * 100, 100)

  if (loading) return <div className="flex items-center justify-center h-screen text-white">Loading...</div>

  return (
    <div className="pt-16 min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name || user?.email} 👋</h1>
            <p className="text-slate-400 text-sm mt-1 capitalize">{plan} plan</p>
          </div>
          {plan === 'free' && (
            <Link to="/pricing" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
              Upgrade <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Usage bar */}
        {plan === 'free' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300 font-medium">Runs this month</span>
              <span className={usedRuns >= runLimit ? 'text-red-400' : 'text-slate-400'}>{usedRuns} / {runLimit}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full">
              <div
                className={`h-2 rounded-full transition-all ${runPct >= 90 ? 'bg-red-500' : runPct >= 70 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                style={{ width: `${runPct}%` }}
              />
            </div>
            {usedRuns >= runLimit && (
              <p className="text-red-400 text-xs mt-2">
                Limit reached. <Link to="/pricing" className="underline">Upgrade to Pro</Link> for unlimited runs.
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Zap, label: 'Runs This Month', value: usedRuns, color: 'text-indigo-400' },
            { icon: BarChart3, label: 'Total Workflows', value: workflows.length, color: 'text-purple-400' },
            { icon: Clock, label: 'Total Executions', value: stats.totalExecutions || 0, color: 'text-blue-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-slate-400 text-sm">{label}</div>
            </div>
          ))}
        </div>

        {/* Workflows */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Saved Workflows</h2>
          {workflows.length === 0 ? (
            <p className="text-slate-400 text-sm">No workflows yet. Use the extension to create one.</p>
          ) : (
            <div className="space-y-3">
              {workflows.map(w => (
                <div key={w.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{w.name}</p>
                    <p className="text-slate-400 text-xs">{w.steps?.length || 0} steps</p>
                  </div>
                  <button onClick={() => deleteWorkflow(w.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent executions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Recent Runs</h2>
          {executions.length === 0 ? (
            <p className="text-slate-400 text-sm">No runs yet.</p>
          ) : (
            <div className="space-y-3">
              {executions.map(e => (
                <div key={e.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${
                      e.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      e.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>{e.status}</span>
                    <span className="text-slate-400 text-xs">{new Date(e.startedAt).toLocaleString()}</span>
                  </div>
                  <span className="text-slate-500 text-xs">{e.logs?.length || 0} steps</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
