import { cleanupTestData } from './cleanup-db'

export default async function globalTeardown() {
  await cleanupTestData()
}
