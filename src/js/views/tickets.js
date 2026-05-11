import { supabase } from '../supabase.js'
import { ctx } from './app.js'
import { getLottery } from '../lotteries.js'
import { escHtml } from '../main.js'

export async function renderTickets(container) {
  container.innerHTML = `<div class="loading-spinner">Loading tickets...</div>`

  try {
    const { group } = ctx

    const { data: draws } = await supabase.from('draws').select('*')
      .eq('group_id', group.id).order('draw_date', { ascending: false }).limit(1)

    const draw = draws?.[0] || null

    if (!draw) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎟</div><div class="empty-state-title">No Draw Yet</div><p class="text-muted">Tickets will appear here once your admin creates a draw.</p></div>`
      return
    }

    const { data: tickets } = await supabase.from('tickets').select('*')
      .eq('draw_id', draw.id).order('created_at')

    const lotto      = getLottery(draw.lottery_type)
    const winningNums = draw.winning_numbers || []
    const isSettled  = draw.status === 'settled'

    container.innerHTML = `
      <div class="card card-purple" style="margin-bottom:16px">
        <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--purple-light);margin-bottom:4px">${lotto.icon} ${escHtml(lotto.name)}</div>
        <div style="font-family:'Bebas Neue',cursive;font-size:1.8rem;letter-spacing:0.04em">${formatDate(draw.draw_date)}</div>
        ${draw.jackpot_amount ? `<div class="card-meta text-gold" style="margin-top:4px">Jackpot: <strong>${escHtml(draw.jackpot_amount)}</strong></div>` : ''}
        <div style="margin-top:6px;display:flex;align-items:center;gap:8px">
          <span class="draw-status-badge badge-${draw.status}">${draw.status}</span>
          <span class="card-meta">$${Number(draw.buy_in_amount).toFixed(2)}/person</span>
        </div>
      </div>

      ${isSettled && winningNums.length > 0 ? `
        <div class="card card-gold" style="margin-bottom:16px">
          <div class="card-title">🏆 Winning Numbers</div>
          <div class="balls-grid" style="padding:6px 0">
            ${[...winningNums].sort((a,b)=>a-b).map(n => `<div class="ball ball-gold">${n}</div>`).join('')}
            ${draw.bonus_number ? `
              <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
                <div class="ball ball-purple">${draw.bonus_number}</div>
                <div style="font-size:0.58rem;color:var(--text-muted);font-weight:700;letter-spacing:0.06em">BONUS</div>
              </div>` : ''}
          </div>
          ${draw.prize_notes ? `<div style="margin-top:8px;font-size:0.9rem;color:var(--gold)">📋 ${escHtml(draw.prize_notes)}</div>` : ''}
        </div>
      ` : ''}

      <div class="section-header">
        <span class="section-title">Our Tickets (${tickets?.length || 0})</span>
        ${isSettled ? `<span style="font-size:0.75rem;color:var(--purple-light)">✨ Matches highlighted</span>` : ''}
      </div>

      ${!tickets?.length
        ? `<div class="empty-state" style="padding:32px 0"><div class="empty-state-icon">🔢</div><div class="empty-state-title">No Tickets Yet</div><p class="text-muted">Admin will scan the ticket once it's purchased.</p></div>`
        : tickets.map((t, i) => renderTicketCard(t, i + 1, winningNums, isSettled, lotto)).join('')
      }
    `
  } catch (err) {
    console.error(err)
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load</div><p class="text-muted">${err.message}</p></div>`
  }
}

function renderTicketCard(ticket, num, winningNums, isSettled, lotto) {
  const numbers    = Array.isArray(ticket.numbers) ? [...ticket.numbers].sort((a,b)=>a-b) : []
  const winSet     = new Set(winningNums)
  const matchCount = isSettled ? numbers.filter(n => winSet.has(n)).length : 0
  const total      = lotto?.numbersPerLine || numbers.length

  return `
    <div class="ticket-card" style="${isSettled && matchCount > 0 ? 'border-color:var(--gold-dark)' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div class="ticket-label">Quick Pick #${num}</div>
        ${ticket.serial_number ? `<div style="font-family:'JetBrains Mono',monospace;font-size:0.68rem;color:var(--text-muted)">S/N: ${escHtml(ticket.serial_number)}</div>` : ''}
      </div>
      <div class="balls-grid">
        ${numbers.map(n => {
          const hit = isSettled && winSet.has(n)
          return `<div class="ball ${hit ? 'ball-gold' : 'ball-white'}" style="${hit ? 'box-shadow:0 0 12px rgba(251,191,36,0.5)' : ''}">${n}</div>`
        }).join('')}
      </div>
      ${isSettled ? `
        <div style="margin-top:10px;text-align:center;font-size:0.82rem;color:${matchCount >= 4 ? 'var(--gold)' : 'var(--text-muted)'}">
          ${matchCount} of ${total} match${matchCount >= total ? ' 🎉 JACKPOT!' : matchCount >= total-1 ? ' 🤩' : matchCount >= total-2 ? ' 👀' : matchCount >= total-3 ? ' 🙂' : ''}
        </div>` : ''}
      ${(ticket.ticket_extra || ticket.extra_number || ticket.ticket_extra2) ? `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:4px">
          ${(ticket.ticket_extra || ticket.extra_number) ? `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:0.68rem;color:var(--gold);font-weight:700;letter-spacing:0.08em">⭐ ${escHtml(lotto?.extraLabel || 'EXTRA')}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:0.95rem;color:var(--gold)">${escHtml(String(ticket.ticket_extra || ticket.extra_number))}</span>
            </div>` : ''}
          ${ticket.ticket_extra2 ? `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:0.68rem;color:var(--gold);font-weight:700;letter-spacing:0.08em">⭐ ${escHtml(lotto?.extra2Label || 'EXTRA')}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:0.95rem;color:var(--gold)">${escHtml(String(ticket.ticket_extra2))}</span>
            </div>` : ''}
        </div>` : ''}
    </div>
  `
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
