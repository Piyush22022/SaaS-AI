import React, { useState } from 'react'
import { Sparkles, Edit } from 'lucide-react'
import Markdown from 'react-markdown'
import { useAuth } from '@clerk/clerk-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const WriteArticle = () => {
  const { getToken } = useAuth()

  const articleLength = [
    { length: 800, text: 'Short (500-800 words)' },
    { length: 1200, text: 'Medium (800-1200 words)' },
    { length: 1600, text: 'Long (1200+ words)' }
  ]

  const [selectedLength, setSelectedLength] = useState(articleLength[0])
  const [input, setInput] = useState('')
  const [article, setArticle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!input.trim()) return

    setLoading(true)
    setArticle('')
    setError('')

    const prompt = `Write a ${selectedLength.text} article about: ${input.trim()}`

    try {
      const token = await getToken({ skipCache: true })
      if (!token) {
        setError('You must be signed in to generate an article.')
        setLoading(false)
        return
      }

      const res = await fetch(`${API_BASE}/api/ai/generate-article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.message || `Request failed (${res.status})`)
        setLoading(false)
        return
      }

      if (data.success && data.content) {
        setArticle(data.content)
      } else {
        setError(data.message || 'No content returned')
      }
    } catch (err) {
      setError(
        err?.message ||
          'Could not reach the server. Is the API running on port 5000?'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>

      {/* LEFT COLUMN */}
      <form
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'
      >

        <div className='flex items-center gap-2'>
          <Sparkles className='w-6 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Article Configuration</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Article Topic</p>

        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          placeholder='The future of artificial intelligence is...'
          required
        />

        <p className='mt-4 text-sm font-medium'>Article Length</p>

        <div className='mt-3 flex gap-3 flex-wrap'>
          {articleLength.map((item, index) => (
            <span
              key={index}
              onClick={() => setSelectedLength(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                selectedLength.text === item.text
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 border-gray-300'
              }`}
            >
              {item.text}
            </span>
          ))}
        </div>

        <button
          type="submit"
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#226BFF] to-[#65ADFF] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'
          disabled={loading}
        >
          <Edit className='w-5' />
          {loading ? 'Generating...' : 'Generate article'}
        </button>

      </form>

      {/* RIGHT COLUMN */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]'>

        <div className='flex items-center gap-3'>
          <Edit className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Generated article</h1>
        </div>

        <div className='flex-1 mt-4 min-h-0 overflow-y-auto'>
          {error && (
            <p className='text-sm text-red-600' role="alert">{error}</p>
          )}
          {loading && (
            <p className='text-sm text-gray-500'>Generating your article…</p>
          )}
          {!loading && !error && !article && (
            <div className='text-sm flex flex-col items-center justify-center gap-5 text-gray-400 min-h-[200px]'>
              <Edit className='w-9 h-9' />
              <p className='text-center'>
                Enter a topic and click &quot;Generate article&quot; to get started
              </p>
            </div>
          )}
          {!loading && article && (
            <div className='reset-tw text-sm text-slate-700 pr-1'>
              <Markdown>{article}</Markdown>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default WriteArticle
