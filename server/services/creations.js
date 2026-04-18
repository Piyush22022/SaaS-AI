import sql from '../configs/db.js'

function normalizeCreation(row) {
  return {
    ...row,
    publish: Boolean(row.publish),
    likes: Array.isArray(row.likes) ? row.likes : []
  }
}

export async function insertCreation({
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

export async function getUserCreations(userId) {
  const rows = await sql`
    SELECT *
    FROM creations
    WHERE user_id = ${userId}
    ORDER BY created_at DESC, id DESC
  `

  return rows.map(normalizeCreation)
}

export async function getPublicCreations() {
  const rows = await sql`
    SELECT *
    FROM creations
    WHERE publish = true
    ORDER BY created_at DESC, id DESC
  `

  return rows.map(normalizeCreation)
}

export async function setCreationPublish({ creationId, userId, publish }) {
  const rows = await sql`
    UPDATE creations
    SET publish = ${publish}, updated_at = NOW()
    WHERE id = ${creationId} AND user_id = ${userId}
    RETURNING *
  `

  return rows[0] ? normalizeCreation(rows[0]) : null
}

export async function toggleCreationLike({ creationId, userId }) {
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
