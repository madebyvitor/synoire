export { MIN_PASSWORD_LENGTH, WEAK_PASSWORD_MESSAGE } from './constants'
export { mapAuthError, validateSignInInput, validateSignUpInput } from './errors'
export { signIn, type SignInInput, type SignInResult } from './signIn'
export {
  signInWithGoogle,
  type SignInWithGoogleResult,
} from './signInWithGoogle'
export {
  clearLastActivity,
  getLastActivityAt,
  isIdleExpired,
  LAST_ACTIVITY_STORAGE_KEY,
  SESSION_IDLE_MS,
  touchLastActivity,
} from './sessionIdle'
export {
  clearOAuthCallbackFromUrl,
  isAuthSessionReady,
  isOAuthCallbackUrl,
} from './oauthCallback'
export { signUp, type SignUpInput, type SignUpResult } from './signUp'
