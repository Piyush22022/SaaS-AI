import React, { useEffect, useState } from 'react'
import { Gem, Sparkles } from 'lucide-react'
import { Protect, useAuth } from '@clerk/clerk-react'
import CreationItem from '../components/CreationItem'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const Dashboard = () => {
  const [creations, setCreations] = useState([])
  const { getToken, isSignedIn } = useAuth()

  const getDashboardData = async () => {
    try {
      const token = await getToken()
      if (!token) {
        setCreations([])
        return
      }

      const res = await fetch(`${API_BASE}/api/creations/mine`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        setCreations(data.creations || [])
      } else {
        setCreations([])
      }
    } catch (error) {
      console.error('Failed to load dashboard creations:', error)
      setCreations([])
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      getDashboardData()
    }
  }, [isSignedIn, getToken])

  return (
    <div className='h-full overflow-y-scroll p-6'>
      <div className='flex justify-start gap-4 flex-wrap'>
        
        {/* Total Creations Card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Total creations</p>
            <h2 className='text-xl font-semibold'>{creations.length}</h2>
          </div>

          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center'>
            <Sparkles className='w-5 text-white' />
          </div>
        </div>

        {/* Active Plan Card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Active Plan</p>
            <h2 className='text-xl font-semibold'>
              <Protect plan='premium' fallback="Free">
                Premium
              </Protect>
            </h2>
          </div>

          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center'>
            <Gem className='w-5 text-white' />
          </div>
        </div>

      </div>

      <div className='space-y-3'>
        <p className='mt-6 mb-4'>Recent Creations</p>
        {
          creations.map((item) => <CreationItem key={item.id} item={item} />)
        }

      </div>
    </div>
  )
}

export default Dashboard
