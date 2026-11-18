"use client"

import { useState } from 'react'
import { useWebsiteSettings } from '../store/settingsStore'

export default function ContactPage() {
  const settings = useWebsiteSettings()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  function update(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#FFFFFF' }}>
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <div className="badge mb-2 pt-8" style={{ color: '#FF6A00' }}>GET IN TOUCH</div>
        <h1 className="text-4xl font-bold text-[#111111] mb-3">Contact Us</h1>
        <p className="mb-10" style={{ color: '#111111' }}>We're here to help. Reach out and we'll respond within 24 hours.</p>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: '📞', label: 'Phone / WhatsApp', val: `${settings.phoneNumber || '+250789545954'} / WhatsApp: ${settings.whatsappNumber || '+250789545954'}` },
              { icon: '✉️', label: 'Email', val: settings.companyEmail || 'hello@dubazaarmart.com' },
              { icon: '📍', label: 'Office', val: settings.businessAddress || 'KG 15 Ave, Kimihurura, Kigali' },
              { icon: '⏰', label: 'Hours', val: 'Mon–Sat: 8am – 8pm\nSun: 10am – 6pm' },
            ].map(item => (
              <div key={item.label} className="flex gap-4 p-5 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: '#FF6A00' }}>{item.label}</div>
                  <div className="text-sm text-[#111111] whitespace-pre-line">{item.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-3 p-6 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
            {sent ? (
              <div className="py-12 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-[#111111] mb-2">Message Sent!</h3>
                <p style={{ color: '#111111' }}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setSent(true) }} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#0B5B24' }}>Full Name</label>
                    <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your name" className="w-full px-4 py-3 rounded-xl text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#0B5B24' }}>Email</label>
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#0B5B24' }}>Subject</label>
                  <input value={form.subject} onChange={e => update('subject', e.target.value)} placeholder="Order issue, product inquiry..." className="w-full px-4 py-3 rounded-xl text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#0B5B24' }}>Message</label>
                  <textarea value={form.message} onChange={e => update('message', e.target.value)} placeholder="Tell us how we can help..." rows={5} className="w-full px-4 py-3 rounded-xl text-sm resize-none" required />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl font-bold btn-gold">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
