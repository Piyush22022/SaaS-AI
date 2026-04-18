import React, { useState } from 'react'
import { Image as ImageIcon, Sparkles, Upload } from 'lucide-react'
import { removeBackgroundLocally } from '../utils/imageTools'

const RemoveBackground = () => {
  const [sourceImage, setSourceImage] = useState(null)
  const [outputImage, setOutputImage] = useState(null)
  const [file, setFile] = useState(null)
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

  const handleRemoveBackground = async () => {
    if (!file) {
      setError('Please upload an image first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await removeBackgroundLocally(file)
      setOutputImage(result)
    } catch (err) {
      setError(err?.message || 'Could not process the image.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex justify-start">

      {/* CONTAINER */}
      <div className="flex gap-6 w-full max-w-[1050px]">

        {/* LEFT CARD */}
        <div className="w-[420px] bg-white p-6 rounded-xl border border-gray-200 shadow-sm">

          {/* ✅ UPDATED HEADER WITH STAR ICON */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-orange-500 w-5" />
            <h2 className="font-semibold text-lg">
              Background Removal
            </h2>
          </div>

          <p className="text-sm mb-2">Upload image</p>

          <input
            type="file"
            onChange={handleImageChange}
            className="w-full border border-gray-300 p-2 rounded-md text-sm"
          />

          <p className="text-xs text-gray-400 mt-2">
            Supports JPG, PNG, and other image formats
          </p>

          <button
            type="button"
            onClick={handleRemoveBackground}
            disabled={loading}
            className="w-full mt-5 flex items-center justify-center gap-2
            bg-gradient-to-r from-orange-400 to-red-500
            text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Upload className="w-4" />
            {loading ? 'Removing...' : 'Remove background'}
          </button>

        </div>

        {/* RIGHT CARD */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">

          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="text-orange-500 w-5" />
            <h2 className="font-semibold text-lg">
              Processed Image
            </h2>
          </div>

          <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg min-h-[340px] overflow-hidden relative"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px'
            }}
          >

            {error && (
              <div className="text-center text-red-600 text-sm">
                {error}
              </div>
            )}

            {!error && outputImage ? (
              <img
                src={outputImage}
                alt="processed"
                className="max-h-[280px] object-contain relative z-10"
              />
            ) : sourceImage ? (
              <img
                src={sourceImage}
                alt="preview"
                className="max-h-[280px] object-contain relative z-10"
              />
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon className="mx-auto mb-2 w-8 h-8" />
                <p className="text-sm">
                  Upload an image and click <br />
                  "Remove Background" to get started
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  )
}

export default RemoveBackground
