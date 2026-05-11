import { supabase } from '../supabase.js'
import { ctx } from './app.js'
import { getLottery } from '../lotteries.js'
import { escHtml } from '../main.js'

export async function renderHistory(container) {
  container.innerHTML = `<div class="loading-spinner">Loading history...</div>`

  try {
    const { group } = ctx

    const { data: draws } = await supabase.from('draws')
      .select('*, tickets(*), buy_ins(*, members(name))')
      .eq('group_id', group.id)
      .order('draw_date', { ascending: false })

    if (!draws?.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">No History Yet</div><p class="text-muted">Settled draws will appear here.</p></div>`
      return
    }

    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Draw History</span>
        <span class="text-muted" style="font-size:0.8rem">${draws.length} draws</span>
      </div>
      <div>${draws.map(d => renderDrawItem(d)).join('')}</div>
    `

    container.querySelectorAll('.draw-history-item').forEach(el => {
      el.addEventListener('click', () => el.classList.toggle('expanded'))
    })

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load</div><p class="text-muted">${err.message}</p></div>`
  }
}

function renderDrawItem(draw) {
  const lotto      = getLottery(draw.lottery_type)
  const paidBuyIns = (draw.buy_ins || []).filter(b => b.status === 'confirmed')
  const poolTotal  = paidBuyIns.length * Number(draw.buy_in_amount)
  const hasNums    = draw.winning_numbers?.length > 0
  const tickets    = draw.tickets || []

  return `
    <div class="draw-history-item">
      <div class="draw-history-header">
        <div>
          <div class="draw-history-date">${formatDate(draw.draw_date)}</div>
          <div class="card-meta" style="margin-top:2px">${lotto.icon} ${escHtml(lotto.name)} · $${Number(draw.buy_in_amount).toFixed(2)}/person · ${paidBuyIns.length} in · $${poolTotal.toFixed(0)} pool</div>
        </div>
        <span class="draw-status-badge badge-${draw.status}">${draw.status}</span>
      </div>

      ${hasNums ? `
        <div style="margin-top:12px">
          <div class="ticket-label">Winning Numbers</div>
          <div class="draw-history-numbers">
            ${[...draw.winning_numbers].sort((a,b)=>a-b).map(n => `
              <div class="mini-ball" style="background:radial-gradient(circle at 35% 35%,#ffe066,#c87f00);color:#3A1F00">${n}</div>
            `).join('')}
            ${draw.bonus_number ? `
              <div style="display:flex;align-items:center;gap:4px;margin-left:4px">
                <span class="text-muted" style="font-size:0.68rem">BONUS</span>
                <div class="mini-ball" style="background:radial-gradient(circle at 35% 35%,#9B5CF6,#5B21B6);color:#fff">${draw.bonus_number}</div>
              </div>` : ''}
          </div>
        </div>` : ''}

      <div class="draw-history-details">
        ${draw.prize_notes ? `
          <div style="background:var(--gold-glow);border:1px solid rgba(251,191,36,0.2);border-radius:8px;padding:10px 12px;font-size:0.88rem">
            🏆 ${escHtml(draw.prize_notes)}
          </div>` : ''}

        ${tickets.length ? `
          <div>
            <div class="ticket-label" style="margin-bottom:6px">Tickets (${tickets.length})</div>
            ${tickets.map(t => `
              <div style="margin-bottom:8px">
                <div class="draw-history-numbers">
                  ${[...t.numbers].sort((a,b)=>a-b).map(n => `<div class="mini-ball" style="background:var(--bg-input);color:var(--text);font-family:'JetBrains Mono',monospace">${n}</div>`).join('')}
                </div>
                ${(t.ticket_extra || t.extra_number) ? `<div style="font-size:0.68rem;color:var(--gold);font-family:'JetBrains Mono',monospace;margin-top:2px">⭐ ${escHtml(getLottery(draw.lottery_type).extraLabel || 'EXTRA')}: ${escHtml(String(t.ticket_extra || t.extra_number))}</div>` : ''}
                ${t.ticket_extra2 ? `<div style="font-size:0.68rem;color:var(--gold);font-family:'JetBrains Mono',monospace;margin-top:1px">⭐ ${escHtml(getLottery(draw.lottery_type).extra2Label || 'EXTRA')}: ${escHtml(String(t.ticket_extra2))}</div>` : ''}
              </div>
            `).join('')}
          </div>` : ''}

        <div class="draw-detail-row"><span>Members In</span><span>${paidBuyIns.map(b => b.members?.name).filter(Boolean).join(', ') || '—'}</span></div>
        <div class="draw-detail-row"><span>Pool Total</span><span>$${poolTotal.toFixed(2)}</span></div>
        ${draw.jackpot_amount ? `<div class="draw-detail-row"><span>Jackpot was</span><span>${escHtml(draw.jackpot_amount)}</span></div>` : ''}
      </div>
    </div>
  `
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}
