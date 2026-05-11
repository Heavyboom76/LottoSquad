import { supabase } from '../supabase.js'
import { ctx } from './app.js'
import { showToast, escHtml } from '../main.js'
import { getLottery } from '../lotteries.js'

export async function renderDashboard(container) {
  container.innerHTML = `<div class="loading-spinner">Loading pool...</div>`

  try {
    const { group, member, isAdmin } = ctx

    const [drawRes, membersRes] = await Promise.all([
      supabase.from('draws').select('*').eq('group_id', group.id)
        .in('status', ['open', 'closed']).order('draw_date', { ascending: false }).limit(1),
      supabase.from('members').select('*').eq('group_id', group.id).order('name'),
    ])

    const draw = drawRes.data?.[0] || null
    const members = membersRes.data || []

    let buyIns = [], myBuyIn = null
    if (draw) {
      const { data } = await supabase.from('buy_ins').select('*').eq('draw_id', draw.id)
      buyIns = data || []
      myBuyIn = member ? buyIns.find(b => b.member_id === member.id) || null : null
    }

    const confirmed = buyIns.filter(b => b.status === 'confirmed')
    const pending   = buyIns.filter(b => b.status === 'pending')
    const poolTotal = confirmed.length * (draw?.buy_in_amount || 0)
    const lotto     = getLottery(draw?.lottery_type)

    container.innerHTML = `
      ${draw ? `
        <div class="card card-purple" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
            <div>
              <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--purple-light);margin-bottom:4px">Active Draw</div>
              <div style="font-family:'Bebas Neue',cursive;font-size:1.8rem;letter-spacing:0.04em;line-height:1">${formatDate(draw.draw_date)}</div>
            </div>
            <span class="draw-status-badge badge-${draw.status}">${draw.status}</span>
          </div>
          <div class="card-meta">${lotto.icon} ${escHtml(lotto.name)} · ${lotto.drawDays}</div>
          ${draw.jackpot_amount ? `<div style="margin-top:6px;font-weight:700;color:var(--gold);font-size:1rem">Jackpot: ${escHtml(draw.jackpot_amount)}</div>` : ''}
          <div style="margin-top:8px;font-family:'Bebas Neue',cursive;font-size:2.2rem;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">$${poolTotal.toFixed(2)} pool</div>
        </div>
      ` : `
        <div class="card" style="margin-bottom:12px;text-align:center;padding:28px">
          <div style="font-size:2.5rem;margin-bottom:8px">🎱</div>
          <div style="font-weight:700;margin-bottom:4px">No Active Draw</div>
          <div class="card-meta">${isAdmin ? 'Create a new draw in the Manage tab.' : 'Your admin will create the next draw soon.'}</div>
        </div>
      `}

      <div class="stat-row">
        <div class="stat-box">
          <div class="stat-value text-green">${confirmed.length}</div>
          <div class="stat-label">Confirmed</div>
        </div>
        <div class="stat-box">
          <div class="stat-value text-gold">${pending.length}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">$${Number(draw?.buy_in_amount || 0).toFixed(0)}</div>
          <div class="stat-label">Buy-In</div>
        </div>
      </div>

      ${draw && member ? renderPayBlock(myBuyIn, draw, group) : ''}

      <div class="section-header">
        <span class="section-title">The Squad (${members.length})</span>
        <span class="text-muted" style="font-size:0.8rem">${confirmed.length} in</span>
      </div>
      <div class="member-grid">
        ${members.map(m => {
          const bi = buyIns.find(b => b.member_id === m.id)
          const status = bi?.status || 'unpaid'
          const isMe = member && m.id === member.id
          return renderMemberTile(m, status, isMe)
        }).join('')}
      </div>
    `

    if (draw && member && (!myBuyIn || myBuyIn.status === 'unpaid')) {
      container.querySelector('#pay-btn')?.addEventListener('click', async () => {
        const btn = container.querySelector('#pay-btn')
        btn.disabled = true; btn.textContent = 'Saving...'
        try {
          const { error } = await supabase.from('buy_ins').upsert(
            { draw_id: draw.id, member_id: member.id, status: 'pending', paid_at: new Date().toISOString() },
            { onConflict: 'member_id,draw_id' }
          )
          if (error) throw error
          showToast('Marked as sent! Admin will confirm. ⏳', 'success')
          await renderDashboard(container)
        } catch (err) {
          showToast('Failed: ' + err.message, 'error')
          btn.disabled = false
          btn.textContent = `💸 I Sent My $${Number(draw.buy_in_amount).toFixed(2)}`
        }
      })
    }

  } catch (err) {
    console.error(err)
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load</div><p class="text-muted">${err.message}</p></div>`
  }
}

function renderPayBlock(myBuyIn, draw, group) {
  const status = myBuyIn?.status || 'unpaid'
  if (status === 'confirmed') {
    return `
      <div class="pay-block">
        <button class="pay-btn-large paid" disabled>✓ Confirmed — You're In!</button>
      </div>`
  }
  if (status === 'pending') {
    return `
      <div class="pay-block">
        <button class="pay-btn-large" disabled style="background:var(--gold-glow);color:var(--gold);border:1.5px solid var(--gold-dark);cursor:default;font-size:1rem">
          ⏳ Payment Pending — Waiting for Admin
        </button>
        <div style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:6px">
          Send $${Number(draw.buy_in_amount).toFixed(2)} to <strong style="color:var(--text)">${escHtml(group.etransfer_info || 'your admin')}</strong>
        </div>
      </div>`
  }
  return `
    <div class="pay-block">
      ${group.etransfer_info ? `
        <div class="etransfer-box" style="margin-bottom:10px">
          <div class="etransfer-label">Send E-Transfer to</div>
          <div class="etransfer-value">${escHtml(group.etransfer_info)}</div>
        </div>
      ` : ''}
      <button class="pay-btn-large unpaid" id="pay-btn">💸 I Sent My $${Number(draw.buy_in_amount).toFixed(2)}</button>
      <div style="text-align:center;font-size:0.78rem;color:var(--text-muted);margin-top:6px">
        Send your e-transfer first, then tap this button.
      </div>
    </div>`
}

function renderMemberTile(m, status, isMe) {
  const cls  = status === 'confirmed' ? 'paid' : status === 'pending' ? 'pending-tile' : ''
  const dot  = status === 'confirmed' ? 'var(--green)' : status === 'pending' ? 'var(--gold)' : 'var(--red)'
  return `
    <div class="member-tile ${cls} ${isMe ? 'me' : ''}">
      <div class="status-dot" style="background:${dot}"></div>
      <div class="member-tile-name">${escHtml(m.name)}${isMe ? ' (you)' : ''}</div>
      ${status === 'pending' ? `<div style="font-size:0.58rem;color:var(--gold);font-weight:700">PENDING</div>` : ''}
    </div>`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}
