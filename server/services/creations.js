import { dbMode, sql, supabase } from '../configs/db.js'

function normalizeCreation(row) {
  return {
    ...row,
    publish: Boolean(row.publish),
    likes: Array.isArray(row.likes) ? row.likes : []
  }
}

function handleDatabaseError(error) {
  if (!error) return

  if (error.code === '42P01' || /does not exist/i.test(error.message || '')) {
    throw new Error(
      'The creations table does not exist yet. Run supabase/schema.sql in the Supabase SQL editor.'
    )
  }

  throw error
}

async function insertCreationSupabase({
  userId,
  prompt,
  content,
  type,
  publish = false,
  likes = []
}) {
  const { data, error } = await supabase
    .from('creations')
    .insert({
      user_id: userId,
      prompt,
      content,
      type,
      publish,
      likes
    })
    .select('*')
    .single()

  if (error) handleDatabaseError(error)
  return normalizeCreation(data)
}

async function insertCreationNeon({
  userId,
  prompt,
  content,
  type,
  publish = false,
  likes = []
}) {
  const rows = await sql`
    INSERT INTO creations (user_id, prompt, content, type, publish, likes)
    VALUES (${userId}, ${prompt}, ${content}, ${type}, ${publish}, ${likes})
    RETURNING *
  `

  return normalizeCreation(rows[0])
}

async function getUserCreationsSupabase(userId) {
  const { data, error } = await supabase
    .from('creations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (error) handleDatabaseError(error)
  return (data || []).map(normalizeCreation)
}

async function getUserCreationsNeon(userId) {
  const rows = await sql`
    SELECT *
    FROM creations
    WHERE user_id = ${userId}
    ORDER BY created_at DESC, id DESC
  `

  return rows.map(normalizeCreation)
}

async function getPublicCreationsSupabase() {
  const { data, error } = await supabase
    .from('creations')
    .select('*')
    .eq('publish', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (error) handleDatabaseError(error)
  return (data || []).map(normalizeCreation)
}

async function getPublicCreationsNeon() {
  const rows = await sql`
    SELECT *
    FROM creations
    WHERE publish = true
    ORDER BY created_at DESC, id DESC
  `

  return rows.map(normalizeCreation)
}

async function setCreationPublishSupabase({ creationId, userId, publish }) {
  const { data, error } = await supabase
    .from('creations')
    .update({
      publish,
      updated_at: new Date().toISOString()
    })
    .eq('id', creationId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) handleDatabaseError(error)
  return data ? normalizeCreation(data) : null
}

async function setCreationPublishNeon({ creationId, userId, publish }) {
  const rows = await sql`
    UPDATE creations
    SET publish = ${publish}, updated_at = NOW()
    WHERE id = ${creationId} AND user_id = ${userId}
    RETURNING *
  `

  return rows[0] ? normalizeCreation(rows[0]) : null
}

async function toggleCreationLikeSupabase({ creationId, userId }) {
  const { data: current, error: fetchError } = await supabase
    .from('creations')
    .select('id, likes')
    .eq('id', creationId)
    .single()

  if (fetchError) handleDatabaseError(fetchError)

  const likes = Array.isArray(current?.likes) ? [...current.likes] : []
  const nextLikes = likes.includes(userId)
    ? likes.filter((like) => like !== userId)
    : [...likes, userId]

  const { data, error } = await supabase
    .from('creations')
    .update({
      likes: nextLikes,
      updated_at: new Date().toISOString()
    })
    .eq('id', creationId)
    .select('*')
    .single()

  if (error) handleDatabaseError(error)
  return data ? normalizeCreation(data) : null
}

async function toggleCreationLikeNeon({ creationId, userId }) {
  const rows = await sql`
    UPDATE creations
    SET likes = CASE
      WHEN ${userId} = ANY(likes) THEN array_remove(likes, ${userId})
      ELSE array_append(likes, ${userId})
    END,
    updated_at = NOW()
    WHERE id = ${creationId}
    RETURNING *
  `

  return rows[0] ? normalizeCreation(rows[0]) : null
}

export async function insertCreation(params) {
  return dbMode === 'supabase'
    ? insertCreationSupabase(params)
    : insertCreationNeon(params)
}

export async function getUserCreations(userId) {
  return dbMode === 'supabase'
    ? getUserCreationsSupabase(userId)
    : getUserCreationsNeon(userId)
}

export async function getPublicCreations() {
  return dbMode === 'supabase'
    ? getPublicCreationsSupabase()
    : getPublicCreationsNeon()
}

export async function setCreationPublish(params) {
  return dbMode === 'supabase'
    ? setCreationPublishSupabase(params)
    : setCreationPublishNeon(params)
}

export async function toggleCreationLike(params) {
  return dbMode === 'supabase'
    ? toggleCreationLikeSupabase(params)
    : toggleCreationLikeNeon(params)
}
