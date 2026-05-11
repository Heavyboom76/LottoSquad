import { navigate, escHtml } from '../main.js'

export async function renderLanding(container) {
  container.innerHTML = `
    <div class="landing">
      <div class="landing-hero">
        <div class="landing-logo">🎰</div>
        <h1 class="landing-title">LottoSquad</h1>
        <p class="landing-tagline">Run your lottery pool like a pro. Create a squad, collect buy-ins, scan tickets — all in one place.</p>
        <div class="landing-cta-group">
          <button id="land-signup" class="btn btn-grad">🚀 Create Your Squad — Free</button>
          <button id="land-login" class="btn btn-ghost">I already have a squad</button>
        </div>
      </div>

      <div class="landing-steps">
        <div class="landing-step">
          <div class="landing-step-num">1</div>
          <div class="landing-step-text">
            <h3>Create your squad</h3>
            <p>Sign up in seconds. Name your pool, add your e-Transfer info, set the rules.</p>
          </div>
        </div>
        <div class="landing-step">
          <div class="landing-step-num">2</div>
          <div class="landing-step-text">
            <h3>Invite your crew</h3>
            <p>Share your unique squad link. Members join with just their name — no account needed.</p>
          </div>
        </div>
        <div class="landing-step">
          <div class="landing-step-num">3</div>
          <div class="landing-step-text">
            <h3>Play &amp; win together</h3>
            <p>Track buy-ins, scan ticket photos with AI, and settle draws in one tap.</p>
          </div>
        </div>

        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-top:8px">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <span style="background:var(--purple-dim);color:var(--purple-light);font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:100px">🇨🇦 Canadian Lotteries</span>
            <span style="background:var(--green-dim);color:var(--green);font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:100px">🤖 AI Ticket Scanner</span>
            <span style="background:var(--gold-glow);color:var(--gold);font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:100px">💸 Buy-in Tracking</span>
            <span style="background:var(--pink-dim);color:var(--pink);font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:100px">📱 Works on Any Phone</span>
          </div>
          <p style="font-size:0.85rem;color:var(--text-muted)">Supports Western 6/49, Lotto 6/49, Lotto Max, Daily Grand, BC/49, Western Max — with all secondary numbers (Gold Ball, EXTRA, etc.)</p>
        </div>
      </div>

      <div class="landing-footer">
        lottosquad.ca · Made for Canadian lottery pools 🍁
      </div>
    </div>
  `

  container.querySelector('#land-signup').addEventListener('click', () => navigate('/signup'))
  container.querySelector('#land-login').addEventListener('click',  () => navigate('/login'))
}
