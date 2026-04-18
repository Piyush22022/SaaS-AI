import express from 'express'
import { auth } from '../middlewares/auth.js'
import {
  likeCreation,
  listMyCreations,
  listPublicCreations,
  updateCreationPublish
} from '../controllers/creationsController.js'

const creationsRouter = express.Router()

creationsRouter.get('/mine', auth, listMyCreations)
creationsRouter.get('/public', listPublicCreations)
creationsRouter.patch('/:id/publish', auth, updateCreationPublish)
creationsRouter.post('/:id/like', auth, likeCreation)

export default creationsRouter
