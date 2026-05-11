// @ts-nocheck
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mediaType, lotteryType } = await req.json()

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const configs = {
      western_649: { n: 6, max: 49, extraLabel: 'EXTRA',     extraHint: '7-digit number, e.g. 2345671',        extra2Label: null,    extra2Hint: null },
      lotto_649:   { n: 6, max: 49, extraLabel: 'Gold Ball',  extraHint: 'number formatted like 08009419-01',   extra2Label: 'EXTRA', extra2Hint: 'formatted like 24-26-42-65-YES' },
      lotto_max:   { n: 7, max: 52, extraLabel: null,         extraHint: null,                                  extra2Label: null,    extra2Hint: null },
      daily_grand: { n: 5, max: 49, extraLabel: null,         extraHint: null,                                  extra2Label: null,    extra2Hint: null },
      bc_49:       { n: 6, max: 49, extraLabel: 'EXTRA',      extraHint: 'number formatted like 23-45-67-1',    extra2Label: null,    extra2Hint: null },
      western_max: { n: 7, max: 50, extraLabel: 'EXTRA',      extraHint: '7-digit number, e.g. 2345671',        extra2Label: null,    extra2Hint: null },
    }
    const cfg = configs[lotteryType] || configs['western_649']

    const extraInstruction  = cfg.extraLabel  ? '2. The ' + cfg.extraLabel  + ' number — ' + cfg.extraHint  + ' (labeled "' + cfg.extraLabel  + '" on the ticket)\n' : ''
    const extra2Instruction = cfg.extra2Label ? '3. The ' + cfg.extra2Label + ' number — ' + cfg.extra2Hint + ' (labeled "' + cfg.extra2Label + '" on the ticket, separate from the Gold Ball)\n' : ''
    const extraJsonField    = cfg.extraLabel  ? '"extra":"<value or null>"'  : '"extra":null'
    const extra2JsonField   = cfg.extra2Label ? '"extra2":"<value or null>"' : '"extra2":null'

    const gameNames = {
      western_649: 'Western 6/49', lotto_649: 'Lotto 6/49', lotto_max: 'Lotto Max',
      daily_grand: 'Daily Grand',  bc_49: 'BC/49',           western_max: 'Western Max',
    }
    const gameName = gameNames[lotteryType] || lotteryType

    const lotto649Note = lotteryType === 'lotto_649'
      ? ' The Gold Ball number is inside a printed circle and looks like 08009419-01. The EXTRA number is below the Gold Ball circle and looks like 24-26-42-65-YES or 24-26-42-65-NO. These are two different numbers — extract both.'
      : ''
    const dailyGrandNote = lotteryType === 'daily_grand'
      ? ' Only extract the 5 main numbers per line. Ignore the Grand Number column.'
      : ''

    const promptText =
      'This is a ' + gameName + ' lottery ticket.\n' +
      'Extract:\n' +
      '1. All sets of ' + cfg.n + ' main numbers (1-' + cfg.max + ')' + lotto649Note + dailyGrandNote + '\n' +
      extraInstruction +
      extra2Instruction +
      '\nRespond ONLY with valid JSON, nothing else:\n' +
      '{"sets":[[1,2,3,4,5,6]...],' + extraJsonField + ',' + extra2JsonField + '}\n\n' +
      'Rules:\n' +
      '- sets: arrays of exactly ' + cfg.n + ' integers, each 1-' + cfg.max + ', no duplicates per set\n' +
      (cfg.extraLabel  ? '- extra: the '  + cfg.extraLabel  + ' as a string exactly as printed, or null if not found\n' : '') +
      (cfg.extra2Label ? '- extra2: the ' + cfg.extra2Label + ' as a string exactly as printed (e.g. 24-26-42-65-YES), or null if not found\n' : '') +
      '- Return {"sets":[],"extra":null,"extra2":null} if nothing valid found'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: promptText },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'Anthropic API error')
    }

    const aiData = await response.json()
    const text = (aiData.content?.[0]?.text || '').trim() || '{"sets":[],"extra":null,"extra2":null}'

    let parsed
    try { parsed = JSON.parse(text) }
    catch { throw new Error('Could not parse AI response as JSON') }

    const validSets = (parsed.sets || []).filter(set =>
      Array.isArray(set) &&
      set.length === cfg.n &&
      set.every(n => Number.isInteger(n) && n >= 1 && n <= cfg.max) &&
      new Set(set).size === cfg.n
    )

    const extra  = cfg.extraLabel  && parsed.extra  ? String(parsed.extra).trim()  : null
    const extra2 = cfg.extra2Label && parsed.extra2 ? String(parsed.extra2).trim() : null

    return new Response(JSON.stringify({ sets: validSets, extra, extra2 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('parse-ticket error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
