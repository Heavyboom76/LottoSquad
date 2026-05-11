import '../css/style.css'
import { supabase } from './supabase.js'
import { getAuthUser, getAdminGroup, getMemberSession, getLastGroupId } from './auth.js'
import { renderLanding }    from './views/landing.js'
import { renderAuth }       from './views/auth.js'
import { renderOnboarding } from './views/onboarding.js'
import { renderJoin }       from './views/join.js'
import { renderApp }        from './views/app.js'

const root  = document.getElementById('root')
const toast = document.getElementById('toast')

// ── Toast ─────────────────────────────────────────────────────────────────
let toastTimer = null
export function showToast(message, type = '') {
  toast.textContent = message
  toast.className = `toast${type ? ' ' + type : ''}`
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500)
}

export function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ── Router ────────────────────────────────────────────────────────────────
export async function navigate(path, state = {}) {
  // Update URL without reload
  window.history.pushState(state, '', path)
  await dispatch(path, state)
}

async function dispatch(path, state = {}) {
  root.innerHTML = `<div class="loading-spinner" style="min-height:100vh"></div>`

  // /join/:slug  — member invite link
  const joinMatch = path.match(/^\/join\/(.+)$/)
  if (joinMatch) {
    await renderJoin(root, joinMatch[1])
    return
  }

  // /signup | /login
  if (path === '/signup' || path === '/login') {
    await renderAuth(root, path === '/signup' ? 'signup' : 'login')
    return
  }

  // /onboarding — admin just signed up, no group yet
  if (path === '/onboarding') {
    await renderOnboarding(root)
    return
  }

  // /app — main authenticated app
  if (path === '/app') {
    await renderApp(root)
    return
  }

  // / — smart redirect
  const authUser     = await getAuthUser()
  const memberSession = getMemberSession()

  if (authUser) {
    const group = await getAdminGroup(authUser.id)
    if (!group) { await navigate('/onboarding'); return }
    await renderApp(root)
    return
  }

  if (memberSession) {
    await renderApp(root)
    return
  }

  await renderLanding(root)
}

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }

  // Listen for back/forward
  window.addEventListener('popstate', () => dispatch(location.pathname))

  // Supabase auth state changes (e.g. email confirmation redirect)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && location.pathname === '/login') {
      const group = await getAdminGroup(session.user.id)
      await navigate(group ? '/app' : '/onboarding')
    }
    if (event === 'SIGNED_OUT') {
      await navigate('/')
    }
  })

  await dispatch(location.pathname)
}

init()
