import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Heart } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const Community = () => {
  const [creations, setCreations] = useState([])
  const { user } = useUser()

  const fetchCreations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/creations/public`)
      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        setCreations(data.creations || [])
      } else {
        setCreations([])
      }
    } catch (error) {
      console.error('Failed to load public creations:', error)
      setCreations([])
    }
  }

  useEffect(() => {
    if (user) fetchCreations()
  }, [user])

  return (
    <div className='flex-1 h-full flex flex-col gap-2 p-6'>

      <h2 className='text-lg font-semibold'>Creations</h2>

      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll flex flex-wrap gap-4 p-4'>

        {creations.map((creation, index) => (
          
          <div key={index} className='w-full sm:w-[48%] lg:w-[32%]'>

            {/* ✅ Increased height */}
            <div className='relative group w-full h-[400px] rounded-xl overflow-hidden'>

              {creation.type === 'image' ? (
                <img
                  src={creation.content}
                  alt=""
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='w-full h-full p-4 bg-slate-50 text-slate-700 overflow-hidden'>
                  <p className='text-sm font-medium mb-2 line-clamp-2'>
                    {creation.prompt}
                  </p>
                  <p className='text-xs leading-5 text-slate-500 whitespace-pre-wrap overflow-hidden'>
                    {creation.content}
                  </p>
                </div>
              )}

              <div className='absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white opacity-0 group-hover:opacity-100 transition duration-300'>

                <p className='text-sm leading-tight mb-1'>
                  {creation.prompt}
                </p>

                <div className='flex items-center justify-end gap-1'>
                  <p className='text-sm'>{creation.likes?.length || 0}</p>

                  <Heart
                    className={`w-4 h-4 ${
                      creation.likes?.includes(user?.id)
                        ? 'fill-white text-white'
                        : 'text-white'
                    }`}
                  />
                </div>

              </div>

            </div>
          </div>

        ))}

      </div>
    </div>
  )
}

export default Community
