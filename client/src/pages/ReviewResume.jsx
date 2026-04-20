import React, { useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import Markdown from 'react-markdown'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ReviewResume = () => {
  const { getToken } = useAuth()
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setAnalysis('')
    setError('')
  }

  const handleReview = async () => {
    if (!file) {
      setError('Please upload a resume first.')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis('')

    try {
      const token = await getToken({ skipCache: true })
      if (!token) {
        setError('You must be signed in to review a resume.')
        return
      }

      const res = await fetch(`${API_BASE}/api/ai/review-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.message || `Request failed (${res.status})`)
        return
      }

      setAnalysis(data.analysis || '')
    } catch (err) {
      setError(err?.message || 'Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex justify-start">
      <div className="flex gap-6 w-full max-w-[1050px]">
        <div className="w-[420px] bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-green-500 w-5" />
            <h2 className="font-semibold text-lg">Resume Review</h2>
          </div>

          <p className="text-sm mb-2">Upload Resume</p>

          <input
            type="file"
            onChange={handleFileChange}
            className="w-full border border-gray-300 p-2 rounded-md text-sm"
            accept=".pdf,.png,.jpg,.jpeg,.txt"
          />

          <p className="text-xs text-gray-400 mt-2">
            Supports PDF, PNG, JPG, and TXT formats
          </p>

          <button
            onClick={handleReview}
            disabled={loading}
            className="w-full mt-5 flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-teal-500 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <FileText className="w-4" />
            {loading ? 'Reviewing...' : 'Review Resume'}
          </button>
        </div>

        <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-green-500 w-5" />
            <h2 className="font-semibold text-lg">Analysis Results</h2>
          </div>

          <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 min-h-[340px] p-5 overflow-y-auto">
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {!error && !analysis && file && !loading && (
              <p className="text-sm text-gray-600">
                Showing analysis for: <span className="font-medium">{file.name}</span>
              </p>
            )}

            {!error && !analysis && !file && !loading && (
              <div className="text-center text-gray-400">
                <FileText className="mx-auto mb-2 w-8 h-8" />
                <p className="text-sm">
                  Upload your resume and click <br />
                  "Review Resume" to get started
                </p>
              </div>
            )}

            {loading && (
              <p className="text-sm text-gray-500">Analyzing your resume...</p>
            )}

            {analysis && (
              <div className="reset-tw text-sm text-slate-700">
                <Markdown>{analysis}</Markdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewResume
