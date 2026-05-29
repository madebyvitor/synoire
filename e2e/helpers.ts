import { expect, type Locator, type Page } from '@playwright/test'

/** Room theme max length in the app (see THEME_MAX_LENGTH). */
export const E2E_ROOM_THEME_MAX = 25

/** Unique room theme that fits validation and matches the stored room name prefix. */
export function e2eUniqueRoomTheme(kind: 'link' | 'grant'): string {
  const id = `${Date.now() % 100_000_000}`.padStart(8, '0')
  const theme = `E2E ${kind} ${id}`
  return theme.length <= E2E_ROOM_THEME_MAX ? theme : theme.slice(0, E2E_ROOM_THEME_MAX)
}

export const E2E_TEST_ENV_KEYS = [
  'VITE_TEST_EMAIL',
  'VITE_TEST_PASSWORD',
  'VITE_TEST_USER2_EMAIL',
  'VITE_TEST_USER2_PASSWORD',
  'VITE_TEST_USER2_USERNAME',
] as const

export type E2eTestEnvKey = (typeof E2E_TEST_ENV_KEYS)[number]

export function requireTestEnv(name: E2eTestEnvKey): string {
  const value = process.env[name]
  if (!value?.trim()) {
    throw new Error(
      `Defina ${name} no .env ou .env.local (veja .env.example) para os testes E2E.`,
    )
  }
  return value
}

/** Ensures user2 onboarding is done; returns username for partner lookup (see VITE_TEST_USER2_USERNAME). */
export async function ensureUser2Username(page2: Page): Promise<string> {
  const fromEnv = process.env.VITE_TEST_USER2_USERNAME?.trim().replace(/^@/, '')
  const desired =
    fromEnv ||
    process.env.VITE_TEST_USER2_EMAIL?.split('@')[0]?.trim() ||
    'teste2'

  await completeWelcomeAndGoalOnboarding(page2)
  return desired
}

function painelHeading(page: Page) {
  return page.getByRole('heading', { name: /painel/i })
}

export async function completeWelcomeAndGoalOnboarding(page: Page) {
  const welcome = page.getByRole('dialog', { name: /bem-vindo ao synoire/i })
  if (await welcome.isVisible().catch(() => false)) {
    await welcome.getByRole('button', { name: 'Definir minha Meta' }).click()
    const goalDialog = page.getByRole('dialog', { name: /qual é o seu objetivo/i })
    await expect(goalDialog.getByLabel('Horas por semana')).toBeVisible({ timeout: 15_000 })
    await goalDialog.getByLabel('Horas por semana').fill('10')
    await goalDialog.getByRole('button', { name: 'Salvar e Começar' }).click()
    await expect(goalDialog).toBeHidden({ timeout: 30_000 })
    return
  }

  const goalDialog = page.getByRole('dialog', { name: /qual é o seu objetivo/i })
  if (await goalDialog.isVisible().catch(() => false)) {
    await goalDialog.getByLabel('Horas por semana').fill('10')
    await goalDialog.getByRole('button', { name: 'Salvar e Começar' }).click()
    await expect(goalDialog).toBeHidden({ timeout: 30_000 })
  }
}

async function completeOnboardingIfNeeded(
  page: Page,
  options: { waitForPainel?: boolean } = {},
) {
  const { waitForPainel = true } = options
  await completeWelcomeAndGoalOnboarding(page)

  if (waitForPainel) {
    await expect.poll(
      async () => painelHeading(page).isVisible(),
      { timeout: 15_000 },
    ).toBe(true)
  }
}

/** Navigates to /painel (optional), completes onboarding, and waits until the dashboard is interactive. */
export async function ensurePainelReady(
  page: Page,
  options: { navigate?: boolean } = {},
) {
  const { navigate = true } = options
  if (navigate) {
    await page.goto('/painel')
  }
  await expect(page).toHaveURL(/\/painel/, { timeout: 30_000 })
  await expect
    .poll(
      async () => {
        const welcome = page.getByRole('dialog', { name: /bem-vindo ao synoire/i })
        const goal = page.getByRole('dialog', { name: /qual é o seu objetivo/i })
        return (
          (await welcome.isVisible().catch(() => false)) ||
          (await goal.isVisible().catch(() => false)) ||
          (await painelHeading(page).isVisible().catch(() => false))
        )
      },
      { timeout: 30_000 },
    )
    .toBe(true)
  await completeOnboardingIfNeeded(page)
  await expect(painelHeading(page)).toBeVisible({ timeout: 15_000 })
}

/** Completes welcome/goal modals without navigation. Prefer ensurePainelReady when asserting the dashboard. */
export async function dismissOnboardingIfPresent(
  page: Page,
  options: { waitForPainel?: boolean } = {},
) {
  await completeOnboardingIfNeeded(page, options)
}

/** Logs in via /entrar and waits until the dashboard is ready. */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/entrar')
  await page.getByRole('tab', { name: 'Entrar' }).click()
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/painel/, { timeout: 30_000 })
  await ensurePainelReady(page, { navigate: false })
}

export async function openPartnersSidebar(page: Page) {
  const sidebar = page.getByRole('dialog', { name: 'Parceiros de estudo' })
  if (await sidebar.isVisible().catch(() => false)) {
    return
  }
  await page.getByRole('button', { name: 'Parceiros', exact: true }).click()
  await expect(sidebar).toBeVisible({ timeout: 15_000 })
}

export async function closePartnersSidebarIfOpen(page: Page) {
  const sidebar = page.getByRole('dialog', { name: 'Parceiros de estudo' })
  if (!(await sidebar.isVisible().catch(() => false))) return
  const closeBtn = page.getByRole('button', { name: 'Fechar painel de parceiros' })
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click()
  } else {
    await page.keyboard.press('Escape')
  }
  await expect(sidebar).toBeHidden({ timeout: 10_000 })
}

function partnerNameLocator(page: Page, name: string) {
  const normalized = name.replace(/^@/, '').trim()
  return page
    .getByRole('dialog', { name: 'Parceiros de estudo' })
    .getByText(new RegExp(`@?${normalized}`, 'i'))
}

function defaultUser1Username(): string {
  return (
    process.env.VITE_TEST_USERNAME?.trim().replace(/^@/, '') ||
    process.env.VITE_TEST_EMAIL?.split('@')[0]?.trim() ||
    'teste'
  )
}

async function waitForPartnerInviteOutcome(
  partnerDialog: Locator,
): Promise<'sent' | 'duplicate'> {
  const duplicateAlert = partnerDialog
    .getByRole('alert')
    .filter({ hasText: /já existe|convite ou parceria/i })

  await expect
    .poll(
      async () => {
        if (await duplicateAlert.isVisible().catch(() => false)) return 'duplicate'
        if (!(await partnerDialog.isVisible().catch(() => false))) return 'sent'
        return 'pending'
      },
      { timeout: 15_000 },
    )
    .not.toBe('pending')

  return (await duplicateAlert.isVisible().catch(() => false)) ? 'duplicate' : 'sent'
}

async function acceptPendingPartnerInviteOnUser2(page2: Page, inviter: string) {
  await openPartnersSidebar(page2)
  const pendingAccept = page2
    .getByRole('dialog', { name: 'Parceiros de estudo' })
    .getByRole('button', { name: 'Aceitar' })
    .first()
  if (await pendingAccept.isVisible().catch(() => false)) {
    await pendingAccept.click()
    await expect.poll(
      async () => partnerNameLocator(page2, inviter).first().isVisible(),
      { timeout: 15_000 },
    ).toBe(true)
  }
  await closePartnersSidebarIfOpen(page2)
}

/** Ensures user1 and user2 are accepted study partners (idempotent). */
export async function ensureStudyPartnersAccepted(
  page1: Page,
  page2: Page,
  user2Username: string,
  user1Username = defaultUser1Username(),
) {
  const normalized = user2Username.replace(/^@/, '').trim()
  const inviter = user1Username.replace(/^@/, '').trim()
  if (!normalized) {
    throw new Error('user2Username is required for partnership setup.')
  }

  await openPartnersSidebar(page2)
  const user2SeesUser1 = await partnerNameLocator(page2, inviter)
    .first()
    .isVisible()
    .catch(() => false)
  const pendingOnUser2 = page2
    .getByRole('dialog', { name: 'Parceiros de estudo' })
    .getByRole('button', { name: 'Aceitar' })
    .first()

  if (user2SeesUser1) {
    await closePartnersSidebarIfOpen(page2)
    return
  }

  if (await pendingOnUser2.isVisible().catch(() => false)) {
    await pendingOnUser2.click()
    await expect.poll(
      async () => partnerNameLocator(page2, inviter).first().isVisible(),
      { timeout: 15_000 },
    ).toBe(true)
    await closePartnersSidebarIfOpen(page2)
    return
  }

  await closePartnersSidebarIfOpen(page2)

  await openPartnersSidebar(page1)
  const user1SeesUser2 = await partnerNameLocator(page1, normalized)
    .first()
    .isVisible()
    .catch(() => false)
  if (user1SeesUser2) {
    await closePartnersSidebarIfOpen(page1)
    return
  }

  await closePartnersSidebarIfOpen(page1)
  await openPartnersSidebar(page1)

  await page1.getByRole('button', { name: '+ Convidar Parceiro' }).click()
  const partnerDialog = page1.getByRole('dialog', { name: 'Convidar parceiro' })
  await expect(partnerDialog).toBeVisible({ timeout: 10_000 })
  await page1.getByLabel('Nome de usuário').fill(normalized)
  await partnerDialog.getByRole('button', { name: 'Enviar' }).click()

  const outcome = await waitForPartnerInviteOutcome(partnerDialog)

  if (outcome === 'duplicate') {
    await page1.keyboard.press('Escape')
    await acceptPendingPartnerInviteOnUser2(page2, inviter)
    await openPartnersSidebar(page2)
    const partnered = await partnerNameLocator(page2, inviter)
      .first()
      .isVisible()
      .catch(() => false)
    if (!partnered) {
      await openPartnersSidebar(page1)
      const user1SeesUser2AfterDup = await partnerNameLocator(page1, normalized)
        .first()
        .isVisible()
        .catch(() => false)
      await closePartnersSidebarIfOpen(page1)
      if (!user1SeesUser2AfterDup) {
        throw new Error(
          'Convite de parceria duplicado, mas parceiros não aparecem na sidebar. Verifique VITE_TEST_USER2_USERNAME vs displayName.',
        )
      }
    }
    await closePartnersSidebarIfOpen(page2)
    return
  }

  await acceptPendingPartnerInviteOnUser2(page2, inviter)
}

/** Creates a private room in a public hub and returns the room id from the URL. */
export async function createPrivateRoomInHub(
  page: Page,
  hubLinkName: RegExp | string,
  roomTheme: string,
): Promise<string> {
  await page.getByRole('link', { name: 'Hubs' }).click()
  await expect(page).toHaveURL(/\/hubs/)

  const hubLink =
    typeof hubLinkName === 'string'
      ? page.getByRole('link', { name: hubLinkName })
      : page.getByRole('link', { name: hubLinkName }).first()
  await expect(hubLink).toBeVisible({ timeout: 15_000 })
  await hubLink.click()

  await expect(page).toHaveURL(/\/hubs\//, { timeout: 15_000 })
  await expect(
    page.getByRole('heading', { name: /salas ativas/i }),
  ).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: '+ Criar sala' }).click()
  await expect(
    page.getByRole('heading', { name: /o que vamos estudar agora/i }),
  ).toBeVisible({ timeout: 10_000 })

  await page.getByLabel('Tema').fill(roomTheme)
  await page.getByRole('switch', { name: /criar como sala privada/i }).click()
  await page
    .getByRole('heading', { name: /o que vamos estudar agora/i })
    .locator('..')
    .getByRole('button', { name: 'Criar', exact: true })
    .click()

  await expect(page).toHaveURL(/\/salas\/[0-9a-f-]{36}/i, { timeout: 30_000 })
  const match = page.url().match(/\/salas\/([0-9a-f-]{36})/i)
  if (!match?.[1]) {
    throw new Error(`Could not parse room id from URL: ${page.url()}`)
  }
  return match[1]
}

export async function openRoomInviteModal(page: Page) {
  const inviteToolbarBtn = page.getByRole('button', { name: /copiar link de convite/i })
  await expect(inviteToolbarBtn).toBeVisible({ timeout: 15_000 })
  await inviteToolbarBtn.click()
  await expect(
    page.getByRole('dialog', { name: 'Convidar parceiros' }),
  ).toBeVisible({ timeout: 10_000 })
}

/** Captures a private room invite URL via RPC intercept when copying the link. */
export async function captureRoomInviteLink(
  page: Page,
  roomId: string,
  baseURL = 'http://localhost:5173',
): Promise<string> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes('rpc/get_or_create_room_invite_token') &&
        r.request().method() === 'POST',
      { timeout: 30_000 },
    ),
    page
      .getByRole('dialog', { name: 'Convidar parceiros' })
      .getByRole('button', { name: 'Copiar link de convite' })
      .click(),
  ])

  if (!response.ok()) {
    throw new Error(
      `get_or_create_room_invite_token failed: ${response.status()} ${response.statusText()}`,
    )
  }

  const token = (await response.json()) as unknown
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Invite token RPC did not return a string.')
  }

  const params = new URLSearchParams({ invite: token.trim() })
  return `${baseURL}/salas/${encodeURIComponent(roomId)}?${params.toString()}`
}

/** Asserts user can access a private room (onboarding, lounge, or active session). */
export async function expectPrivateRoomAccessible(page: Page) {
  const main = page.getByRole('main')
  const sair = main.getByRole('button', { name: 'Sair' })
  const joinBtn = main.getByRole('button', { name: 'Entrar no ciclo atual' })
  const onboarding = page.getByRole('dialog', { name: /onboarding da sessão/i })
  const chat = main.getByRole('button', { name: 'Chat da sala' })

  await expect
    .poll(
      async () => {
        if (await sair.isVisible().catch(() => false)) return true
        if (await joinBtn.isVisible().catch(() => false)) return true
        if (await onboarding.isVisible().catch(() => false)) return true
        return chat.isVisible().catch(() => false)
      },
      { timeout: 30_000 },
    )
    .toBe(true)
}

/** Parses dashboard "Hoje" metric (e.g. "0h", "25min", "1.5h") to minutes. */
export async function readTodayStudyMinutes(page: Page): Promise<number> {
  const todaySection = page.locator('div').filter({ has: page.getByText('Hoje', { exact: true }) })
  const valueText = await todaySection.locator('.tabular-nums').first().textContent()
  const raw = (valueText ?? '0h').trim().toLowerCase()
  if (raw.endsWith('min')) {
    return Number.parseInt(raw, 10) || 0
  }
  if (raw.endsWith('h')) {
    const hours = Number.parseFloat(raw.replace('h', ''))
    return Number.isFinite(hours) ? Math.round(hours * 60) : 0
  }
  return 0
}
