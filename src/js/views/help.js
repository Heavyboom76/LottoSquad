/**
 * In-app Help & FAQ modal
 */

export function showHelpModal() {
  // Remove any existing instance
  document.getElementById('help-modal')?.remove()

  const modal = document.createElement('div')
  modal.id = 'help-modal'
  modal.className = 'modal'
  modal.innerHTML = `
    <div class="modal-box" style="border-radius:20px 20px 0 0;max-height:92vh">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div style="font-family:'Bebas Neue',cursive;font-size:1.6rem;letter-spacing:0.05em">❓ Help & FAQ</div>
        <button id="help-close" style="background:none;border:none;color:var(--text-muted);font-size:1.4rem;cursor:pointer;padding:4px;line-height:1">✕</button>
      </div>

      <!-- TABS -->
      <div style="display:flex;gap:6px;margin-bottom:20px">
        <button class="help-tab active" data-tab="members" style="flex:1;padding:8px 4px;border-radius:8px;border:1px solid var(--border);background:var(--purple);color:#fff;font-size:0.8rem;font-weight:700;cursor:pointer">👤 Members</button>
        <button class="help-tab" data-tab="admins" style="flex:1;padding:8px 4px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card2);color:var(--text-muted);font-size:0.8rem;font-weight:700;cursor:pointer">⚙️ Admins</button>
        <button class="help-tab" data-tab="faq" style="flex:1;padding:8px 4px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card2);color:var(--text-muted);font-size:0.8rem;font-weight:700;cursor:pointer">💬 FAQ</button>
      </div>

      <!-- MEMBERS TAB -->
      <div id="help-tab-members" class="help-tab-content">
        ${section('🎟 Joining a Squad', `
          <p>Your squad admin will send you an <strong>invite link</strong>. Tap it on your phone and you'll land on the LottoSquad join page.</p>
          <p>Enter your name and tap <strong>Join Squad</strong>. That's it — no account or password needed.</p>
        `)}

        ${section('💵 Buying In', `
          <p>When your admin creates a draw, you'll see it on the <strong>Pool tab</strong> with a buy-in amount (e.g. $5/person).</p>
          <ol>
            <li>Tap <strong>I'm In</strong> to register your spot.</li>
            <li>Send your buy-in via e-transfer to the address shown in the app.</li>
            <li>Your admin will mark you as <strong>Confirmed</strong> once they receive it — your name will go green.</li>
          </ol>
          <p style="color:var(--text-muted);font-size:0.82rem">⚠️ You're only included in the pool once confirmed.</p>
        `)}

        ${section('🎱 Checking Your Tickets', `
          <p>Tap the <strong>Tickets tab</strong> to see every ticket your squad purchased for the current draw.</p>
          <p>Once the draw is settled, matched numbers glow <span style="color:var(--gold);font-weight:700">gold</span> and each ticket shows its prize tier (e.g. <em>Match 3 — Free Play</em>).</p>
        `)}

        ${section('🏆 Seeing Prize Results', `
          <p>After the draw, your admin enters the winning numbers. The app then:</p>
          <ul>
            <li>Highlights which of your numbers matched</li>
            <li>Shows the prize tier for each ticket</li>
            <li>Displays the <strong>total prize won</strong> and your <strong>per-person share</strong></li>
          </ul>
          <p>You can also see full results for past draws in the <strong>History tab</strong>.</p>
        `)}

        ${section('📋 Draw Statuses', `
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
            ${badge('open', 'open', 'Buy-ins are open — tap I\'m In to join.')}
            ${badge('closed', 'closed', 'Buy-ins are locked. The draw hasn\'t happened yet.')}
            ${badge('settled', 'settled', 'Draw is done. Results and prizes are posted.')}
          </div>
        `)}
      </div>

      <!-- ADMINS TAB -->
      <div id="help-tab-admins" class="help-tab-content hidden">
        ${section('🏗 Setting Up Your Squad', `
          <p>After signing in, create your squad by entering a name and optional pool rules + e-transfer info.</p>
          <p>Share your <strong>invite link</strong> via the ⚙ menu → <em>Copy Invite Link</em>. Send it to everyone joining the pool.</p>
        `)}

        ${section('➕ Creating a Draw', `
          <p>Go to the <strong>Manage tab</strong> and tap <strong>New Draw</strong>. Fill in:</p>
          <ul>
            <li><strong>Lottery type</strong> — Western 6/49, Lotto Max, etc.</li>
            <li><strong>Draw date</strong></li>
            <li><strong>Buy-in amount</strong> per person</li>
            <li><strong>Jackpot amount</strong> (optional, for display)</li>
          </ul>
          <p>Once created, members can see it and tap I'm In.</p>
        `)}

        ${section('✅ Confirming Payments', `
          <p>In the <strong>Manage tab</strong>, you'll see a list of members and their payment status.</p>
          <p>When someone sends their e-transfer, tap <strong>Confirm</strong> next to their name. This includes them in the prize split calculation.</p>
          <p>You can undo a confirmation at any time before settling.</p>
        `)}

        ${section('📷 Scanning Tickets with AI', `
          <p>In the Manage tab, tap <strong>Scan Ticket</strong> and point your camera at the ticket.</p>
          <p>AI reads the numbers automatically and adds the ticket to the draw. You can also enter numbers manually if needed.</p>
          <p style="color:var(--text-muted);font-size:0.82rem">💡 Tip: Scan in good lighting with the ticket flat. The AI handles all 6 lottery types.</p>
        `)}

        ${section('🔒 Closing Buy-ins', `
          <p>Tap <strong>Lock Buy-ins</strong> when you've purchased the tickets and don't want any more members joining. Status changes to <em>closed</em>.</p>
          <p>You can reopen at any time before settling.</p>
        `)}

        ${section('🏆 Settling a Draw', `
          <p>After the draw happens, tap <strong>Enter Results</strong> in the Manage tab.</p>
          <ol>
            <li>Enter the <strong>winning numbers</strong> — a live preview shows each ticket's matches instantly.</li>
            <li>Enter the <strong>bonus number</strong> if applicable.</li>
            <li>Enter the <strong>total prize won</strong> (cash value, or $0 for free play).</li>
            <li>Add optional notes (e.g. <em>2× Free Play</em>).</li>
            <li>Tap <strong>Save Results & Settle</strong>.</li>
          </ol>
          <p>Members will immediately see results in their Tickets and History tabs with prize split calculated automatically.</p>
        `)}

        ${section('↩ Reopening a Draw', `
          <p>Made a mistake? Tap <strong>Reopen Draw</strong> to clear the results and go back to open status. You can re-enter everything and settle again.</p>
        `)}
      </div>

      <!-- FAQ TAB -->
      <div id="help-tab-faq" class="help-tab-content hidden">
        ${faq('Do members need to create an account?', 'No. Members join with a name only — no email, no password, no app download required. Just a link.')}
        ${faq('What happens if I close the app and reopen it?', 'Your session is saved on your device. Just reopen LottoSquad in your browser and you\'ll still be in your squad.')}
        ${faq('Can I be in multiple squads?', 'Currently each device holds one member session at a time. If you\'re in multiple pools, you\'d use a different browser or device for each.')}
        ${faq('What lottery types are supported?', 'Western 6/49, Lotto 6/49, Lotto Max, Daily Grand, BC/49, and Western Max. More can be added on request.')}
        ${faq('How is the prize split calculated?', 'Total prize ÷ number of confirmed members. Everyone who paid in gets an equal share.')}
        ${faq('What if the AI scans the ticket wrong?', 'The admin can delete the ticket and re-scan, or add a ticket manually by entering the numbers directly.')}
        ${faq('Is the app free?', 'Yes, LottoSquad is free to use.')}
        ${faq('Who can see our tickets and results?', 'Only members of your squad. Each squad is private and isolated from others.')}
        ${faq('Can I leave a squad?', 'Yes — tap the ⚙ menu and choose Leave Squad. You can always rejoin with the invite link.')}
        ${faq('What\'s the difference between Lotto 6/49 and Western 6/49?', 'Lotto 6/49 is the national game run by OLG. Western 6/49 is run by Western Canada Lottery Corporation for AB/SK/MB players. Same format, different jackpots.')}
      </div>

      <button id="help-close-bottom" class="btn btn-ghost" style="margin-top:20px">Close</button>
    </div>
  `

  document.body.appendChild(modal)

  // Tab switching
  modal.querySelectorAll('.help-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.help-tab').forEach(b => {
        b.style.background = 'var(--bg-card2)'
        b.style.color = 'var(--text-muted)'
        b.classList.remove('active')
      })
      btn.style.background = 'var(--purple)'
      btn.style.color = '#fff'
      btn.classList.add('active')
      modal.querySelectorAll('.help-tab-content').forEach(c => c.classList.add('hidden'))
      modal.querySelector(`#help-tab-${btn.dataset.tab}`)?.classList.remove('hidden')
    })
  })

  // Close
  const close = () => modal.remove()
  modal.querySelector('#help-close').addEventListener('click', close)
  modal.querySelector('#help-close-bottom').addEventListener('click', close)
  modal.addEventListener('click', e => { if (e.target === modal) close() })
}

// ── Helpers ────────────────────────────────────────────────────────────────

function section(title, body) {
  return `
    <div style="margin-bottom:20px">
      <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:8px">${title}</div>
      <div style="font-size:0.83rem;color:var(--text-muted);line-height:1.6;display:flex;flex-direction:column;gap:6px">
        ${body}
      </div>
    </div>
  `
}

function faq(q, a) {
  return `
    <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border)">
      <div style="font-size:0.85rem;font-weight:700;color:var(--text);margin-bottom:4px">${q}</div>
      <div style="font-size:0.82rem;color:var(--text-muted);line-height:1.55">${a}</div>
    </div>
  `
}

function badge(status, label, desc) {
  return `
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span class="draw-status-badge badge-${status}" style="flex-shrink:0;margin-top:1px">${label}</span>
      <span style="font-size:0.82rem;color:var(--text-muted);line-height:1.5">${desc}</span>
    </div>
  `
}
