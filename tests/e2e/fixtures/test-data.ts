export const BASE_URL = 'http://127.0.0.1:8090'
export const PB_URL = 'http://127.0.0.1:8090'

export const E2E_PREFIX = '[E2E]'

export const testUsers = {
  utilisateur: {
    email: 'e2e-user@nutridash-test.com',
    password: 'E2eTest1234!',
    firstName: 'Test',
    lastName: 'E2E',
  },
}

export const testProfile = {
  birthDate: '1997-01-15',
  gender: 'Homme',
  weight: '75',
  height: '180',
  goal: 'Perte de poids -10%',
  weighInDay: '1', // Lundi
}

export const testMeal = {
  type: 'Petit-déjeuner',
  calories: '450',
  protein: '35',
}

export const testActivity = {
  name: 'Musculation',
  calories: '300',
}
