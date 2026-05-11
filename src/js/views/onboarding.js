import { getAuthUser, createGroup } from '../auth.js'
import { navigate, showToast, escHtml } from '../main.js'
import { DEFAULT_RULES } from '../rules.js'

export async function renderOnboarding(container) {
  const user = await getAuthUser()
  if (!user) { await navigate('/login'); return }

  container.innerHTML = `
    <div class="onboarding-screen">
      <div class="onboarding-header">
        <div style="font-size:2rem">🎰</div>
        <h1>Set Up Your Squad</h1>
      </div>

      <div class="onboarding-body">
        <div class="onboarding-step-label">Step 1 of 1</div>
        <div class="onboarding-heading">Tell us about your pool</div>
        <p class="onboarding-sub">You can change any of this later in your admin settings.</p>

        <div style="display:flex;flex-direction:column;gap:10px">
          <div>
            <div class="label">Squad Name *</div>
            <input id="ob-name" type="text" class="text-input" placeholder="e.g. The Office Crew, Family Pool" maxlength="40" />
          </div>

          <div>
            <div class="label">E-Transfer Info *</div>
            <input id="ob-etransfer" type="text" class="text-input" placeholder="e.g. yourname@email.com" maxlength="80" />
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">Members will see this when they need to send their buy-in.</div>
          </div>

          <div>
            <div class="label" style="display:flex;justify-content:space-between;align-items:center">
              <span>Pool Rules</span>
              <button id="ob-load-defaults" style="background:none;border:none;color:var(--purple-light);font-size:0.75rem;cursor:pointer;text-decoration:underline;padding:0">Load defaults</button>
            </div>
            <textarea id="ob-rules" class="text-input" rows="5" placeholder="Your pool rules — members will see these when they join." style="resize:vertical;font-size:0.82rem"></textarea>
          </div>

          <div id="ob-error" class="error-msg hidden"></div>
          <button id="ob-submit" class="btn btn-grad" style="margin-top:4px">🚀 Create My Squad</button>
        </div>
      </div>
    </div>
  `

  const errorEl = container.querySelector('#ob-error')

  container.querySelector('#ob-load-defaults').addEventListener('click', () => {
    container.querySelector('#ob-rules').value = DEFAULT_RULES
  })

  container.querySelector('#ob-submit').addEventListener('click', async (e) => {
    const btn  = e.currentTarget
    const name = container.querySelector('#ob-name').value.trim()
    const etransfer = container.querySelector('#ob-etransfer').value.trim()
    const rules = container.querySelector('#ob-rules').value.trim()

    if (!name)      { showErr('Give your squad a name'); return }
    if (!etransfer) { showErr('Add your e-Transfer info so members know where to send money'); return }

    btn.disabled = true; btn.textContent = 'Creating...'
    errorEl.classList.add('hidden')

    try {
      await createGroup({ name, etransfer_info: etransfer, rules: rules || null })
      showToast('Squad created! 🎉', 'success')
      await navigate('/app')
    } catch (err) {
      showErr(err.message)
      btn.disabled = false; btn.textContent = '🚀 Create My Squad'
    }
  })

  function showErr(msg) {
    errorEl.textContent = msg
    errorEl.classList.remove('hidden')
  }
}
