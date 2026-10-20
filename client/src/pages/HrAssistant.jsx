import { useEffect, useRef, useState } from 'react'
import { BotIcon, MessageCircleIcon, RotateCcwIcon, SendIcon, SparklesIcon, UserIcon, XIcon } from 'lucide-react'
import api from '../api/axios'

const suggestions = [
  'How do I apply for leave?',
  'Can I cancel a pending leave request?',
  'How do I request an attendance correction?',
  'Where can I find company documents?',
  'How do I contact a colleague?',
  'Where can I find company announcements?',
]

const renderMessage = (content) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part
  )
}

const HrAssistant = ({ onClose }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const sendMessage = async (text = input) => {
    const content = text.trim()
    if (!content || sending) return

    const nextMessages = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    setError('')
    setSending(true)

    try {
      const { data } = await api.post('/hr-assistant/chat', { messages: nextMessages.slice(-8) })
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not reach the HR assistant. Please try again.')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><BotIcon className="size-4" /></div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">HR assistant</h2>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">StaffFlow policy help</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 0 && (
            <button type="button" onClick={() => { setMessages([]); setError('') }} className="btn-secondary h-8 px-2.5 text-xs" aria-label="Start a new chat" title="New chat">
              <RotateCcwIcon className="size-3.5" /> <span className="hidden sm:inline">New chat</span>
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" aria-label="Close HR assistant">
            <XIcon className="size-4" />
          </button>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="HR assistant chat">
        <div className="flex-1 p-4 sm:p-5 space-y-5 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
              <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <SparklesIcon className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">How can I help?</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Get practical help with StaffFlow’s employee tools and policies.</p>
              <div className="mt-6 grid sm:grid-cols-2 gap-2 w-full text-left">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <div className="size-8 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center"><BotIcon className="size-4" /></div>}
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100'}`}>
                  {renderMessage(message.content)}
                </div>
                {message.role === 'user' && <div className="size-8 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center"><UserIcon className="size-4" /></div>}
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-3 items-center text-sm text-zinc-500 dark:text-zinc-400">
              <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center"><BotIcon className="size-4" /></div>
              <span className="animate-pulse">Thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 sm:p-4">
          {error && <p role="alert" className="mb-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <label htmlFor="hr-assistant-message" className="sr-only">Your question</label>
            <textarea
              ref={inputRef}
              id="hr-assistant-message"
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 2000))}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSubmit(event) } }}
              placeholder="Ask a question…"
              rows={1}
              maxLength={2000}
              disabled={sending}
              className="flex-1 resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-60"
            />
            <button type="submit" disabled={sending || !input.trim()} className="size-10 shrink-0 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Send message">
              <SendIcon className="size-4" />
            </button>
          </form>
          <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1"><MessageCircleIcon className="size-3" /> Messages are processed by the configured AI provider. Avoid sharing sensitive personal information. Confirm personal or unclear matters with HR.</p>
        </div>
      </section>
    </div>
  )
}

export default HrAssistant
