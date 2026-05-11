import { signIn, signUp, getAdminGroup } from '../auth.js'
import { navigate, showToast, escHtml } from '../main.js'

export async function renderAuth(container, mode = 'login') {
  const isSignup = mode === 'signup'

  container.innerHTML = `
    <div class="auth-screen">
      <div class="auth-box">
        <a class="back-link" id="auth-back">← Back</a>
        <div class="auth-logo">🎰</div>
        <div class="auth-title">${isSignup ? 'Create Account' : 'Welcome Back'}</div>
        <p class="auth-sub">${isSignup ? 'Admin account — you\'ll run the squad' : 'Sign in to manage your squad'}</p>

        <div style="display:flex;flex-direction:column;gap:10px">
          <input id="auth-email" type="email" class="text-input" placeholder="Email address" autocomplete="email" />
          <input id="auth-password" type="password" class="text-input" placeholder="Password ${isSignup ? '(min 6 chars)' : ''}" autocomplete="${isSignup ? 'new-password' : 'current-password'}" />
          <div id="auth-error" class="error-msg hidden"></div>
          <button id="auth-submit" class="btn btn-grad">${isSignup ? '🚀 Create Account' : '→ Sign In'}</button>
        </div>

        <div class="auth-divider"><span>or</span></div>

        <div class="auth-switch">
          ${isSignup
            ? `Already have an account? <a id="auth-toggle">Sign in</a>`
            : `No account yet? <a id="auth-toggle">Create one free</a>`
          }
        </div>

        ${!isSignup ? `
          <div class="auth-divider"><span>member?</span></div>
          <p style="font-size:0.82rem;color:var(--text-muted);text-align:center">If you're a member (not the admin), ask your squad leader for the invite link.</p>
        ` : ''}
      </div>
    </div>
  `

  const emailEl    = container.querySelector('#auth-email')
  const passwordEl = container.querySelector('#auth-password')
  const errorEl    = container.querySelector('#auth-error')
  const submitBtn  = container.querySelector('#auth-submit')

  container.querySelector('#auth-back').addEventListener('click', () => navigate('/'))
  container.querySelector('#auth-toggle')?.addEventListener('click', () =>
    navigate(isSignup ? '/login' : '/signup')
  )

  const submit = async () => {
    const email    = emailEl.value.trim()
    const password = passwordEl.value
    if (!email || !password) { showError('Please fill in both fields'); return }
    if (isSignup && password.length < 6) { showError('Password must be at least 6 characters'); return }

    submitBtn.disabled = true
    submitBtn.textContent = isSignup ? 'Creating account...' : 'Signing in...'
    errorEl.classList.add('hidden')

    try {
      if (isSignup) {
        await signUp(email, password)
        // After signup, go straight to onboarding (Supabase auto-confirms in dev,
        // or email confirm is sent — either way navigate to onboarding)
        await navigate('/onboarding')
      } else {
        const user = await signIn(email, password)
        const group = await getAdminGroup(user.id)
        await navigate(group ? '/app' : '/onboarding')
      }
    } catch (err) {
      showError(err.message)
      submitBtn.disabled = false
      submitBtn.textContent = isSignup ? '🚀 Create Account' : '→ Sign In'
    }
  }

  function showError(msg) {
    errorEl.textContent = msg
    errorEl.classList.remove('hidden')
  }

  submitBtn.addEventListener('click', submit)
  passwordEl.addEventListener('keydown', e => { if (e.key === 'Enter') submit() })
  emailEl.addEventListener('keydown',    e => { if (e.key === 'Enter') passwordEl.focus() })
}
