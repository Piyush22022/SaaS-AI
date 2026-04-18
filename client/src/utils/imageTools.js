function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function getCanvasSize(image, maxSize = 1024) {
  const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1)
  return {
    width: Math.max(1, Math.round(image.width * ratio)),
    height: Math.max(1, Math.round(image.height * ratio))
  }
}

function createCanvas(image, maxSize = 1024) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const size = getCanvasSize(image, maxSize)
  canvas.width = size.width
  canvas.height = size.height
  ctx.drawImage(image, 0, 0, size.width, size.height)
  return { canvas, ctx, width: size.width, height: size.height }
}

function createTransparentCheckerboard(ctx, width, height, tileSize = 24) {
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const isDark = ((x / tileSize) + (y / tileSize)) % 2 === 0
      ctx.fillStyle = isDark ? '#e5e7eb' : '#f8fafc'
      ctx.fillRect(x, y, tileSize, tileSize)
    }
  }
}

function getPixel(ctx, x, y) {
  const { data } = ctx.getImageData(x, y, 1, 1)
  return [data[0], data[1], data[2], data[3]]
}

function colorDistance(a, b) {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function averageCornerColor(ctx, width, height) {
  const points = [
    getPixel(ctx, 0, 0),
    getPixel(ctx, width - 1, 0),
    getPixel(ctx, 0, height - 1),
    getPixel(ctx, width - 1, height - 1)
  ]

  const totals = points.reduce(
    (acc, pixel) => {
      acc[0] += pixel[0]
      acc[1] += pixel[1]
      acc[2] += pixel[2]
      return acc
    },
    [0, 0, 0]
  )

  return totals.map((value) => Math.round(value / points.length))
}

export async function removeBackgroundLocally(file) {
  const image = await loadImageFromFile(file)
  const { canvas, ctx, width, height } = createCanvas(image, 1200)
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData
  const bgColor = averageCornerColor(ctx, width, height)
  const threshold = 62
  const visited = new Uint8Array(width * height)
  const queue = []

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const index = y * width + x
    if (visited[index]) return
    const offset = index * 4
    const pixel = [data[offset], data[offset + 1], data[offset + 2]]
    if (colorDistance(pixel, bgColor) <= threshold) {
      visited[index] = 1
      queue.push([x, y])
    }
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  while (queue.length > 0) {
    const [x, y] = queue.shift()
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ]

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const index = ny * width + nx
      if (visited[index]) continue
      const offset = index * 4
      const pixel = [data[offset], data[offset + 1], data[offset + 2]]
      if (colorDistance(pixel, bgColor) <= threshold) {
        visited[index] = 1
        queue.push([nx, ny])
      }
    }
  }

  for (let i = 0; i < visited.length; i += 1) {
    if (visited[i]) {
      data[i * 4 + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const previewCanvas = document.createElement('canvas')
  previewCanvas.width = width
  previewCanvas.height = height
  const previewCtx = previewCanvas.getContext('2d')
  createTransparentCheckerboard(previewCtx, width, height)
  previewCtx.drawImage(canvas, 0, 0)

  return previewCanvas.toDataURL('image/png')
}

function chooseRemovalRegion(width, height, objectName = '') {
  const normalized = objectName.toLowerCase().trim()

  if (/(face|head|hair|portrait|person|selfie)/.test(normalized)) {
    return {
      centerX: Math.round(width * 0.5),
      centerY: Math.round(height * 0.28),
      maskWidth: Math.round(width * 0.28),
      maskHeight: Math.round(height * 0.24)
    }
  }

  if (/(car|vehicle|bike|bicycle|truck|motorbike)/.test(normalized)) {
    return {
      centerX: Math.round(width * 0.5),
      centerY: Math.round(height * 0.72),
      maskWidth: Math.round(width * 0.38),
      maskHeight: Math.round(height * 0.22)
    }
  }

  if (/(shoe|bag|book|phone|watch|cup|bottle|plate|spoon|object)/.test(normalized)) {
    return {
      centerX: Math.round(width * 0.5),
      centerY: Math.round(height * 0.58),
      maskWidth: Math.round(width * 0.26),
      maskHeight: Math.round(height * 0.22)
    }
  }

  return {
    centerX: Math.round(width * 0.5),
    centerY: Math.round(height * 0.5),
    maskWidth: Math.round(width * 0.34),
    maskHeight: Math.round(height * 0.30)
  }
}

function addNoiseToRegion(ctx, x, y, width, height, intensity = 18) {
  const region = ctx.getImageData(x, y, width, height)
  const { data } = region

  for (let i = 0; i < data.length; i += 4) {
    const delta = (Math.random() - 0.5) * intensity
    data[i] = Math.max(0, Math.min(255, data[i] + delta))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + delta))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + delta))
  }

  ctx.putImageData(region, x, y)
}

export async function removeObjectLocally(file, objectName = '') {
  const image = await loadImageFromFile(file)
  const { canvas, ctx, width, height } = createCanvas(image, 1200)
  ctx.drawImage(image, 0, 0, width, height)

  const region = chooseRemovalRegion(width, height, objectName)
  const { centerX, centerY, maskWidth, maskHeight } = region
  const startX = Math.max(0, centerX - Math.round(maskWidth / 2))
  const startY = Math.max(0, centerY - Math.round(maskHeight / 2))

  const sample = ctx.getImageData(
    Math.max(0, startX - 18),
    Math.max(0, startY - 18),
    Math.min(width, maskWidth + 36),
    Math.min(height, maskHeight + 36)
  )

  const sampleCanvas = document.createElement('canvas')
  sampleCanvas.width = sample.width
  sampleCanvas.height = sample.height
  const sampleCtx = sampleCanvas.getContext('2d')
  sampleCtx.putImageData(sample, 0, 0)

  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = sample.width
  blurCanvas.height = sample.height
  const blurCtx = blurCanvas.getContext('2d')
  blurCtx.filter = 'blur(16px)'
  blurCtx.drawImage(sampleCanvas, 0, 0)

  ctx.save()
  ctx.beginPath()
  ctx.ellipse(
    centerX,
    centerY,
    maskWidth / 2,
    maskHeight / 2,
    0,
    0,
    Math.PI * 2
  )
  ctx.clip()
  ctx.drawImage(
    blurCanvas,
    0,
    0,
    blurCanvas.width,
    blurCanvas.height,
    startX,
    startY,
    Math.min(maskWidth + 36, width - startX),
    Math.min(maskHeight + 36, height - startY)
  )
  ctx.restore()

  addNoiseToRegion(
    ctx,
    startX,
    startY,
    Math.min(maskWidth + 36, width - startX),
    Math.min(maskHeight + 36, height - startY),
    10
  )

  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = Math.max(6, Math.round(Math.min(width, height) * 0.01))
  ctx.setLineDash([18, 12])
  ctx.beginPath()
  ctx.ellipse(
    centerX,
    centerY,
    maskWidth / 2,
    maskHeight / 2,
    0,
    0,
    Math.PI * 2
  )
  ctx.stroke()
  ctx.restore()

  return canvas.toDataURL('image/png')
}
