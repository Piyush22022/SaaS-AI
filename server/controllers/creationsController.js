import {
  getPublicCreations,
  getUserCreations,
  setCreationPublish,
  toggleCreationLike
} from '../services/creations.js'

export const listMyCreations = async (req, res) => {
  try {
    const creations = await getUserCreations(req.userId)

    res.json({
      success: true,
      creations
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const listPublicCreations = async (_req, res) => {
  try {
    const creations = await getPublicCreations()

    res.json({
      success: true,
      creations
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateCreationPublish = async (req, res) => {
  try {
    const creationId = Number(req.params.id)
    const publish = Boolean(req.body.publish)

    if (!Number.isInteger(creationId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid creation id is required'
      })
    }

    const creation = await setCreationPublish({
      creationId,
      userId: req.userId,
      publish
    })

    if (!creation) {
      return res.status(404).json({
        success: false,
        message: 'Creation not found'
      })
    }

    res.json({
      success: true,
      creation
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const likeCreation = async (req, res) => {
  try {
    const creationId = Number(req.params.id)

    if (!Number.isInteger(creationId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid creation id is required'
      })
    }

    const creation = await toggleCreationLike({
      creationId,
      userId: req.userId
    })

    if (!creation) {
      return res.status(404).json({
        success: false,
        message: 'Creation not found'
      })
    }

    res.json({
      success: true,
      creation
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
