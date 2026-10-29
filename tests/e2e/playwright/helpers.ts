import { Page, expect } from '@playwright/test'
import { BASE_URL, PB_URL } from '../fixtures/test-data'

export async function goToApp(page: Page) {
  await page.goto(BASE_URL)
  await page.waitForURL(/landingpage|tableaudebord/)
}

export async function goToLanding(page: Page) {
  await page.goto(BASE_URL)
  await page.waitForURL(/landingpage/)
  await expect(page.getByRole('button', { name: /Démarrer gratuitement/i }).first()).toBeVisible()
}

// Ouvre le formulaire de connexion depuis la landing page
export async function openLoginForm(page: Page) {
  await page.goto(BASE_URL)
  await page.waitForURL(/landingpage/)
  await page.getByRole('button', { name: 'Connexion' }).click()
  await expect(page.getByRole('heading', { name: /Bon retour/i })).toBeVisible({ timeout: 5000 })
}

// Ouvre le formulaire d'inscription depuis la landing page
export async function openSignupForm(page: Page) {
  await page.goto(BASE_URL)
  await page.waitForURL(/landingpage/)
  await page.getByRole('button', { name: /Démarrer gratuitement/i }).first().click()
  await expect(page.getByRole('heading', { name: /Créez votre compte/i })).toBeVisible({ timeout: 5000 })
}

export async function loginAs(page: Page, email: string, password: string) {
  await openLoginForm(page)
  await page.getByRole('textbox', { name: 'Adresse email' }).fill(email)
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill(password)
  await page.getByRole('button', { name: /Se connecter/i }).click()
  await page.waitForURL(/tableaudebord|profil/, { timeout: 15000 })
}

export async function logout(page: Page) {
  const logoutBtn = page.locator('#logout-btn')
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click()
  } else {
    await page.goto(`${BASE_URL}/#profil`)
    await page.locator('#logout-btn').click()
  }
  await page.waitForURL(/landingpage|login/, { timeout: 5000 })
}

export async function createTestUser(
  adminToken: string,
  email: string,
  password: string,
  name?: string
): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/users/records`, {
    method: 'POST',
    headers: { Authorization: adminToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      passwordConfirm: password,
      emailVisibility: false,
      is_active: true,
      name: name || '',
    }),
  })
  if (!res.ok) throw new Error(`Création user échouée: ${await res.text()}`)
  const data = await res.json()
  return data.id
}

export async function getAdminToken(): Promise<string> {
  const adminEmail = process.env.PB_ADMIN_EMAIL
  const adminPassword = process.env.PB_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    throw new Error('PB_ADMIN_EMAIL et PB_ADMIN_PASSWORD doivent être définis (compte superuser du PocketBase de test)')
  }
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: adminEmail, password: adminPassword }),
  })
  if (!res.ok) throw new Error(`Auth admin échouée: ${await res.text()}`)
  const { token } = await res.json()
  return token
}

export async function createTestProfile(adminToken: string, userId: string): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/profiles/records`, {
    method: 'POST',
    headers: { Authorization: adminToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: userId,
      birthDate: '1997-01-15',
      gender: 'Homme',
      weight: 75,
      height: 180,
      goal: 'Maintien',
      weighInDay: 1,
      targetWeight: 75,
    }),
  })
  if (!res.ok) throw new Error(`Création profil échouée: ${await res.text()}`)
  const data = await res.json()
  return data.id
}

export async function deleteTestUser(adminToken: string, userId: string): Promise<void> {
  const collections = ['meals', 'activities_log', 'daily_stats', 'weigh_ins', 'goal_history', 'profiles', 'user_data']
  const headers = { Authorization: adminToken, 'Content-Type': 'application/json' }
  for (const col of collections) {
    const res = await fetch(
      `${PB_URL}/api/collections/${col}/records?filter=user="${userId}"&perPage=200`,
      { headers }
    )
    const data = await res.json()
    for (const item of data.items || []) {
      await fetch(`${PB_URL}/api/collections/${col}/records/${item.id}`, { method: 'DELETE', headers })
    }
  }
  await fetch(`${PB_URL}/api/collections/users/records/${userId}`, { method: 'DELETE', headers })
}
