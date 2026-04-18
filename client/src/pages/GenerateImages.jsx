import React, { useState } from 'react'
import { Image, Sparkles } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const GenerateImages = () => {
  const { getToken } = useAuth()

  const imageStyle = [
    'Realistic',
    'Ghibli style',
    'Anime style',
    'Cartoon style',
    'Fantasy style',
    'Realistic style',
    '3D style',
    'Portrait style'
  ]

  const [selectedStyle, setSelectedStyle] = useState('Realistic')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState('')
  const [error, setError] = useState('')
  const [publish, setPublish] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setGeneratedImage('')

    try {
      const token = await getToken()

      if (!token) {
        setError('You must be signed in to generate an image.')
        return
      }

      const res = await fetch(`${API_BASE}/api/ai/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: input.trim(),
          style: selectedStyle,
          publish
        })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.message || `Request failed (${res.status})`)
        return
      }

      setGeneratedImage(data.content || data.creation?.content || '')
    } catch (err) {
      setError(err?.message || 'Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      <form
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'
      >
        <div className='flex items-center gap-2'>
          <Sparkles className='w-6 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>AI Image Generator</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Describe Your Image</p>

        <textarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          rows={4}
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          placeholder='Describe what you want to see in the image..'
          required
        />

        <p className='mt-4 text-sm font-medium'>Style</p>

        <div className='mt-3 flex gap-3 flex-wrap'>
          {imageStyle.map((item, index) => (
            <span
              key={index}
              onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                selectedStyle === item
                  ? 'bg-green-50 text-[#00AD25] border-[#00AD25]'
                  : 'text-gray-500 border-gray-300'
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className='my-6 flex items-center gap-2'>
          <label className='relative cursor-pointer'>
            <input
              type='checkbox'
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className='sr-only peer'
            />
            <div className='w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition'></div>
            <span className='absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4'></span>
          </label>
          <p className='text-sm'>Make this image Public</p>
        </div>

        <button
          type='submit'
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#04FF50] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'
          disabled={loading}
        >
          <Image className='w-5' />
          {loading ? 'Generating...' : 'Generate Image'}
        </button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]'>
        <div className='flex items-center gap-3'>
          <Image className='w-5 h-5 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>Generated Image</h1>
        </div>

        <div className='flex-1 overflow-y-auto mt-4'>
          {error && <p className='text-sm text-red-600'>{error}</p>}

          {generatedImage ? (
            <div className='rounded-xl border border-gray-200 overflow-hidden bg-slate-50'>
              <img
                src={generatedImage}
                alt='Generated'
                className='w-full h-auto object-contain'
              />
              <div className='p-3 border-t border-gray-200 text-sm text-slate-600'>
                <p className='font-medium'>Prompt</p>
                <p>{input}</p>
                <p className='mt-2 font-medium'>Style</p>
                <p>{selectedStyle}</p>
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-full text-gray-400 gap-4 text-center'>
              <Image className='w-10 h-10' />
              <p>Enter a prompt and click &quot;Generate Image&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerateImages
