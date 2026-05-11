import { getGroupBySlug, fetchGroupMembers, createMember, setMemberSession } from '../auth.js'
import { navigate, showToast, escHtml } from '../main.js'
import { showRulesModal, DEFAULT_RULES } from '../rules.js'

export async function renderJoin(container, slug) {
  container.innerHTML = `<div class="loading-spinner" style="min-height:100vh"></div>`

  let group
  try {
    group = await getGroupBySlug(slug)
  } catch {
    container.innerHTML = `
      <div class="join-screen">
        <div class="join-box">
          <div style="text-align:center;font-size:3rem">🤔</div>
          <div class="join-squad-name">Squad Not Found</div>
          <p style="text-align:center;color:var(--text-muted);font-size:0.9rem">This invite link doesn't match any squad. Ask your admin for a fresh link.</p>
          <button class="btn btn-grad" id="join-home">Go to LottoSquad</button>
        </div>
      </div>
    `
    container.querySelector('#join-home').addEventListener('click', () => navigate('/'))
    return
  }

  container.innerHTML = `
    <div class="join-screen">
      <div class="join-box">
        <div style="text-align:center;font-size:3rem">🎉</div>
        <p style="text-align:center;color:var(--text-muted);font-size:0.85rem">You've been invited to join</p>
        <div class="join-squad-name">${escHtml(group.name)}</div>

        ${group.rules ? `
          <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;font-size:0.82rem;color:var(--text-muted);max-height:120px;overflow-y:auto">
            <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.1em;color:var(--purple-light);margin-bottom:6px">POOL RULES</div>
            ${escHtml(group.rules).replace(/\n/g, '<br>')}
          </div>
        ` : ''}

        <div style="display:flex;flex-direction:column;gap:10px">
          <div>
            <div class="label">Your Name</div>
            <input id="join-name" type="text" class="text-input" placeholder="What should we call you?" maxlength="30" />
          </div>
          <div id="join-error" class="error-msg hidden"></div>
          <button id="join-submit" class="btn btn-grad">Join the Squad 🚀</button>
        </div>

        <p style="text-align:center;font-size:0.78rem;color:var(--text-dim)">Already a member? Enter your exact name to sign back in.</p>
        <button id="join-rules-btn" style="background:none;border:none;color:var(--purple-light);font-size:0.8rem;cursor:pointer;text-decoration:underline;padding:4px 0;width:100%;text-align:center">
          📋 View Pool Rules
        </button>
      </div>
    </div>
  `

  const nameInput = container.querySelector('#join-name')
  const errorEl   = container.querySelector('#join-error')

  nameInput.focus()
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') submit() })
  container.querySelector('#join-submit').addEventListener('click', submit)
  container.querySelector('#join-rules-btn').addEventListener('click', () => showRulesModal(group.rules))

  async function submit() {
    const btn  = container.querySelector('#join-submit')
    const name = nameInput.value.trim()
    if (!name) { showErr('Enter your name first'); return }

    btn.disabled = true; btn.textContent = 'Joining...'
    errorEl.classList.add('hidden')

    try {
      // Try to find existing member first (re-joining)
      const existing = await fetchGroupMembers(group.id)
      let member = existing.find(m => m.name.toLowerCase() === name.toLowerCase())

      if (!member) {
        member = await createMember(group.id, name)
      }

      setMemberSession({ id: member.id, name: member.name, group_id: group.id })
      showToast(`Welcome to ${group.name}! 🎉`, 'success')
      await navigate('/app')
    } catch (err) {
      showErr(err.message)
      btn.disabled = false; btn.textContent = 'Join the Squad 🚀'
    }
  }

  function showErr(msg) {
    errorEl.textContent = msg
    errorEl.classList.remove('hidden')
  }
}
