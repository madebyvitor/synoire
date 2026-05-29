import { test, expect } from '@playwright/test'

// Força este teste a não usar o ficheiro user.json do auth.setup.ts
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('onboarding FTU', () => {
  // Requer Supabase com confirmação de e-mail desativada (sessão imediata após registo).
  test('novo utilizador completa onboarding', async ({ page }) => {
    test.setTimeout(60_000)

    const uniqueEmail = `test-ftu-${Date.now()}@synoire.com`
    const uniqueUsername = `ftu_${Date.now()}`.slice(0, 32)
    const password = 'TestPass123!'

    // Ação A — Sign Up
    await page.goto('/entrar')
    await page.getByRole('tab', { name: 'Criar conta' }).click()
    await page.getByLabel('E-mail').fill(uniqueEmail)
    await page.getByLabel('Senha').fill(password)
    await page.getByLabel('Nome de usuário').fill(uniqueUsername)
    await page.locator('form').getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/painel/, { timeout: 30_000 })

    // Ação B — WelcomeModal (passo 1)
    const welcome = page.getByRole('dialog', { name: /bem-vindo ao synoire/i })
    await expect(welcome).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Bem-vindo ao Synoire/i)).toBeVisible()
    await welcome.getByRole('button', { name: 'Definir minha Meta' }).click()
    await expect(
      page.getByRole('dialog', { name: /qual é o seu objetivo/i }),
    ).toBeVisible({ timeout: 15_000 })

    // Ação C — Meta semanal (passo 2 dentro do WelcomeModal)
    const goalDialog = page.getByRole('dialog', { name: /qual é o seu objetivo/i })
    await goalDialog.getByLabel('Horas por semana').fill('10')
    await goalDialog.getByRole('button', { name: 'Salvar e Começar' }).click()
    await expect(goalDialog).toBeHidden({ timeout: 30_000 })

    // Ação D — Dashboard livre
    await expect(page.getByRole('heading', { name: /painel/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Meta semanal')).toBeVisible()

    await page.getByRole('link', { name: 'Hubs' }).click()
    await expect(page).toHaveURL(/\/hubs/)
    await expect(
      page.getByRole('heading', { name: /hubs por concurso/i }),
    ).toBeVisible({ timeout: 15_000 })
  })
})
