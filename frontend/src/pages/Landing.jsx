import React from 'react'
import { Link } from 'react-router-dom'
import { Brain, Zap, Shield, BarChart3, Chrome, ArrowRight, Check } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI-Powered', desc: 'Just describe what you want in plain English. Our AI figures out the steps.' },
  { icon: Zap, title: 'Instant Execution', desc: 'Runs automations in real-time directly on any webpage you visit.' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your data never leaves your browser. We only process the prompt.' },
  { icon: BarChart3, title: 'Full History', desc: 'Track every automation run with detailed logs and replay options.' },
]

const plans = [
  { name: 'Free', price: '$0', period: 'forever', features: ['50 runs / month', '3 saved workflows', 'Basic AI model', 'Community support'], cta: 'Get Started', href: '/register', highlight: false },
  { name: 'Pro', price: '$12', period: 'per month', features: ['Unlimited runs', 'Unlimited workflows', 'Priority AI model', 'Workflow recording', 'Email support'], cta: 'Start Pro', href: '/register?plan=pro', highlight: true },
  { name: 'Enterprise', price: '$49', period: 'per month', features: ['Everything in Pro', 'Team seats (5)', 'API access', 'Custom AI model', 'Priority support', 'Usage analytics'], cta: 'Start Enterprise', href: '/register?plan=enterprise', highlight: false },
]

export default function Landing() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 text-indigo-400 text-sm mb-8">
          <Chrome className="w-4 h-4" />
          Chrome Extension + AI
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Automate any website<br />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">with plain English</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mb-10">
          FlowPilot AI is a Chrome extension that understands your instructions and automates repetitive tasks on any webpage — no code required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center gap-2">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/pricing" className="border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
            View Pricing
          </Link>
        </div>
        <p className="text-slate-500 text-sm mt-6">No credit card required • 50 free runs/month</p>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Everything you need to automate</h2>
          <p className="text-slate-400 text-center mb-12">Powerful features that work on any website</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-center mb-12">Start free, upgrade when you need more</p>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`rounded-2xl p-6 border ${plan.highlight ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/10'}`}>
                {plan.highlight && <div className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">Most Popular</div>}
                <h3 className="text-white text-xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm ml-1">/{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.href} className={`block text-center py-3 rounded-xl font-semibold transition-colors ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border border-white/20 hover:border-white/40 text-white'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-slate-500 text-sm">
        © 2026 FlowPilot AI. All rights reserved.
      </footer>
    </div>
  )
}
