// ----------------------------------------------------------------------------
// Phrasing helper.
//
// The point of this is to push résumé bullets AWAY from the formulaic
// "Led X, increasing Y by Z%" voice that reads as machine-generated. It offers
// a rotating set of openers and whole-line starters with deliberately varied
// grammar, register and rhythm — some plain, some first-person, some
// understated — so each suggestion feels written by a person rather than
// stamped from a template.
//
// It is intentionally NOT an AI call: it's a local nudge that gives the user a
// natural-sounding scaffold to edit, not finished copy to paste verbatim.
// ----------------------------------------------------------------------------

// Sentence openers grouped by the kind of thing a bullet is doing. Within each
// group the wording varies a lot on purpose — no shared "Led/Built/Drove" mold.
const OPENERS: Record<string, string[]> = {
  built: [
    'Built',
    'Put together',
    'Wrote',
    'Shipped',
    'Stood up',
    'Got',
    'Quietly rebuilt',
  ],
  improved: [
    'Cleaned up',
    'Untangled',
    'Made',
    'Cut down',
    'Sped up',
    'Took the rough edges off',
    'Finally fixed',
  ],
  owned: [
    'Owned',
    'Took over',
    'Ran',
    'Looked after',
    'Was the person responsible for',
    'Kept',
  ],
  helped: [
    'Helped',
    'Paired with',
    'Worked with',
    'Sat down with',
    'Got the team to',
    'Convinced',
  ],
  learned: [
    'Learned',
    'Figured out',
    'Picked up',
    'Came away understanding',
  ],
}

// Whole-line scaffolds with a {…} the user fills in. Mixed registers on purpose:
// confident, modest, wry — anything but uniform.
const LINE_STARTERS: string[] = [
  'Owned {the thing}, from the messy version to the one people stopped complaining about.',
  'Was the person who finally {did the unglamorous task} so the rest of the team didn’t have to.',
  'Worked closely with {whom} to {do what} — learned to ask “why” before “how.”',
  'Took {the thing nobody wanted to touch} and made it boring, in the good way.',
  'Built {the thing} for {whom}; people I’ve never met use it now, which is a strange and nice feeling.',
  'Spent a lot of time {on what}, mostly because it mattered more than it looked like it did.',
  'Got {a result} not by mandate but by sitting with people until it made sense.',
  'Documented {the process} so new folks stopped pinging me at 9pm.',
]

// A short, rotating tip shown alongside the suggestions — coaching the user
// toward human phrasing rather than buzzwords.
export const PHRASING_TIPS: string[] = [
  'Tip: name a real thing you did, not a metric you’re proud of.',
  'Tip: it’s fine to sound like yourself — drop a “finally” or a “quietly.”',
  'Tip: one specific story beats three vague achievements.',
  'Tip: cut “leveraged,” “spearheaded,” “synergy.” Say what actually happened.',
  'Tip: a small honest detail (“at 9pm,” “nobody wanted to”) reads as human.',
]

// Deterministic pick so suggestions are stable within a render but vary by
// position — no Math.random (it breaks SSR/replay and feels arbitrary).
function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length]
}

// Return `count` varied phrasing suggestions. `seed` rotates the selection so
// repeated clicks surface different options.
export function suggestPhrasings(seed: number, count = 4): string[] {
  const groups = Object.values(OPENERS)
  const out: string[] = []
  // Mix a couple of "opener + …" prompts with whole-line scaffolds.
  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) {
      const group = pick(groups, seed + i)
      const opener = pick(group, seed * 3 + i)
      out.push(`${opener} …`)
    } else {
      out.push(pick(LINE_STARTERS, seed * 2 + i))
    }
  }
  return out
}

export function tipFor(seed: number): string {
  return pick(PHRASING_TIPS, seed)
}
