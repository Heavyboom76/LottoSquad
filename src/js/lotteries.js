// Central config for all supported lottery types.

export const LOTTERIES = {
  western_649: {
    id: 'western_649',
    name: 'Western 6/49',
    icon: '🎱',
    region: 'AB / SK / MB',
    numbersPerLine: 6,
    numberMax: 49,
    hasExtra: true,
    extraLabel: 'EXTRA',
    extraHint: '7 digits, e.g. 2345671',
    hasExtra2: false,
    hasBonus: true,
    bonusLabel: 'Bonus',
    bonusMax: 49,
    drawDays: 'Wed & Sat',
    description: '6/49 · Wed & Sat',
    prizeTiers: [
      { matches: 6, bonus: false, label: 'JACKPOT 🎉',                    freePlay: false },
      { matches: 5, bonus: true,  label: 'Match 5 + Bonus',               freePlay: false },
      { matches: 5, bonus: false, label: 'Match 5',                        freePlay: false },
      { matches: 4, bonus: false, label: 'Match 4',                        freePlay: false },
      { matches: 3, bonus: false, label: 'Match 3 — Free Play',            freePlay: true  },
      { matches: 2, bonus: true,  label: 'Match 2 + Bonus — Free Play',    freePlay: true  },
    ],
  },

  lotto_649: {
    id: 'lotto_649',
    name: 'Lotto 6/49',
    icon: '🍀',
    region: 'National',
    numbersPerLine: 6,
    numberMax: 49,
    hasExtra: true,
    extraLabel: 'Gold Ball',
    extraHint: 'e.g. 08009419-01',
    hasExtra2: true,
    extra2Label: 'EXTRA',
    extra2Hint: 'e.g. 24-26-42-65-YES',
    hasBonus: true,
    bonusLabel: 'Bonus',
    bonusMax: 49,
    drawDays: 'Wed & Sat',
    description: '6/49 · Wed & Sat',
    prizeTiers: [
      { matches: 6, bonus: false, label: 'JACKPOT 🎉',                    freePlay: false },
      { matches: 5, bonus: true,  label: 'Match 5 + Bonus',               freePlay: false },
      { matches: 5, bonus: false, label: 'Match 5',                        freePlay: false },
      { matches: 4, bonus: false, label: 'Match 4',                        freePlay: false },
      { matches: 3, bonus: false, label: 'Match 3 — Free Play',            freePlay: true  },
      { matches: 2, bonus: true,  label: 'Match 2 + Bonus — Free Play',    freePlay: true  },
    ],
  },

  lotto_max: {
    id: 'lotto_max',
    name: 'Lotto Max',
    icon: '💰',
    region: 'National',
    numbersPerLine: 7,
    numberMax: 52,
    hasExtra: false,
    hasExtra2: false,
    hasBonus: true,
    bonusLabel: 'Bonus',
    bonusMax: 52,
    drawDays: 'Tue & Fri',
    description: '7/52 · Tue & Fri',
    prizeTiers: [
      { matches: 7, bonus: false, label: 'JACKPOT 🎉',                    freePlay: false },
      { matches: 6, bonus: true,  label: 'Match 6 + Bonus',               freePlay: false },
      { matches: 6, bonus: false, label: 'Match 6',                        freePlay: false },
      { matches: 5, bonus: false, label: 'Match 5',                        freePlay: false },
      { matches: 4, bonus: false, label: 'Match 4 — Free Play',            freePlay: true  },
      { matches: 3, bonus: true,  label: 'Match 3 + Bonus — Free Play',    freePlay: true  },
      { matches: 3, bonus: false, label: 'Match 3 — Free Play',            freePlay: true  },
    ],
  },

  daily_grand: {
    id: 'daily_grand',
    name: 'Daily Grand',
    icon: '👑',
    region: 'National',
    numbersPerLine: 5,
    numberMax: 49,
    hasExtra: false,
    hasExtra2: false,
    hasBonus: true,
    bonusLabel: 'Grand #',
    bonusMax: 7,
    drawDays: 'Mon & Thu',
    description: '5/49 · Mon & Thu',
    prizeTiers: [
      { matches: 5, bonus: true,  label: '$1,000/day for Life 🎊',         freePlay: false },
      { matches: 5, bonus: false, label: '$25,000/year for Life',           freePlay: false },
      { matches: 4, bonus: true,  label: 'Match 4 + Grand — $500',         freePlay: false },
      { matches: 4, bonus: false, label: 'Match 4 — $100',                  freePlay: false },
      { matches: 3, bonus: true,  label: 'Match 3 + Grand — $20',          freePlay: false },
      { matches: 3, bonus: false, label: 'Match 3 — $10',                   freePlay: false },
      { matches: 2, bonus: true,  label: 'Match 2 + Grand — Free Play',    freePlay: true  },
      { matches: 2, bonus: false, label: 'Match 2 — Free Play',             freePlay: true  },
    ],
  },

  bc_49: {
    id: 'bc_49',
    name: 'BC/49',
    icon: '🌲',
    region: 'BC',
    numbersPerLine: 6,
    numberMax: 49,
    hasExtra: true,
    extraLabel: 'EXTRA',
    extraHint: 'e.g. 23-45-67-1',
    hasExtra2: false,
    hasBonus: true,
    bonusLabel: 'Bonus',
    bonusMax: 49,
    drawDays: 'Wed & Sat',
    description: '6/49 · Wed & Sat',
    prizeTiers: [
      { matches: 6, bonus: false, label: 'JACKPOT 🎉',                    freePlay: false },
      { matches: 5, bonus: true,  label: 'Match 5 + Bonus',               freePlay: false },
      { matches: 5, bonus: false, label: 'Match 5',                        freePlay: false },
      { matches: 4, bonus: false, label: 'Match 4',                        freePlay: false },
      { matches: 3, bonus: false, label: 'Match 3 — Free Play',            freePlay: true  },
      { matches: 2, bonus: true,  label: 'Match 2 + Bonus — Free Play',    freePlay: true  },
    ],
  },

  western_max: {
    id: 'western_max',
    name: 'Western Max',
    icon: '⚡',
    region: 'AB / SK / MB',
    numbersPerLine: 7,
    numberMax: 50,
    hasExtra: true,
    extraLabel: 'EXTRA',
    extraHint: '7 digits, e.g. 2345671',
    hasExtra2: false,
    hasBonus: true,
    bonusLabel: 'Bonus',
    bonusMax: 50,
    drawDays: 'Tue & Fri',
    description: '7/50 · Tue & Fri',
    prizeTiers: [
      { matches: 7, bonus: false, label: 'JACKPOT 🎉',                    freePlay: false },
      { matches: 6, bonus: true,  label: 'Match 6 + Bonus',               freePlay: false },
      { matches: 6, bonus: false, label: 'Match 6',                        freePlay: false },
      { matches: 5, bonus: false, label: 'Match 5',                        freePlay: false },
      { matches: 4, bonus: false, label: 'Match 4 — Free Play',            freePlay: true  },
      { matches: 3, bonus: true,  label: 'Match 3 + Bonus — Free Play',    freePlay: true  },
      { matches: 3, bonus: false, label: 'Match 3 — Free Play',            freePlay: true  },
    ],
  },
}

export function getLottery(id) {
  return LOTTERIES[id] || LOTTERIES['western_649']
}

/**
 * Calculate how many of a ticket's numbers match the winning numbers,
 * check for bonus match, and find the prize tier.
 */
export function calcTicketMatches(ticketNumbers, winningNumbers, bonusNumber, lotto) {
  const winning = Array.isArray(winningNumbers) ? winningNumbers : []
  const ticket  = Array.isArray(ticketNumbers)  ? ticketNumbers  : []
  const matches  = ticket.filter(n => winning.includes(n)).length
  const hasBonus = bonusNumber != null && ticket.includes(bonusNumber)
  const tier     = lotto?.prizeTiers
    ? (lotto.prizeTiers.find(t => {
        if (t.matches !== matches) return false
        if (t.bonus && !hasBonus)  return false
        return true
      }) || null)
    : null
  return { matches, hasBonus, tier }
}
