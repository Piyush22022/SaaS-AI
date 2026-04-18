import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL?.trim()

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in server/.env')
}

const sql = neon(databaseUrl)

// ✅ THIS LINE IS CRITICAL
export default sql;
