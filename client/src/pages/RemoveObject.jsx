import React, { useState } from 'react'
import { Image as ImageIcon, Sparkles, Scissors } from 'lucide-react'
import { removeObjectLocally } from '../utils/imageTools'

const RemoveObject = () => {
  const [sourceImage, setSourceImage] = useState(null)
  const [outputImage, setOutputImage] = useState(null)
  const [file, setFile] = useState(null)
  const [objectName, setObjectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFile(file)
      setSourceImage(URL.createObjectURL(file))
      setOutputImage(null)
      setError('')
    }
  }

  const handleRemoveObject = async () => {
    if (!file) {
      setError('Please upload an image first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await removeObjectLocally(file, objectName)
      setOutputImage(result)
    } catch (err) {
      setError(err?.message || 'Could not process the image.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex justify-start">

      {/* MAIN WRAPPER */}
      <div className="flex gap-6 w-full max-w-[1050px]">

        {/* LEFT CARD */}
        <div className="w-[420px] bg-white p-6 rounded-xl border border-gray-200 shadow-sm">

          {/* HEADER WITH STAR ICON */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-blue-500 w-5" />
            <h2 className="font-semibold text-lg">
              Object Removal
            </h2>
          </div>

          {/* Upload */}
          <p className="text-sm mb-2">Upload image</p>

          <input
            type="file"
            onChange={handleImageChange}
            className="w-full border border-gray-300 p-2 rounded-md text-sm"
          />

          {/* Textarea */}
          <p className="text-sm mt-4 mb-2">
            Describe object name to remove
          </p>

          <textarea
            value={objectName}
            onChange={(e) => setObjectName(e.target.value)}
            rows={3}
            placeholder="e.g., watch or spoon , Only single object name"
            className="w-full border border-gray-300 p-2 rounded-md text-sm resize-none"
          />

          {/* BUTTON */}
          <button
            type="button"
            onClick={handleRemoveObject}
            disabled={loading}
            className="w-full mt-5 flex items-center justify-center gap-2
            bg-gradient-to-r from-blue-500 to-purple-500
            text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Scissors className="w-4" />
            {loading ? 'Removing...' : 'Remove object'}
          </button>

        </div>

        {/* RIGHT CARD */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">

          <div className="flex items-center gap-2 mb-4">
            <Scissors className="text-blue-500 w-5" />
            <h2 className="font-semibold text-lg">
              Processed Image
            </h2>
          </div>

          <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 min-h-[340px] overflow-hidden">

            {error && (
              <div className="text-center text-red-600 text-sm">
                {error}
              </div>
            )}

            {!error && outputImage ? (
              <img
                src={outputImage}
                alt="processed"
                className="max-h-[280px] object-contain"
              />
            ) : sourceImage ? (
              <img
                src={sourceImage}
                alt="preview"
                className="max-h-[280px] object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <Scissors className="mx-auto mb-2 w-8 h-8" />
                <p className="text-sm">
                  Upload an image and click <br />
                  "Remove Object" to get started
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  )
}

export default RemoveObject
