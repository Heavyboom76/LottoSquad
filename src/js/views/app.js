/**
 * Main app shell — renders after auth.
 * Resolves the active group and current user identity (admin or member),
 * then shows the nav + view container.
 */

import { getAuthUser, getAdminGroup, getMemberSession, clearMemberSession, signOut } from '../auth.js'
import { supabase } from '../supabase.js'
import { navigate, showToast, escHtml } from '../main.js'
import { showRulesModal, DEFAULT_RULES } from '../rules.js'
import { showHelpModal } from './help.js'
import { renderDashboard } from './dashboard.js'
import { renderTickets }   from './tickets.js'
import { renderHistory }   from './history.js'
import { renderAdmin }     from './admin.js'

// Shared context — populated once per app load, used by all views
export let ctx = {
  group:    null,   // group row
  authUser: null,   // Supabase auth user (admin only, else null)
  member:   null,   // { id, name, group_id } from localStorage (member session)
  isAdmin:  false,  // true if authUser owns this group
}

let currentView = 'dashboard'

export async function renderApp(container) {
  // Resolve identity & group
  const authUser = await getAuthUser()
  const memberSession = getMemberSession()

  let group = null
  let isAdmin = false

  if (authUser) {
    group = await getAdminGroup(authUser.id)
    if (!group) { await navigate('/onboarding'); return }
    isAdmin = true
  } else if (memberSession) {
    const { data } = await supabase.from('groups').select('*').eq('id', memberSession.group_id).single()
    group = data || null
    if (!group) {
      // Group was deleted — clear session
      clearMemberSession()
      await navigate('/')
      return
    }
  } else {
    await navigate('/')
    return
  }

  ctx = { group, authUser, member: memberSession, isAdmin }

  // Build shell
  container.innerHTML = `
    <div class="app-shell">
      <header class="top-bar">
        <div class="top-bar-inner">
          <span class="squad-name">${escHtml(group.name)}</span>
          <div class="top-bar-right">
            ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
            <button id="app-menu-btn" style="background:none;border:none;color:var(--text-muted);font-size:1.4rem;cursor:pointer;padding:4px">⚙</button>
          </div>
        </div>
      </header>

      <main id="view" class="view-container"></main>

      <nav class="bottom-nav">
        <button class="nav-btn active" data-view="dashboard">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Pool</span>
        </button>
        <button class="nav-btn" data-view="tickets">
          <span class="nav-icon">🎟</span>
          <span class="nav-label">Tickets</span>
        </button>
        <button class="nav-btn" data-view="history">
          <span class="nav-icon">📋</span>
          <span class="nav-label">History</span>
        </button>
        ${isAdmin ? `
        <button class="nav-btn" data-view="admin">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">Manage</span>
        </button>
        ` : ''}
      </nav>
    </div>

    <!-- Settings sheet -->
    <div id="settings-sheet" class="modal hidden">
      <div class="modal-box">
        <div style="font-family:'Bebas Neue',cursive;font-size:1.4rem;letter-spacing:0.05em;margin-bottom:4px">${escHtml(group.name)}</div>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px">${isAdmin ? authUser.email : memberSession?.name || ''}</p>

        ${group.rules ? `
          <div style="margin-bottom:16px">
            <div class="label">Pool Rules</div>
            <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;font-size:0.83rem;color:var(--text-muted);max-height:180px;overflow-y:auto">
              ${escHtml(group.rules).replace(/\n/g,'<br>')}
            </div>
          </div>
        ` : ''}

        ${group.etransfer_info ? `
          <div class="etransfer-box" style="margin-bottom:16px">
            <div class="etransfer-label">Send E-Transfer to</div>
            <div class="etransfer-value">${escHtml(group.etransfer_info)}</div>
          </div>
        ` : ''}

        <div style="display:flex;flex-direction:column;gap:8px">
          ${isAdmin ? `<button id="settings-invite" class="btn btn-outline">🔗 Copy Invite Link</button>` : ''}
          <button id="settings-rules" class="btn btn-ghost">📋 View Pool Rules</button>
          <button id="settings-help" class="btn btn-ghost">❓ Help & FAQ</button>
          <button id="settings-signout" class="btn btn-ghost" style="color:var(--red)">${isAdmin ? 'Sign Out' : 'Leave Squad'}</button>
          <button id="settings-close" class="btn btn-ghost">Close</button>
        </div>
      </div>
    </div>
  `

  const viewEl = container.querySelector('#view')

  // Nav
  container.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view
      container.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b === btn))
      renderView(viewEl, currentView)
    })
  })

  // Settings sheet
  const sheet = container.querySelector('#settings-sheet')
  container.querySelector('#app-menu-btn').addEventListener('click', () => sheet.classList.remove('hidden'))
  container.querySelector('#settings-close').addEventListener('click', () => sheet.classList.add('hidden'))
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.classList.add('hidden') })

  container.querySelector('#settings-rules').addEventListener('click', () => {
    sheet.classList.add('hidden')
    showRulesModal(group.rules)
  })

  container.querySelector('#settings-help').addEventListener('click', () => {
    sheet.classList.add('hidden')
    showHelpModal()
  })

  container.querySelector('#settings-invite')?.addEventListener('click', () => {
    const url = `${location.origin}/join/${group.slug}`
    navigator.clipboard.writeText(url).then(() => {
      showToast('Invite link copied! 🔗', 'success')
      sheet.classList.add('hidden')
    }).catch(() => showToast(url, ''))
  })

  container.querySelector('#settings-signout').addEventListener('click', async () => {
    if (!confirm(isAdmin ? 'Sign out?' : 'Leave this squad? You can rejoin with the invite link.')) return
    if (isAdmin) { await signOut(); await navigate('/') }
    else { clearMemberSession(); await navigate('/') }
  })

  // Initial view
  await renderView(viewEl, 'dashboard')
}

async function renderView(el, view) {
  switch (view) {
    case 'dashboard': await renderDashboard(el); break
    case 'tickets':   await renderTickets(el);   break
    case 'history':   await renderHistory(el);   break
    case 'admin':     await renderAdmin(el);      break
  }
}
