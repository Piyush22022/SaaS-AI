import { Hash, Sparkles } from 'lucide-react'
import React, { useState } from 'react'

const BlogTitles = () => {
  const blogCategories = [
    'General', 'Technology', 'Business', 'Health',
    'Lifestyle', 'Education', 'Travel', 'Food'
  ]

  const [selectedCategory, setSelectedCategory] = useState('General')
  const [input, setInput] = useState('')
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
  

    if (!input.trim()) return

    setLoading(true)
    setTitles([])

    // Simulate API call
    setTimeout(() => {
      const generatedTitles = [
        `${input}: A Complete Guide`,
        `Top 10 Facts About ${input}`,
        `Why ${input} is the Future of ${selectedCategory}`,
        `Beginner’s Guide to ${input}`,
        `Everything You Need to Know About ${input}`
      ]

      setTitles(generatedTitles)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>

      {/* LEFT COLUMN */}
      <form
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'
      >

        <div className='flex items-center gap-2'>
          <Sparkles className='w-6 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>AI Title Generator</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Keyword</p>

        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          placeholder='The future of artificial intelligence...'
          required
        />

        <p className='mt-4 text-sm font-medium'>Category</p>

        <div className='mt-3 flex gap-3 flex-wrap'>
          {blogCategories.map((item, index) => (
            <span
              key={index}
              onClick={() => setSelectedCategory(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                selectedCategory === item
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-500 border-gray-300'
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        <button
          type="submit"
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'
          disabled={loading}
        >
          <Hash className='w-5' />
          {loading ? 'Generating...' : 'Generate titles'}
        </button>

      </form>

      {/* RIGHT COLUMN */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]'>

        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Generated titles</h1>
        </div>

        <div className='flex-1 overflow-y-auto mt-4'>
          {titles.length > 0 ? (
            <ul className='space-y-3'>
              {titles.map((title, index) => (
                <li
                  key={index}
                  className='p-3 border rounded-md text-sm bg-gray-50'
                >
                  {title}
                </li>
              ))}
            </ul>
          ) : (
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400 h-full justify-center'>
              <Hash className='w-9 h-9' />
              <p>Enter a topic and click "Generate titles" to get started</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default BlogTitles