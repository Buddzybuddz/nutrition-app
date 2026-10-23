import { cleanupTestData } from './cleanup-db'

export default async function globalSetup() {
  await cleanupTestData()
}
