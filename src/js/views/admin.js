import { supabase } from '../supabase.js'
import { ctx } from './app.js'
import { fetchGroupMembers, createMember, deleteMember, updateGroup } from '../auth.js'
import { parseTicketImage } from '../ticketParser.js'
import { getLottery, LOTTERIES, calcTicketMatches } from '../lotteries.js'
import { showToast, escHtml } from '../main.js'

export async function renderAdmin(container) {
  container.innerHTML = `<div class="loading-spinner">Loading...</div>`

  try {
    const { group, isAdmin } = ctx
    if (!isAdmin) { container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔒</div><div class="empty-state-title">Admin Only</div></div>`; return }

    const [members, drawsRes] = await Promise.all([
      fetchGroupMembers(group.id),
      supabase.from('draws').select('*').eq('group_id', group.id).order('draw_date', { ascending: false }),
    ])

    const draws = drawsRes.data || []
    const currentDraw = draws.find(d => d.status === 'open' || d.status === 'closed') || draws[0] || null
    const lotto = getLottery(currentDraw?.lottery_type)

    let buyIns = [], tickets = []
    if (currentDraw) {
      const [biRes, tkRes] = await Promise.all([
        supabase.from('buy_ins').select('*, members(name)').eq('draw_id', currentDraw.id),
        supabase.from('tickets').select('*').eq('draw_id', currentDraw.id).order('created_at'),
      ])
      buyIns  = biRes.data || []
      tickets = tkRes.data || []
    }

    const pending   = buyIns.filter(b => b.status === 'pending')
    const confirmed = buyIns.filter(b => b.status === 'confirmed')
    const isSettled = currentDraw?.status === 'settled'
    const isActive  = currentDraw?.status === 'open' || currentDraw?.status === 'closed'

    container.innerHTML = `
      <!-- PENDING PAYMENTS -->
      ${pending.length ? `
      <div class="admin-section">
        <div class="admin-section-title" style="color:var(--gold)">⏳ Pending Payments (${pending.length})</div>
        ${pending.map(b => `
          <div style="display:flex;align-items:center;justify-content:space-between;background:var(--gold-glow);border:1px solid var(--gold-dark);border-radius:var(--radius-sm);padding:12px;margin-bottom:6px">
            <div>
              <div style="font-weight:600">${escHtml(b.members?.name || '?')}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">Says they sent $${Number(currentDraw.buy_in_amount).toFixed(2)}</div>
            </div>
            <button class="btn btn-green btn-sm confirm-btn" data-id="${b.id}">✓ Received</button>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- CONFIRMED -->
      ${currentDraw ? `
      <div class="admin-section">
        <div class="admin-section-title">✅ Confirmed In (${confirmed.length})</div>
        ${confirmed.length === 0
          ? '<p class="text-muted" style="font-size:0.85rem">Nobody confirmed yet.</p>'
          : `<div style="display:flex;flex-wrap:wrap;gap:6px">
              ${confirmed.map(b => `
                <div style="background:var(--green-dim);border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:6px 10px;font-size:0.85rem;display:flex;align-items:center;gap:6px">
                  <span style="color:var(--green)">✓</span> ${escHtml(b.members?.name || '?')}
                  <button class="unconfirm-btn" data-id="${b.id}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.75rem;padding:0">✕</button>
                </div>
              `).join('')}
            </div>`}
      </div>
      ` : ''}

      <!-- MEMBERS -->
      <div class="admin-section">
        <div class="admin-section-title">👥 Squad Members (${members.length})</div>
        <div class="admin-member-list">
          ${members.map(m => `
            <div class="admin-member-row">
              <span>${escHtml(m.name)}</span>
              ${m.email ? `<span class="text-muted" style="font-size:0.78rem">${escHtml(m.email)}</span>` : ''}
              <button class="btn btn-ghost btn-sm remove-member-btn" data-id="${m.id}" style="color:var(--red)">Remove</button>
            </div>
          `).join('')}
        </div>
        <div class="admin-row" style="gap:8px">
          <input id="admin-new-name" type="text" class="text-input" placeholder="Name" style="flex:1" maxlength="30" />
          <input id="admin-new-email" type="email" class="text-input" placeholder="Email (opt)" style="flex:1" />
          <button id="admin-add-member-btn" class="btn btn-grad btn-sm" style="white-space:nowrap">Add</button>
        </div>
      </div>

      <!-- CURRENT DRAW -->
      <div class="admin-section">
        <div class="admin-section-title">🎱 Current Draw</div>
        ${currentDraw ? `
          <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:600">${formatDate(currentDraw.draw_date)}</div>
                <div class="card-meta">${lotto.icon} ${escHtml(lotto.name)} · $${Number(currentDraw.buy_in_amount).toFixed(2)}/person</div>
              </div>
              <span class="draw-status-badge badge-${currentDraw.status}">${currentDraw.status}</span>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${currentDraw.status === 'open' ? `<button class="btn btn-ghost btn-sm" id="close-draw-btn">🔒 Lock Buy-ins</button>` : ''}
            ${isActive ? `<button class="btn btn-gold btn-sm" id="settle-draw-btn">🏆 Settle Draw</button>` : ''}
            ${currentDraw.status === 'closed' || isSettled ? `<button class="btn btn-ghost btn-sm" id="reopen-draw-btn">↩ Reopen Draw</button>` : ''}
          </div>
        ` : '<p class="text-muted" style="font-size:0.9rem;margin-bottom:4px">No active draw.</p>'}
      </div>

      <!-- NEW DRAW -->
      ${!currentDraw || isSettled ? `
      <div class="admin-section">
        <div class="admin-section-title">➕ New Draw</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <select id="new-draw-lottery" class="text-input">
            ${Object.values(LOTTERIES).map(l => `<option value="${l.id}">${l.icon} ${l.name} — ${l.region} · ${l.drawDays}</option>`).join('')}
          </select>
          <input id="new-draw-date" type="date" class="text-input" />
          <input id="new-draw-buyin" type="number" step="0.50" min="0.50" class="text-input" placeholder="Buy-in per person (e.g. 5.00)" />
          <input id="new-draw-jackpot" type="text" class="text-input" placeholder="Jackpot amount (optional, e.g. $15 Million)" />
          <button id="create-draw-btn" class="btn btn-grad">Create Draw</button>
        </div>
      </div>
      ` : ''}

      <!-- TICKETS -->
      ${currentDraw ? `
      <div class="admin-section">
        <div class="admin-section-title">🎟 Tickets (${tickets.length})</div>

        <div id="admin-ticket-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:${tickets.length ? '12px' : '0'}">
          ${tickets.length
            ? tickets.map((t, i) => renderTicketRow(t, i, lotto)).join('')
            : '<p class="text-muted" style="font-size:0.85rem;margin-bottom:8px">No tickets yet.</p>'}
        </div>

        <div style="border-top:1px solid var(--border);padding-top:12px">
          <p class="text-muted" style="font-size:0.82rem;margin-bottom:8px">📸 Scan with AI — reads all lines${lotto.hasExtra ? ' + ' + lotto.extraLabel : ''} automatically.</p>
          <button id="ticket-photo-btn" class="btn" style="border:2px dashed var(--purple);background:var(--purple-dim);color:var(--purple-light);font-size:1rem;padding:14px">
            📸 Scan Ticket Photo (AI)
          </button>
          <input type="file" id="ticket-image-input" accept="image/*" style="display:none" />
          <div id="ticket-parse-status" style="display:none;font-size:0.85rem;color:var(--text-muted);padding:6px 0"></div>
          <div id="ticket-parse-preview"></div>

          <details style="margin-top:10px">
            <summary style="font-size:0.8rem;color:var(--text-muted);cursor:pointer;padding:4px 0">Manual entry (fallback)</summary>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
              <div class="number-inputs" id="ticket-number-inputs">
                ${Array.from({length: lotto.numbersPerLine}, (_, i) =>
                  `<input type="number" min="1" max="${lotto.numberMax}" class="number-input ticket-num" placeholder="${i+1}" />`
                ).join('')}
              </div>
              ${lotto.hasExtra  ? `<input id="ticket-manual-extra"  type="text" class="text-input" placeholder="⭐ ${escHtml(lotto.extraLabel)}: ${escHtml(lotto.extraHint || '')}"  maxlength="30" />` : ''}
              ${lotto.hasExtra2 ? `<input id="ticket-manual-extra2" type="text" class="text-input" placeholder="⭐ ${escHtml(lotto.extra2Label)}: ${escHtml(lotto.extra2Hint || '')}" maxlength="30" />` : ''}
              <input id="ticket-serial" type="text" class="text-input" placeholder="Serial number (optional)" maxlength="30" />
              <button id="add-ticket-btn" class="btn btn-outline btn-sm">Add Line</button>
            </div>
          </details>
        </div>
      </div>
      ` : ''}

      <!-- SETTLE PANEL -->
      <div id="settle-panel" class="admin-section hidden">
        <div class="admin-section-title">🏆 Enter Results</div>
        <p class="text-muted" style="font-size:0.85rem;margin-bottom:10px">Enter the ${lotto.numbersPerLine} winning numbers for ${lotto.icon} ${escHtml(lotto.name)}.</p>
        <div class="number-inputs" style="margin-bottom:8px">
          ${Array.from({length: lotto.numbersPerLine}, (_, i) =>
            `<input type="number" min="1" max="${lotto.numberMax}" class="number-input winning-num" placeholder="${i+1}" />`
          ).join('')}
        </div>
        <input id="bonus-number-input" type="number" min="1" max="${lotto.bonusMax}" class="text-input" style="margin-bottom:8px" placeholder="${escHtml(lotto.bonusLabel)} number (1–${lotto.bonusMax})" />
        ${lotto.hasExtra  ? `<input id="winning-extra-input"  type="text" class="text-input" style="margin-bottom:8px" placeholder="Winning ${escHtml(lotto.extraLabel)}  — ${escHtml(lotto.extraHint)}" />` : ''}
        ${lotto.hasExtra2 ? `<input id="winning-extra2-input" type="text" class="text-input" style="margin-bottom:8px" placeholder="Winning ${escHtml(lotto.extra2Label)} — ${escHtml(lotto.extra2Hint)}" />` : ''}
        <div id="match-preview" style="margin-bottom:8px"></div>
        <input id="prize-amount-input" type="number" step="0.01" min="0" class="text-input" style="margin-bottom:8px" placeholder="Total prize won ($0.00 if none / free play)" />
        <input id="prize-notes-input" type="text" class="text-input" style="margin-bottom:8px" placeholder="Prize notes (optional, e.g. 2× Free Play)" />
        <button id="confirm-settle-btn" class="btn btn-gold">💾 Save Results & Settle</button>
        <button id="cancel-settle-btn" class="btn btn-ghost" style="margin-top:6px">Cancel</button>
      </div>

      <!-- SQUAD SETTINGS -->
      <div class="admin-section">
        <div class="admin-section-title">⚙️ Squad Settings</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div>
            <div class="label">Squad Name</div>
            <input id="settings-name" type="text" class="text-input" value="${escHtml(group.name)}" maxlength="40" />
          </div>
          <div>
            <div class="label">E-Transfer Info</div>
            <input id="settings-etransfer" type="text" class="text-input" value="${escHtml(group.etransfer_info || '')}" maxlength="80" />
          </div>
          <div>
            <div class="label">Pool Rules</div>
            <textarea id="settings-rules" class="text-input" rows="4" style="resize:vertical" maxlength="1000">${escHtml(group.rules || '')}</textarea>
          </div>
          <button id="save-settings-btn" class="btn btn-outline btn-sm" style="width:auto">Save Settings</button>
        </div>
      </div>

      <!-- INVITE LINK -->
      <div class="admin-section">
        <div class="admin-section-title">🔗 Invite Link</div>
        <div class="invite-box">
          <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px">Share this link with your squad</div>
          <div class="invite-url" id="invite-url-text">${location.origin}/join/${group.slug}</div>
        </div>
        <button id="copy-invite-btn" class="btn btn-outline btn-sm" style="margin-top:8px;width:auto">📋 Copy Link</button>
      </div>

      <div style="height:16px"></div>
    `

    bindAdminEvents(container, currentDraw, members, lotto, tickets, group)

  } catch (err) {
    console.error(err)
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load</div><p class="text-muted">${err.message}</p></div>`
  }
}

// ── Ticket row ─────────────────────────────────────────────────────────────
function renderTicketRow(ticket, index, lotto) {
  const numbers   = Array.isArray(ticket.numbers) ? [...ticket.numbers].sort((a,b)=>a-b) : []
  const extraVal  = ticket.ticket_extra  || (ticket.extra_number ? String(ticket.extra_number) : null)
  const extra2Val = ticket.ticket_extra2 || null
  return `
    <div id="ticket-row-${ticket.id}" style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:0.72rem;color:var(--text-muted)">Line ${index + 1}${ticket.serial_number ? ' · S/N: ' + escHtml(ticket.serial_number) : ''}</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm edit-ticket-btn" data-id="${ticket.id}" style="padding:2px 8px;font-size:0.72rem">✏️</button>
          <button class="btn btn-ghost btn-sm delete-ticket-btn" data-id="${ticket.id}" style="padding:2px 8px;font-size:0.72rem;color:var(--red)">🗑</button>
        </div>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        ${numbers.map(n => `<div style="width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffe066,#c87f00);color:#3A1F00;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:0.78rem;font-weight:700">${n}</div>`).join('')}
      </div>
      ${extraVal  ? `<div style="margin-top:5px;font-size:0.72rem;color:var(--gold);font-family:'JetBrains Mono',monospace">⭐ ${escHtml(lotto?.extraLabel  || 'EXTRA')}: ${escHtml(extraVal)}</div>`  : ''}
      ${extra2Val ? `<div style="margin-top:2px;font-size:0.72rem;color:var(--gold);font-family:'JetBrains Mono',monospace">⭐ ${escHtml(lotto?.extra2Label || 'EXTRA')}: ${escHtml(extra2Val)}</div>` : ''}
    </div>
  `
}

function renderEditForm(ticket, lotto) {
  const numbers   = Array.isArray(ticket.numbers) ? ticket.numbers : []
  const extraVal  = ticket.ticket_extra  || (ticket.extra_number ? String(ticket.extra_number) : '')
  const extra2Val = ticket.ticket_extra2 || ''
  return `
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="font-size:0.72rem;color:var(--text-muted)">Edit Line — ${escHtml(lotto?.name || '')}</div>
      <div class="number-inputs">
        ${numbers.map((n, i) => `<input type="number" min="1" max="${lotto.numberMax}" class="number-input edit-num" value="${n}" placeholder="${i+1}" />`).join('')}
      </div>
      ${lotto.hasExtra  ? `<input type="text" class="text-input edit-extra"  value="${escHtml(extraVal)}"  placeholder="⭐ ${escHtml(lotto.extraLabel)}: ${escHtml(lotto.extraHint  || '')}" maxlength="30" />` : ''}
      ${lotto.hasExtra2 ? `<input type="text" class="text-input edit-extra2" value="${escHtml(extra2Val)}" placeholder="⭐ ${escHtml(lotto.extra2Label)}: ${escHtml(lotto.extra2Hint || '')}" maxlength="30" />` : ''}
      <input type="text" class="text-input edit-serial" value="${escHtml(ticket.serial_number || '')}" placeholder="Serial number (optional)" maxlength="30" />
      <div style="display:flex;gap:8px">
        <button class="btn btn-gold btn-sm save-edit-btn" data-id="${ticket.id}" style="flex:1">💾 Save</button>
        <button class="btn btn-ghost btn-sm cancel-edit-btn">Cancel</button>
      </div>
    </div>
  `
}

// ── Match preview ──────────────────────────────────────────────────────────
function renderMatchPreview(tickets, winningNums, bonusNum, lotto) {
  if (!tickets.length) return ''
  const valid = winningNums.filter(n => !isNaN(n) && n >= 1 && n <= lotto.numberMax)
  if (valid.length !== lotto.numbersPerLine) {
    return `<p style="font-size:0.78rem;color:var(--text-muted);padding:4px 0">Enter all ${lotto.numbersPerLine} winning numbers to preview match results…</p>`
  }
  const winSet = new Set(valid)
  const rows = tickets.map((t, i) => {
    const numbers = Array.isArray(t.numbers) ? [...t.numbers].sort((a, b) => a - b) : []
    const { tier } = calcTicketMatches(t.numbers, valid, bonusNum, lotto)
    const isWinner   = tier && !tier.freePlay
    const isFreePlay = tier?.freePlay
    const border = isWinner ? 'var(--gold-dark)' : isFreePlay ? 'rgba(16,185,129,0.3)' : 'var(--border)'
    const tierColor = isWinner ? 'var(--gold)' : 'var(--green)'
    const balls = numbers.map(n => {
      const hit = winSet.has(n)
      return `<div style="width:26px;height:26px;border-radius:50%;background:${hit ? 'radial-gradient(circle at 35% 35%,#ffe066,#c87f00)' : 'var(--bg-input)'};color:${hit ? '#3A1F00' : 'var(--text-muted)'};display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:0.7rem;font-weight:700${!hit ? ';opacity:0.45' : ''}">${n}</div>`
    }).join('')
    return `<div style="background:var(--bg-card2);border:1px solid ${border};border-radius:var(--radius-sm);padding:7px 10px;margin-bottom:4px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:0.68rem;color:var(--text-muted)">Line ${i + 1}</span>
        <span style="font-size:0.72rem;font-weight:700;color:${tier ? tierColor : 'var(--text-muted)'}">${tier ? escHtml(tier.label) : 'No prize'}</span>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${balls}</div>
    </div>`
  }).join('')
  return `<div><div style="font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--purple-light);margin-bottom:5px">Match Preview</div>${rows}</div>`
}

// ── Events ─────────────────────────────────────────────────────────────────
function bindAdminEvents(container, currentDraw, members, lotto, tickets, group) {
  const reload = () => renderAdmin(container)

  // Confirm payment
  container.querySelectorAll('.confirm-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = '...'
      const { error } = await supabase.from('buy_ins').update({ status: 'confirmed', paid_at: new Date().toISOString() }).eq('id', btn.dataset.id)
      if (error) { showToast(error.message, 'error'); return }
      showToast('Confirmed ✅', 'success'); await reload()
    })
  })

  // Unconfirm payment
  container.querySelectorAll('.unconfirm-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation()
      const { error } = await supabase.from('buy_ins').update({ status: 'pending' }).eq('id', btn.dataset.id)
      if (error) { showToast(error.message, 'error'); return }
      showToast('Moved back to pending', 'success'); await reload()
    })
  })

  // Add member
  container.querySelector('#admin-add-member-btn')?.addEventListener('click', async () => {
    const name  = container.querySelector('#admin-new-name').value.trim()
    const email = container.querySelector('#admin-new-email').value.trim()
    if (!name) { showToast('Enter a name first', 'error'); return }
    try { await createMember(group.id, name, email || null); showToast(`${name} added!`, 'success'); await reload() }
    catch (err) { showToast(err.message, 'error') }
  })

  // Remove member
  container.querySelectorAll('.remove-member-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation()
      const m = members.find(m => m.id === btn.dataset.id)
      if (!confirm(`Remove ${m?.name}?`)) return
      try { await deleteMember(btn.dataset.id); showToast(`${m?.name} removed`, 'success'); await reload() }
      catch (err) { showToast(err.message, 'error') }
    })
  })

  // Create draw
  container.querySelector('#create-draw-btn')?.addEventListener('click', async () => {
    const lotteryType = container.querySelector('#new-draw-lottery').value
    const date   = container.querySelector('#new-draw-date').value
    const buyin  = parseFloat(container.querySelector('#new-draw-buyin').value)
    const jackpot = container.querySelector('#new-draw-jackpot').value.trim()
    if (!date) { showToast('Pick a draw date', 'error'); return }
    if (!buyin || buyin < 0.5) { showToast('Enter a valid buy-in amount', 'error'); return }
    try {
      const { error } = await supabase.from('draws').insert({ group_id: group.id, draw_date: date, buy_in_amount: buyin, jackpot_amount: jackpot || null, status: 'open', lottery_type: lotteryType })
      if (error) throw error
      showToast('Draw created! 🎉', 'success'); await reload()
    } catch (err) { showToast(err.message, 'error') }
  })

  // Close draw
  container.querySelector('#close-draw-btn')?.addEventListener('click', async () => {
    if (!confirm('Lock buy-ins?')) return
    const { error } = await supabase.from('draws').update({ status: 'closed' }).eq('id', currentDraw.id)
    if (error) { showToast(error.message, 'error'); return }
    showToast('Buy-ins locked', 'success'); await reload()
  })

  // Reopen draw
  container.querySelector('#reopen-draw-btn')?.addEventListener('click', async () => {
    const msg = currentDraw.status === 'settled'
      ? 'Reopen this settled draw? This will clear the winning numbers.'
      : 'Reopen buy-ins?'
    if (!confirm(msg)) return
    const update = currentDraw.status === 'settled'
      ? { status: 'open', winning_numbers: null, bonus_number: null, prize_notes: null, prize_amount: null, winning_extra: null, winning_extra2: null }
      : { status: 'open' }
    const { error } = await supabase.from('draws').update(update).eq('id', currentDraw.id)
    if (error) { showToast(error.message, 'error'); return }
    showToast('Draw reopened ↩', 'success'); await reload()
  })

  // Settle panel
  container.querySelector('#settle-draw-btn')?.addEventListener('click', () => {
    container.querySelector('#settle-panel')?.classList.remove('hidden')
  })
  container.querySelector('#cancel-settle-btn')?.addEventListener('click', () => {
    container.querySelector('#settle-panel')?.classList.add('hidden')
  })

  // Live match preview — updates as winning numbers / bonus are typed
  const updatePreview = () => {
    const nums  = [...container.querySelectorAll('.winning-num')].map(i => parseInt(i.value))
    const bonus = parseInt(container.querySelector('#bonus-number-input')?.value) || null
    const previewEl = container.querySelector('#match-preview')
    if (previewEl) previewEl.innerHTML = renderMatchPreview(tickets, nums, bonus, lotto)
  }
  container.querySelectorAll('.winning-num').forEach(inp => inp.addEventListener('input', updatePreview))
  container.querySelector('#bonus-number-input')?.addEventListener('input', updatePreview)

  // Confirm settle
  container.querySelector('#confirm-settle-btn')?.addEventListener('click', async () => {
    const nums  = [...container.querySelectorAll('.winning-num')].map(i => parseInt(i.value))
    if (nums.length !== lotto.numbersPerLine || nums.some(n => isNaN(n) || n < 1 || n > lotto.numberMax)) {
      showToast(`Enter ${lotto.numbersPerLine} valid numbers (1–${lotto.numberMax})`, 'error'); return
    }
    const bonus        = parseInt(container.querySelector('#bonus-number-input').value) || null
    const notes        = container.querySelector('#prize-notes-input').value.trim() || null
    const prizeRaw     = parseFloat(container.querySelector('#prize-amount-input').value)
    const prizeAmount  = !isNaN(prizeRaw) && prizeRaw >= 0 ? prizeRaw : 0
    const winExtra     = container.querySelector('#winning-extra-input')?.value.trim()  || null
    const winExtra2    = container.querySelector('#winning-extra2-input')?.value.trim() || null
    try {
      const { error } = await supabase.from('draws').update({ status: 'settled', winning_numbers: nums, bonus_number: bonus, prize_notes: notes, prize_amount: prizeAmount, winning_extra: winExtra, winning_extra2: winExtra2 }).eq('id', currentDraw.id)
      if (error) throw error
      showToast('Draw settled! 🏆', 'success'); await reload()
    } catch (err) { showToast(err.message, 'error') }
  })

  // Delete ticket
  container.querySelectorAll('.delete-ticket-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const t = tickets.find(t => t.id === btn.dataset.id)
      if (!confirm(`Delete ticket [${t?.numbers?.join(', ')}]?`)) return
      const { error } = await supabase.from('tickets').delete().eq('id', btn.dataset.id)
      if (error) { showToast(error.message, 'error'); return }
      showToast('Ticket deleted', 'success'); await reload()
    })
  })

  // Edit ticket
  container.querySelectorAll('.edit-ticket-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ticket = tickets.find(t => t.id === btn.dataset.id)
      if (!ticket) return
      const row = container.querySelector(`#ticket-row-${ticket.id}`)
      if (!row) return
      row.innerHTML = renderEditForm(ticket, lotto)
      bindEditRow(row, ticket, lotto, tickets, container, reload)
    })
  })

  // Photo scan
  container.querySelector('#ticket-photo-btn')?.addEventListener('click', () => {
    container.querySelector('#ticket-image-input')?.click()
  })

  container.querySelector('#ticket-image-input')?.addEventListener('change', async e => {
    const file = e.target.files?.[0]
    if (!file) return
    const status   = container.querySelector('#ticket-parse-status')
    const preview  = container.querySelector('#ticket-parse-preview')
    const photoBtn = container.querySelector('#ticket-photo-btn')
    status.style.display = 'block'
    status.textContent = `🔍 Scanning ${lotto.name} ticket...`
    preview.innerHTML = ''
    photoBtn.disabled = true

    try {
      const { sets, extra, extra2 } = await parseTicketImage(file, currentDraw.lottery_type)

      if (!sets.length) {
        status.textContent = '⚠️ No numbers found. Try a clearer photo.'
        photoBtn.disabled = false; return
      }

      const extraLabels = [lotto.hasExtra && extra ? lotto.extraLabel : null, lotto.hasExtra2 && extra2 ? lotto.extra2Label : null].filter(Boolean)
      status.textContent = `✅ Found ${sets.length} line${sets.length > 1 ? 's' : ''}${extraLabels.length ? ' + ' + extraLabels.join(' + ') : ''}. Confirm:`

      preview.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
          ${sets.map((nums, i) => `
            <div class="parsed-ticket-row" data-nums='${JSON.stringify(nums)}' style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <span style="font-size:0.72rem;color:var(--text-muted)">Line ${i+1}</span>
                <button class="remove-parsed-btn btn btn-ghost btn-sm" style="color:var(--red);padding:2px 6px">✕</button>
              </div>
              <div style="display:flex;gap:5px;flex-wrap:wrap">
                ${[...nums].sort((a,b)=>a-b).map(n => `<div style="width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffe066,#c87f00);color:#3A1F00;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:0.78rem;font-weight:700">${n}</div>`).join('')}
              </div>
            </div>
          `).join('')}
          ${lotto.hasExtra ? (extra ? `
            <div style="background:var(--bg-input);border:1px solid var(--gold-dark);border-radius:var(--radius-sm);padding:10px 12px">
              <div style="font-size:0.72rem;color:var(--gold);font-weight:700;margin-bottom:4px">⭐ ${lotto.extraLabel}</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:1.05rem;color:var(--gold)">${escHtml(String(extra))}</div>
            </div>` : `
            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px">
              <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px">⭐ ${lotto.extraLabel} (not detected)</div>
              <input id="manual-extra" type="text" class="text-input" placeholder="${escHtml(lotto.extraHint || lotto.extraLabel)}" maxlength="30" style="margin-top:4px" />
            </div>`) : ''}
          ${lotto.hasExtra2 ? (extra2 ? `
            <div style="background:var(--bg-input);border:1px solid var(--gold-dark);border-radius:var(--radius-sm);padding:10px 12px">
              <div style="font-size:0.72rem;color:var(--gold);font-weight:700;margin-bottom:4px">⭐ ${lotto.extra2Label}</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:1.05rem;color:var(--gold)">${escHtml(String(extra2))}</div>
            </div>` : `
            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px">
              <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px">⭐ ${lotto.extra2Label} (not detected)</div>
              <input id="manual-extra2" type="text" class="text-input" placeholder="${escHtml(lotto.extra2Hint || lotto.extra2Label)}" maxlength="30" style="margin-top:4px" />
            </div>`) : ''}
        </div>
        <input type="text" id="parsed-serial" class="text-input" style="margin-top:8px" placeholder="Serial number (optional)" maxlength="30" />
        <button id="save-parsed-btn" class="btn btn-grad" style="margin-top:8px"
          data-extra="${lotto.hasExtra ? escHtml(String(extra || '')) : ''}"
          data-extra2="${lotto.hasExtra2 ? escHtml(String(extra2 || '')) : ''}">
          💾 Save ${sets.length} line${sets.length > 1 ? 's' : ''}
        </button>
      `

      preview.querySelectorAll('.remove-parsed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.closest('.parsed-ticket-row').remove()
          if (!preview.querySelectorAll('.parsed-ticket-row').length) {
            preview.innerHTML = ''; status.textContent = 'All lines removed.'
          }
        })
      })

      preview.querySelector('#save-parsed-btn')?.addEventListener('click', async () => {
        const rows    = [...preview.querySelectorAll('.parsed-ticket-row')]
        const saveBtn = preview.querySelector('#save-parsed-btn')
        const serial  = preview.querySelector('#parsed-serial')?.value.trim() || null
        const extraVal  = lotto.hasExtra  ? (saveBtn.dataset.extra  || preview.querySelector('#manual-extra')?.value.trim()  || null) : null
        const extra2Val = lotto.hasExtra2 ? (saveBtn.dataset.extra2 || preview.querySelector('#manual-extra2')?.value.trim() || null) : null
        saveBtn.disabled = true; saveBtn.textContent = 'Saving...'
        try {
          const inserts = rows.map(row => ({
            draw_id: currentDraw.id,
            numbers: JSON.parse(row.dataset.nums),
            serial_number: serial,
            ticket_extra:  extraVal  || null,
            ticket_extra2: extra2Val || null,
          }))
          const { error } = await supabase.from('tickets').insert(inserts)
          if (error) throw error
          showToast(`${inserts.length} line${inserts.length > 1 ? 's' : ''} saved! 🎱`, 'success')
          await reload()
        } catch (err) {
          showToast('Save failed: ' + err.message, 'error')
          saveBtn.disabled = false; saveBtn.textContent = `💾 Save ${rows.length} lines`
        }
      })

    } catch (err) {
      status.textContent = '❌ ' + err.message
      showToast(err.message, 'error')
    }
    photoBtn.disabled = false
  })

  // Manual add ticket
  container.querySelector('#add-ticket-btn')?.addEventListener('click', async () => {
    const nums = [...container.querySelectorAll('.ticket-num')].map(i => parseInt(i.value))
    if (nums.some(n => isNaN(n) || n < 1 || n > lotto.numberMax) || new Set(nums).size !== lotto.numbersPerLine) {
      showToast(`Enter ${lotto.numbersPerLine} unique numbers (1–${lotto.numberMax})`, 'error'); return
    }
    const extraVal  = container.querySelector('#ticket-manual-extra')?.value.trim()  || null
    const extra2Val = container.querySelector('#ticket-manual-extra2')?.value.trim() || null
    const serial    = container.querySelector('#ticket-serial')?.value.trim() || null
    try {
      const { error } = await supabase.from('tickets').insert({ draw_id: currentDraw.id, numbers: nums, serial_number: serial, ticket_extra: extraVal || null, ticket_extra2: extra2Val || null })
      if (error) throw error
      showToast('Line added! 🎱', 'success'); await reload()
    } catch (err) { showToast(err.message, 'error') }
  })

  // Save settings
  container.querySelector('#save-settings-btn')?.addEventListener('click', async () => {
    const name      = container.querySelector('#settings-name').value.trim()
    const etransfer = container.querySelector('#settings-etransfer').value.trim()
    const rules     = container.querySelector('#settings-rules').value.trim()
    if (!name) { showToast('Squad name required', 'error'); return }
    try {
      await updateGroup(group.id, { name, etransfer_info: etransfer || null, rules: rules || null })
      showToast('Settings saved ✅', 'success'); await reload()
    } catch (err) { showToast(err.message, 'error') }
  })

  // Copy invite link
  container.querySelector('#copy-invite-btn')?.addEventListener('click', () => {
    const url = `${location.origin}/join/${group.slug}`
    navigator.clipboard.writeText(url)
      .then(() => showToast('Invite link copied! 🔗', 'success'))
      .catch(() => showToast(url, ''))
  })
}

function bindEditRow(row, ticket, lotto, tickets, container, reload) {
  row.querySelector('.save-edit-btn')?.addEventListener('click', async () => {
    const nums = [...row.querySelectorAll('.edit-num')].map(i => parseInt(i.value))
    if (nums.length !== lotto.numbersPerLine || nums.some(n => isNaN(n) || n < 1 || n > lotto.numberMax)) {
      showToast(`Enter ${lotto.numbersPerLine} valid numbers (1–${lotto.numberMax})`, 'error'); return
    }
    if (new Set(nums).size !== lotto.numbersPerLine) { showToast('All numbers must be different', 'error'); return }
    const extraVal  = row.querySelector('.edit-extra')?.value.trim()  || null
    const extra2Val = row.querySelector('.edit-extra2')?.value.trim() || null
    const serial    = row.querySelector('.edit-serial')?.value.trim() || null
    const btn = row.querySelector('.save-edit-btn')
    btn.disabled = true; btn.textContent = 'Saving...'
    try {
      const { error } = await supabase.from('tickets').update({
        numbers: nums,
        ticket_extra:  lotto.hasExtra  ? extraVal  : null,
        ticket_extra2: lotto.hasExtra2 ? extra2Val : null,
        serial_number: serial,
      }).eq('id', ticket.id)
      if (error) throw error
      showToast('Ticket updated ✅', 'success'); await reload()
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error')
      btn.disabled = false; btn.textContent = '💾 Save'
    }
  })

  row.querySelector('.cancel-edit-btn')?.addEventListener('click', () => reload())
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
