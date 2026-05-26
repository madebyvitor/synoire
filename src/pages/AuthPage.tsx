import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  MIN_PASSWORD_LENGTH,
  signIn,
  signInWithGoogle,
  signUp,
  validateSignInInput,
  validateSignUpInput,
} from '@/lib/auth'
import {
  clearOAuthCallbackFromUrl,
  getOAuthCallbackError,
  OAUTH_PENDING_STORAGE_KEY,
  OAUTH_SESSION_FAILED_MESSAGE,
} from '@/lib/auth/oauthCallback'
import { resolvePostAuthRedirect } from '@/lib/auth/resolvePostAuthRedirect'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

type AuthMode = 'login' | 'signup'

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-primary placeholder:text-secondary/60 focus:border-firefly/40 focus:outline-none focus:ring-1 focus:ring-firefly/30'

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const supabaseReady = isSupabaseConfigured && getSupabase()
  const reduced = usePrefersReducedMotion()
  const c = pageStaggerContainer(reduced)
  const item = pageStaggerItem(reduced)

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const postAuthPath = resolvePostAuthRedirect(
    (location.state as { from?: string } | null)?.from,
  )

  useEffect(() => {
    if (!authLoading && isAuthenticated && supabaseReady) {
      navigate(postAuthPath, { replace: true })
    }
  }, [authLoading, isAuthenticated, supabaseReady, navigate, postAuthPath])

  useEffect(() => {
    const urlError = getOAuthCallbackError()
    if (urlError) {
      setError(urlError)
      clearOAuthCallbackFromUrl()
    }
  }, [])

  useEffect(() => {
    if (authLoading || isAuthenticated) return

    const hadOAuthPending =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(OAUTH_PENDING_STORAGE_KEY) === '1'
    if (!hadOAuthPending) return

    sessionStorage.removeItem(OAUTH_PENDING_STORAGE_KEY)
    const fromPainel =
      (location.state as { from?: string } | null)?.from === '/painel'
    if (fromPainel) {
      setError(OAUTH_SESSION_FAILED_MESSAGE)
    }
  }, [authLoading, isAuthenticated, location.state])

  const goToPainel = () => {
    navigate(postAuthPath)
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!supabaseReady) {
      setError('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.')
      return
    }

    if (mode === 'login') {
      const validationError = validateSignInInput({ email, password })
      if (validationError) {
        setError(validationError)
        return
      }
      setIsSubmitting(true)
      const result = await signIn({ email, password })
      setIsSubmitting(false)
      if (!result.ok) {
        setError(result.message)
        return
      }
      navigate(postAuthPath)
      return
    }

    const validationError = validateSignUpInput({ email, password, username })
    if (validationError) {
      setError(validationError)
      return
    }
    setIsSubmitting(true)
    const result = await signUp({
      email,
      password,
      username,
    })
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (result.needsEmailConfirmation) {
      setInfo('Enviamos um link de confirmação para seu e-mail. Confirme antes de entrar.')
      return
    }
    navigate(postAuthPath)
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setInfo(null)

    if (!supabaseReady) {
      setError('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.')
      return
    }

    setIsSubmitting(true)
    const result = await signInWithGoogle()
    if (!result.ok) {
      setIsSubmitting(false)
      setError(result.message)
    }
  }

  const canSubmit =
    supabaseReady &&
    !isSubmitting &&
    (mode === 'login'
      ? email.trim().length > 0 && password.length > 0
      : email.trim().length > 0 &&
          password.length >= MIN_PASSWORD_LENGTH &&
          username.trim().length >= 2)

  return (
    <motion.div
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16"
      variants={c}
      initial={reduced ? false : 'hidden'}
      animate="visible"
    >
      <motion.h1 variants={item} className="text-2xl font-semibold text-primary">
        {mode === 'login' ? 'Entrar' : 'Criar conta'}
      </motion.h1>
      <motion.p variants={item} className="mt-2 text-sm text-secondary">
        {demoMode
          ? 'Modo demo disponível abaixo. Com Supabase configurado, use o formulário para auth real.'
          : 'Acesse sua conta ou cadastre-se para estudar com a comunidade.'}
      </motion.p>

      <motion.div
        variants={item}
        className="mt-6 flex rounded-xl border border-border bg-surface p-1"
        role="tablist"
        aria-label="Tipo de acesso"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => switchMode('login')}
          className={
            mode === 'login'
              ? 'flex-1 rounded-lg bg-elevated px-3 py-2 text-sm font-medium text-primary'
              : 'flex-1 rounded-lg px-3 py-2 text-sm text-secondary hover:text-primary'
          }
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => switchMode('signup')}
          className={
            mode === 'signup'
              ? 'flex-1 rounded-lg bg-elevated px-3 py-2 text-sm font-medium text-primary'
              : 'flex-1 rounded-lg px-3 py-2 text-sm text-secondary hover:text-primary'
          }
        >
          Criar conta
        </button>
      </motion.div>

      {!demoMode && !supabaseReady && (
        <motion.p
          variants={item}
          className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
        >
          Defina <code className="text-amber-100">VITE_SUPABASE_URL</code> e{' '}
          <code className="text-amber-100">VITE_SUPABASE_ANON_KEY</code> no arquivo{' '}
          <code className="text-amber-100">.env</code> para habilitar o cliente.
        </motion.p>
      )}

      <motion.form variants={item} className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        <label className="block text-sm text-secondary">
          E-mail
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
              setInfo(null)
            }}
            className={inputClass}
            placeholder="voce@email.com"
          />
        </label>

        <label className="block text-sm text-secondary">
          Senha
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
              setInfo(null)
            }}
            className={inputClass}
            placeholder={mode === 'signup' ? `Mín. ${MIN_PASSWORD_LENGTH} caracteres` : '••••••••'}
          />
        </label>

        {mode === 'signup' && (
          <>
            <label className="block text-sm text-secondary">
              Nome de usuário
              <input
                type="text"
                autoComplete="username"
                value={username}
                maxLength={32}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError(null)
                }}
                className={inputClass}
                placeholder="concurseiro_ninja"
              />
            </label>
          </>
        )}

        {error && (
          <p className="text-sm text-amber-200" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="text-sm text-firefly" role="status">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-firefly px-4 py-3 text-sm font-medium text-night hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting
            ? 'Aguarde…'
            : mode === 'login'
              ? 'Entrar'
              : 'Criar conta'}
        </button>
      </motion.form>

      <motion.div variants={item} className="mt-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span className="text-xs text-secondary">ou</span>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </motion.div>

      <motion.div variants={item} className="mt-4">
        <button
          type="button"
          disabled={!supabaseReady || isSubmitting}
          onClick={() => void handleGoogleSignIn()}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-primary transition hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar com Google
        </button>
      </motion.div>

      <motion.p variants={item} className="mt-6 text-center text-xs text-secondary">
        Ao criar uma conta, você concorda com nossos{' '}
        <Link
          to="/terms"
          className="text-firefly underline decoration-firefly/40 underline-offset-2 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-firefly/50"
        >
          Termos de Uso
        </Link>{' '}
        e{' '}
        <Link
          to="/privacy"
          className="text-firefly underline decoration-firefly/40 underline-offset-2 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-firefly/50"
        >
          Política de Privacidade
        </Link>
        .
      </motion.p>

      {demoMode && (
        <motion.div variants={item} className="mt-6 space-y-3 border-t border-border pt-6">
          <p className="text-xs text-secondary">
            Modo demo: nenhuma conta é criada. Rotas protegidas exigem login real quando o
            Supabase estiver configurado.
          </p>
          <button
            type="button"
            onClick={goToPainel}
            className="w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-primary transition hover:bg-elevated"
          >
            Ir ao painel sem conta (demo)
          </button>
        </motion.div>
      )}

      <motion.div variants={item}>
        <Link
          to="/"
          className="mt-10 inline-block text-sm text-secondary hover:text-primary"
        >
          ← Voltar
        </Link>
      </motion.div>
    </motion.div>
  )
}
