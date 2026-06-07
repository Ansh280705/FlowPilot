import React from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const plans = [
  {
    name: 'Free', price: '$0', period: 'forever', highlight: false,
    features: [
      { text: '50 runs / month', included: true },
      { text: '3 saved workflows', included: true },
      { text: 'Basic AI model', included: true },
      { text: 'Workflow recording', included: false },
      { text: 'Priority AI', included: false },
      { text: 'API access', included: false },
      { text: 'Team seats', included: false },
    ]
  },
  {
    name: 'Pro', price: '$12', period: 'per month', highlight: true,
    features: [
      { text: 'Unlimited runs', included: true },
      { text: 'Unlimited workflows', included: true },
      { text: 'Priority AI model', included: true },
      { text: 'Workflow recording', included: true },
      { text: 'Email support', included: true },
      { text: 'API access', included: false },
      { text: 'Team seats', included: false },
    ]
  },
  {
    name: 'Enterprise', price: '$49', period: 'per month', highlight: false,
    features: [
      { text: 'Unlimited runs', included: true },
      { text: 'Unlimited workflows', included: true },
      { text: 'Custom AI model', included: true },
      { text: 'Workflow recording', included: true },
      { text: 'API access', included: true },
      { text: 'Team seats (5)', included: true },
      { text: 'Priority support', included: true },
    ]
  },
]

export default function Pricing() {
  const { user } = useAuth()

  return (
    <div className="pt-16 min-h-screen px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, transparent pricing</h1>
          <p className="text-slate-400">Start free, upgrade as you grow. No hidden fees.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-2xl p-7 border ${plan.highlight ? 'bg-indigo-600/20 border-indigo-500 relative' : 'bg-white/5 border-white/10'}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div>
              )}
              <h3 className="text-white text-xl font-bold mb-1">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-1">/{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f.text} className="flex items-center gap-3 text-sm">
                    {f.included
                      ? <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      : <X className="w-4 h-4 text-slate-600 shrink-0" />}
                    <span className={f.included ? 'text-slate-300' : 'text-slate-600'}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={user ? '/settings' : `/register?plan=${plan.name.toLowerCase()}`}
                className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'border border-white/20 hover:border-white/40 text-white'
                }`}
              >
                {user ? (user.plan === plan.name.toLowerCase() ? 'Current Plan' : 'Switch Plan') : `Get ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
