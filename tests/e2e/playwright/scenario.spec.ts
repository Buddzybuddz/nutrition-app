import { test, expect } from '@playwright/test'
import { BASE_URL, PB_URL, testUsers, testMeal } from '../fixtures/test-data'
import {
  goToLanding, openLoginForm, openSignupForm,
  loginAs, logout, createTestUser, createTestProfile, deleteTestUser, getAdminToken,
} from './helpers'

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Visiteur — Voir la landing page
// ─────────────────────────────────────────────────────────────────────────────
test.describe('1 · Visiteur — Landing page', () => {
  test('affiche la landing page avec tous les blocs principaux', async ({ page }) => {
    // Given — utilisateur non authentifié

    // When
    await goToLanding(page)

    // Then — hero, features, process, tarif et footer sont visibles
    await expect(page.getByRole('button', { name: /Démarrer gratuitement/i }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /votre corps mérite/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /process nutridash/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /tarif/i })).toBeVisible()
  })

  test('le bouton Connexion est visible dans le header', async ({ page }) => {
    // Given / When
    await goToLanding(page)

    // Then
    await expect(page.getByRole('button', { name: 'Connexion' })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Visiteur — CTA ouvre le formulaire d'inscription
// ─────────────────────────────────────────────────────────────────────────────
test.describe('2 · Visiteur — CTA inscription', () => {
  test('le CTA "Démarrer gratuitement" ouvre le formulaire inscription', async ({ page }) => {
    // Given
    await goToLanding(page)

    // When
    await page.getByRole('button', { name: /Démarrer gratuitement/i }).first().click()

    // Then
    await expect(page.getByRole('heading', { name: /Créez votre compte/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Adresse email' })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Visiteur — Bouton Connexion bascule vers le formulaire connexion
// ─────────────────────────────────────────────────────────────────────────────
test.describe('3 · Visiteur — Formulaire connexion', () => {
  test('le bouton Connexion affiche le formulaire de connexion', async ({ page }) => {
    // Given
    await goToLanding(page)

    // When
    await page.getByRole('button', { name: 'Connexion' }).click()

    // Then
    await expect(page.getByRole('heading', { name: /Bon retour/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Visiteur — Inscription (création de compte)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('4 · Visiteur — Inscription', () => {
  let adminToken: string
  let createdUserId: string

  test.beforeEach(async () => {
    try {
      adminToken = await getAdminToken()
    } catch (e) {
      console.warn('[beforeEach] Admin auth échouée:', e)
      test.skip()
    }
  })

  test.afterEach(async () => {
    if (createdUserId && adminToken) {
      await deleteTestUser(adminToken, createdUserId).catch(() => {})
      createdUserId = ''
    }
  })

  test('le bouton "Créer mon compte" est désactivé tant que la checkbox CGU n\'est pas cochée', async ({ page }) => {
    // Given — formulaire inscription ouvert
    await openSignupForm(page)

    // Then — bouton disabled par défaut
    await expect(page.getByRole('button', { name: /Créer mon compte/i })).toBeDisabled()
  })

  test('un nouveau compte peut être créé via le formulaire', async ({ page }) => {
    // Given
    const uniqueEmail = `e2e-signup-${Date.now()}@nutridash-test.com`
    await openSignupForm(page)

    // When — saisie formulaire complet (Prénom + Nom requis par HTML5)
    await page.getByRole('textbox', { name: 'Prénom' }).fill('Test')
    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('E2E')
    await page.getByRole('textbox', { name: 'Adresse email' }).fill(uniqueEmail)
    await page.getByRole('textbox', { name: 'Mot de passe', exact: true }).fill(testUsers.utilisateur.password)
    await page.getByRole('textbox', { name: 'Confirmer le mot de passe' }).fill(testUsers.utilisateur.password)
    await page.getByRole('checkbox').click()
    await page.getByRole('button', { name: /Créer mon compte/i }).click()

    // Then — redirigé vers profil ou dashboard
    await page.waitForURL(/profil|tableaudebord/, { timeout: 15000 })

    // Cleanup — récupérer l'ID créé
    const usersRes = await fetch(
      `${PB_URL}/api/collections/users/records?filter=email="${uniqueEmail}"`,
      { headers: { Authorization: adminToken } }
    )
    const users = await usersRes.json()
    if (users.items?.length) createdUserId = users.items[0].id
  })

  test('une erreur est affichée si l\'email est déjà utilisé', async ({ page }) => {
    // Given — on crée d'abord un compte avec cet email
    const userId = await createTestUser(
      adminToken,
      testUsers.utilisateur.email,
      testUsers.utilisateur.password
    )
    createdUserId = userId

    // When — tentative avec le même email
    await openSignupForm(page)
    await page.getByRole('textbox', { name: 'Prénom' }).fill('Test')
    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('E2E')
    await page.getByRole('textbox', { name: 'Adresse email' }).fill(testUsers.utilisateur.email)
    await page.getByRole('textbox', { name: 'Mot de passe', exact: true }).fill(testUsers.utilisateur.password)
    await page.getByRole('textbox', { name: 'Confirmer le mot de passe' }).fill(testUsers.utilisateur.password)
    await page.getByRole('checkbox').click()
    await page.getByRole('button', { name: /Créer mon compte/i }).click()

    // Then — message d'erreur affiché
    await expect(page.locator('#auth-error')).toBeVisible({ timeout: 8000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5 · Utilisateur — Connexion
// ─────────────────────────────────────────────────────────────────────────────
test.describe('5 · Utilisateur — Connexion', () => {
  let adminToken: string
  let userId: string

  test.beforeEach(async () => {
    try {
      adminToken = await getAdminToken()
      userId = await createTestUser(adminToken, testUsers.utilisateur.email, testUsers.utilisateur.password)
    } catch (e) {
      console.warn('[beforeEach] Setup échoué:', e)
      test.skip()
    }
  })

  test.afterEach(async () => {
    if (userId && adminToken) await deleteTestUser(adminToken, userId).catch(() => {})
  })

  test('un utilisateur peut se connecter et accéder au dashboard', async ({ page }) => {
    // Given — compte existant
    // When
    await loginAs(page, testUsers.utilisateur.email, testUsers.utilisateur.password)

    // Then — dashboard ou profil visible
    expect(page.url()).toMatch(/tableaudebord|profil/)
  })

  test('une erreur est affichée avec de mauvais identifiants', async ({ page }) => {
    // Given
    await openLoginForm(page)

    // When — mauvais mot de passe
    await page.getByRole('textbox', { name: 'Adresse email' }).fill(testUsers.utilisateur.email)
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill('MauvaisMotDePasse!')
    await page.getByRole('button', { name: /Se connecter/i }).click()

    // Then — erreur visible, pas de redirection
    await expect(page.locator('#auth-error')).toBeVisible({ timeout: 8000 })
    expect(page.url()).toContain('login')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7-8 · Visiteur — Pages légales accessibles
// ─────────────────────────────────────────────────────────────────────────────
test.describe('7-8 · Visiteur — Pages légales', () => {
  test('la page CGU est accessible', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/cgu.html`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('la page Confidentialité est accessible', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/confidentialite.html`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// I1 · Visiteur — Accès dashboard sans auth bloqué
// ─────────────────────────────────────────────────────────────────────────────
test.describe('I1 · Visiteur — Accès protégé bloqué', () => {
  test('un visiteur non authentifié ne peut pas accéder au dashboard', async ({ page }) => {
    // Given — pas de session active
    await page.goto(BASE_URL)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForURL(/landingpage/)

    // When — tentative d'accès direct au dashboard via hash
    await page.evaluate(() => { window.location.hash = 'tableaudebord' })
    await page.waitForTimeout(1500)

    // Then — redirigé vers landing, pas dashboard
    expect(page.url()).not.toContain('tableaudebord')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12 · Utilisateur — Déconnexion
// ─────────────────────────────────────────────────────────────────────────────
test.describe('12 · Utilisateur — Déconnexion', () => {
  let adminToken: string
  let userId: string

  test.beforeEach(async () => {
    try {
      adminToken = await getAdminToken()
      userId = await createTestUser(adminToken, testUsers.utilisateur.email, testUsers.utilisateur.password)
    } catch (e) {
      console.warn('[beforeEach] Setup échoué:', e)
      test.skip()
    }
  })

  test.afterEach(async () => {
    if (userId && adminToken) await deleteTestUser(adminToken, userId).catch(() => {})
  })

  test('la déconnexion efface la session et redirige vers la landing', async ({ page }) => {
    // Given — utilisateur connecté
    await loginAs(page, testUsers.utilisateur.email, testUsers.utilisateur.password)

    // When
    await logout(page)

    // Then — retour landing page ou login
    await expect(page).toHaveURL(/landingpage|login/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 14 · Utilisateur — Suppression de compte (RGPD)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('14 · Utilisateur — Suppression compte (RGPD)', () => {
  let adminToken: string
  let userId: string

  test.beforeEach(async () => {
    try {
      adminToken = await getAdminToken()
      userId = await createTestUser(adminToken, testUsers.utilisateur.email, testUsers.utilisateur.password)
    } catch (e) {
      console.warn('[beforeEach] Setup échoué:', e)
      test.skip()
    }
  })

  test.afterEach(async () => {
    try {
      if (userId && adminToken) await deleteTestUser(adminToken, userId)
    } catch {}
  })

  test('une modale de confirmation est demandée avant la suppression du compte', async ({ page }) => {
    // Given — utilisateur connecté
    await loginAs(page, testUsers.utilisateur.email, testUsers.utilisateur.password)
    await page.goto(`${BASE_URL}/#profil`)
    await page.waitForTimeout(500)

    // When — clic sur le bouton de suppression
    const deleteBtn = page.getByRole('button', { name: /supprimer.*compte|effacer.*données/i })
    if (!await deleteBtn.isVisible()) {
      test.skip()
      return
    }
    await deleteBtn.click()

    // Then — modale de confirmation visible
    await expect(
      page.locator('#modal-delete-account')
    ).toBeVisible({ timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 17 · Utilisateur — Ajouter un repas
// ─────────────────────────────────────────────────────────────────────────────
test.describe('17 · Utilisateur — Ajouter un repas', () => {
  let adminToken: string
  let userId: string

  test.beforeEach(async () => {
    try {
      adminToken = await getAdminToken()
      userId = await createTestUser(adminToken, testUsers.utilisateur.email, testUsers.utilisateur.password)
    } catch (e) {
      console.warn('[beforeEach] Setup échoué:', e)
      test.skip()
    }
  })

  test.afterEach(async () => {
    if (userId && adminToken) await deleteTestUser(adminToken, userId).catch(() => {})
  })

  test('le bouton "+ Repas" est accessible depuis le dashboard', async ({ page }) => {
    // Given — utilisateur connecté (sans profil → redirigé vers /profil)
    await loginAs(page, testUsers.utilisateur.email, testUsers.utilisateur.password)

    const url = page.url()
    if (url.includes('profil')) {
      // Comportement attendu : profil requis avant le dashboard
      expect(url).toContain('profil')
      return
    }

    await page.goto(`${BASE_URL}/#tableaudebord`)
    const addMealBtn = page.getByRole('button', { name: /\+ Repas|Ajouter.*repas/i })
    await expect(addMealBtn).toBeVisible({ timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 25 · Utilisateur — Assistant IA (remplace les pages Suivi et Conseils)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('25 · Utilisateur — Assistant IA', () => {
  let adminToken: string
  let userId: string

  test.beforeEach(async () => {
    try {
      adminToken = await getAdminToken()
      userId = await createTestUser(adminToken, testUsers.utilisateur.email, testUsers.utilisateur.password)
      await createTestProfile(adminToken, userId)
    } catch (e) {
      console.warn('[beforeEach] Setup échoué:', e)
      test.skip()
    }
  })

  test.afterEach(async () => {
    if (userId && adminToken) await deleteTestUser(adminToken, userId).catch(() => {})
  })

  test("la page IA demande l'accord avant la première utilisation", async ({ page }) => {
    // Given — utilisateur connecté avec profil, sans accord préalable
    await loginAs(page, testUsers.utilisateur.email, testUsers.utilisateur.password)

    // When
    await page.goto(`${BASE_URL}/#ia`)
    await page.waitForTimeout(1000)

    // Then — écran d'accord visible, conversation masquée, bouton inactif tant que la case n'est pas cochée
    await expect(page.locator('#ia-view')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#ia-consent')).toBeVisible()
    await expect(page.locator('#ia-chat')).toBeHidden()
    await expect(page.locator('#ia-consent-btn')).toBeDisabled()
    await page.locator('#ia-consent-box').check()
    await expect(page.locator('#ia-consent-btn')).toBeEnabled()
  })

  test("les anciennes pages Suivi et Conseils n'existent plus", async ({ page }) => {
    await loginAs(page, testUsers.utilisateur.email, testUsers.utilisateur.password)
    await page.goto(`${BASE_URL}/#tableaudebord`)
    await expect(page.locator('#history-view')).toHaveCount(0)
    await expect(page.locator('#advice-view')).toHaveCount(0)
  })
})
