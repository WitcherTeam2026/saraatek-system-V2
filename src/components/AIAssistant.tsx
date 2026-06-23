import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { invoke } from '@tauri-apps/api/core'
import { api } from '../lib/api'
import { Bot, Send, X, Minimize2, Maximize2, Loader2, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface QuickAction {
  label: string
  query: string
}

const quickActions: QuickAction[] = [
  { label: 'Open repairs today', query: 'How many repairs are open today?' },
  { label: 'Revenue this month', query: 'What is the revenue this month?' },
  { label: 'Top customer', query: 'Who is my top customer?' },
  { label: 'Pending payments', query: 'Any pending payments?' },
  { label: 'Warranty expiring', query: 'Any warranties expiring soon?' },
]

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I can answer questions about your repair shop data. Try asking me about repairs, customers, revenue, or anything else!",
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const buildContext = async (): Promise<string> => {
    const contextParts: string[] = []
    
    try {
      // Get dashboard counts
      const counts = await api.repairs.dashboardCounts()
      contextParts.push(`Dashboard counts: Open=${counts.open_repairs}, Awaiting=${counts.awaiting_approval}, Repairing=${counts.repairing}, Ready=${counts.ready_for_collection}`)
    } catch (e) {
      console.error('Failed to get dashboard counts:', e)
    }

    try {
      // Get recent repairs with full details
      const repairs = await api.repairs.list({ sort_by: 'received_at', sort_order: 'desc' })
      const recent = repairs.slice(0, 10)
      if (recent.length > 0) {
        contextParts.push(`Recent repairs (last ${recent.length}):`)
        recent.forEach(r => {
          contextParts.push(`- ID: ${r.repair.id} | Customer: ${r.customer_name} | Phone: ${r.customer_phone} | Device: ${r.repair.brand} ${r.repair.model || 'N/A'} ${r.repair.device_type || ''} | S/N: ${r.repair.serial_number || 'N/A'} | Problem: ${r.repair.reported_problem} | Status: ${r.repair.status}`)
        })
      }
    } catch (e) {
      console.error('Failed to get repairs:', e)
    }

    try {
      // Get revenue
      const today = new Date().toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      const revenueToday = await api.reports.summary(today, today, false)
      const revenueMonth = await api.reports.summary(monthStart, today, false)
      contextParts.push(`Revenue: Today=LKR ${revenueToday.revenue.total}, This month=LKR ${revenueMonth.revenue.total}`)
    } catch (e) {
      console.error('Failed to get revenue:', e)
    }

    return contextParts.length > 0 ? contextParts.join('\n') : 'No data available yet'
  }

  const handleSend = async (query?: string) => {
    const userMessage = query || input.trim()
    if (!userMessage || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }])
    setLoading(true)

    try {
      const context = await buildContext()
      
      // No settings needed - using OpenCode Zen directly

      const systemPrompt = `You are a repair shop AI assistant. Data: ${context}. Rules: Use natural language. No markdown. No symbols. LKR currency. Commas in numbers. Status: Open=New, Awaiting=Waiting, Repairing=Being fixed, Ready=Ready for pickup, Completed=Done, Cancelled=Cancelled. Lists on new lines without bullets. Concise answers.`

      let assistantMessage = ''

      // Use Tauri backend to call AI (avoids CORS)
      try {
        assistantMessage = await invoke<string>('chat_with_ai', {
          systemPrompt,
          userPrompt: userMessage,
        })
      } catch (e) {
        console.error('AI error:', e)
      }

      // Strip all markdown formatting
      if (assistantMessage) {
        assistantMessage = assistantMessage
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/`/g, '')
          .replace(/_/g, '')
          .replace(/~/g, '')
          .replace(/^-\s/gm, '')
          .replace(/^>\s/gm, '')
          .trim()
        setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage, timestamp: Date.now() }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'AI returned empty response. Please try again.', timestamp: Date.now() }])
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${String(e)}`, timestamp: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-hover shadow-lg shadow-brand-purple/30 flex items-center justify-center text-white hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={20} /> : <Bot size={20} />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed bottom-24 right-6 z-50 w-[380px] rounded-2xl overflow-hidden ${
              isMinimized ? 'h-14' : 'h-[500px]'
            }`}
            style={{
              background: 'rgba(15, 15, 17, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center">
                  <Sparkles size={14} className="text-brand-purple" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">AI Assistant</h3>
                  <p className="text-[10px] text-text-muted">Ask about your business</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted transition-colors"
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[380px]">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                          msg.role === 'user'
                            ? 'bg-brand-purple/20 text-text-primary rounded-br-sm'
                            : 'bg-white/5 text-text-primary rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/5 px-3 py-2 rounded-xl rounded-bl-sm">
                        <Loader2 size={14} className="animate-spin text-brand-purple" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length <= 2 && (
                  <div className="px-4 pb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => handleSend(action.query)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask about your business..."
                      className="flex-1 px-3 py-2 rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30 transition-all"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || loading || cooldown > 0}
                      className="p-2 rounded-xl bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {cooldown > 0 ? `${cooldown}s` : <Send size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIAssistant
