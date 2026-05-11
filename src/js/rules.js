/**
 * Default boilerplate rules for a LottoSquad pool.
 * Admins can use these as-is or customize them during onboarding.
 */

export const DEFAULT_RULES = `ELIGIBILITY & BUY-IN
• Any confirmed member may participate in a draw.
• Buy-in must be sent via e-transfer to the admin before the draw closes.
• Once you tap "I Sent My Payment" in the app, the admin will confirm receipt. You are NOT in the draw until confirmed.
• No pay = no play. Unconfirmed members at draw time are excluded — no exceptions.

TICKETS
• The admin purchases tickets on behalf of the pool after buy-ins are confirmed.
• Ticket numbers will be posted in the app for all members to see.
• Physical tickets are held by the admin until the draw is settled.

WINNINGS — FREE PLAYS & SMALL PRIZES
• Any free play tickets won will be played on the next pool draw automatically.
• Small cash winnings (up to $100 total) will be carried forward as credit toward the next draw's ticket purchase — buy-ins for that draw will be reduced accordingly.
• "Small winnings" means the total prize amount divided equally among confirmed members results in less than $20 per person.

WINNINGS — LARGER PRIZES
• Prizes exceeding the "small winnings" threshold will be split equally among confirmed members of THAT specific draw only.
• A member must have been confirmed (paid and verified) for the draw in question to receive a share.
• Members who did not buy in to a specific draw have no claim to winnings from that draw, regardless of participation in other draws.
• To be eligible for a jackpot or large prize payout, you must have opted into and paid for that specific draw. There are no retroactive buy-ins after the draw has taken place.

ROLLOVERS & CONTINUED PLAY
• The pool decides by majority whether to continue playing after a large win.
• Each member must independently opt in and pay for any subsequent draws — previous participation does not carry forward automatically.

DISPUTES
• The admin's decision on prize distribution is final.
• In the event of a dispute, the physical ticket and app records serve as the official source of truth.
• Any member who disputes the outcome must raise the issue before winnings are distributed.

GENERAL
• The pool is run in good faith for fun. Nobody is getting rich — but if we do, see above.
• The admin reserves the right to remove a member who repeatedly fails to pay or disrupts the pool.
• Rules may be updated by the admin at any time with notice to all members.`

/**
 * Renders the rules modal HTML. Append to document.body and remove on close.
 */
export function showRulesModal(customRules) {
  const rules = customRules || DEFAULT_RULES
  const existing = document.getElementById('rules-modal-overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'rules-modal-overlay'
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;
    display:flex;align-items:flex-end;justify-content:center;
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
    padding:0;
  `

  overlay.innerHTML = `
    <div style="
      background:var(--bg-card);
      border:1px solid var(--border-bright);
      border-radius:20px 20px 0 0;
      width:100%;
      max-width:480px;
      max-height:85vh;
      display:flex;
      flex-direction:column;
      overflow:hidden;
      box-shadow:0 -8px 40px rgba(124,58,237,0.2);
    ">
      <div style="
        padding:20px 20px 12px;
        border-bottom:1px solid var(--border);
        display:flex;
        justify-content:space-between;
        align-items:center;
        flex-shrink:0;
      ">
        <div>
          <div style="font-family:'Bebas Neue',cursive;font-size:1.6rem;letter-spacing:0.05em;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1">Pool Rules</div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">Standard LottoSquad guidelines</div>
        </div>
        <button id="rules-close-btn" style="
          background:var(--bg-input);border:1px solid var(--border);
          border-radius:50%;width:32px;height:32px;
          color:var(--text-muted);font-size:1rem;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        ">✕</button>
      </div>

      <div style="overflow-y:auto;padding:20px;flex:1;-webkit-overflow-scrolling:touch;">
        ${rules.split('\n').map(line => {
          if (!line.trim()) return '<div style="height:8px"></div>'
          // Section headers (ALL CAPS lines)
          if (line === line.toUpperCase() && line.trim().length > 3 && !line.startsWith('•')) {
            return `<div style="
              font-family:'Bebas Neue',cursive;
              font-size:1.05rem;
              letter-spacing:0.08em;
              color:var(--purple-light);
              margin:16px 0 8px;
              padding-bottom:4px;
              border-bottom:1px solid var(--border);
            ">${line}</div>`
          }
          // Bullet points
          if (line.trim().startsWith('•')) {
            return `<div style="
              display:flex;gap:8px;
              font-size:0.875rem;
              line-height:1.55;
              color:var(--text);
              margin-bottom:6px;
            ">
              <span style="color:var(--purple-light);flex-shrink:0;margin-top:1px">•</span>
              <span>${line.trim().slice(1).trim()}</span>
            </div>`
          }
          return `<div style="font-size:0.875rem;line-height:1.55;margin-bottom:4px">${line}</div>`
        }).join('')}

        <div style="
          margin-top:20px;
          padding:14px;
          background:var(--grad-subtle);
          border:1px solid var(--purple);
          border-radius:var(--radius-sm);
          font-size:0.82rem;
          color:var(--text-muted);
          line-height:1.5;
        ">
          ☠️ <strong style="color:var(--text)">The Jackpot Clause:</strong> In the catastrophic event that we actually win big and you're unreachable, we will make exactly one (1) phone call. No answer means we assume you've perished from shock. Your share gets divided among the survivors. No exceptions. No refunds. Play responsibly.
        </div>

        <div style="height:24px"></div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  overlay.querySelector('#rules-close-btn').addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove() })
}
