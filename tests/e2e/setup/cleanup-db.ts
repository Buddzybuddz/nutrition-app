import { testUsers, PB_URL } from '../fixtures/test-data'

const TEST_EMAILS = [testUsers.utilisateur.email]

export async function cleanupTestData(): Promise<void> {
  // Auth admin PocketBase via superuser
  const adminEmail = process.env.PB_ADMIN_EMAIL || 'admin@nutridash.fr'
  const adminPassword = process.env.PB_ADMIN_PASSWORD || ''

  if (!adminPassword) {
    console.warn('[Cleanup] PB_ADMIN_PASSWORD non défini — nettoyage ignoré')
    return
  }

  try {
    // 1. Authentifier en admin
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: adminEmail, password: adminPassword }),
    })
    if (!authRes.ok) {
      console.warn('[Cleanup] Authentification admin échouée')
      return
    }
    const { token } = await authRes.json()
    const headers = { Authorization: token, 'Content-Type': 'application/json' }

    for (const email of TEST_EMAILS) {
      // 2. Trouver l'utilisateur
      const usersRes = await fetch(
        `${PB_URL}/api/collections/users/records?filter=email="${email}"`,
        { headers }
      )
      const users = await usersRes.json()
      if (!users.items?.length) continue
      const userId = users.items[0].id

      // 3. Supprimer les données dans l'ordre FK
      const collections = ['meals', 'activities_log', 'daily_stats', 'weigh_ins', 'goal_history', 'profiles', 'user_data']
      for (const col of collections) {
        const res = await fetch(
          `${PB_URL}/api/collections/${col}/records?filter=user="${userId}"&perPage=200`,
          { headers }
        )
        const data = await res.json()
        for (const item of data.items || []) {
          await fetch(`${PB_URL}/api/collections/${col}/records/${item.id}`, {
            method: 'DELETE',
            headers,
          })
        }
      }

      // 4. Supprimer le compte utilisateur
      await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
        method: 'DELETE',
        headers,
      })
      console.log(`[Cleanup] ✅ Utilisateur ${email} supprimé`)
    }
  } catch (e) {
    console.warn('[Cleanup] Erreur:', e)
  }
}
