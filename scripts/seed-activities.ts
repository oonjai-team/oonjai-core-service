// Seeds up to 100 ACTIVITY rows designed to exercise every index we added:
//   - idx_activity_category   → 5 categories, ~20 rows each
//   - idx_activity_start_date → StartDate spread across ±90 days
//   - idx_activity_price      → Price spread across 0..1950 THB
//   - idx_activity_title_trgm → titles share overlapping words (yoga, walk, market…)
//   - idx_activity_location_trgm → 5 cities × multiple venues
//
// Images come from picsum.photos (no API key, free) seeded so each activity
// gets a stable, varied set. Hosts come from Point_of_Contact — this script
// reads existing POC rows and assigns them deterministically so consecutive
// activities share the same host (cluster by index).
//
// Usage:  bun run scripts/seed-activities.ts [--count=100] [--reset]

import sql from "../src/lib/postgres"

const argv = process.argv.slice(2)
const countArg = argv.find(a => a.startsWith("--count="))?.split("=")[1]
const TOTAL = Math.max(1, Math.min(100000, Number(countArg) || 100))
const RESET = argv.includes("--reset")

// Matches the FilterBar dropdown options in oonjai-web.
const CATEGORIES = ["Social Companion", "Exercise", "Food", "Wellness", "Religion"] as const
type Category = typeof CATEGORIES[number]

const CITIES = ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Hua Hin"] as const
const VENUES: Record<typeof CITIES[number], string[]> = {
  "Bangkok":     ["Lumphini Park", "Benchakitti Park", "Chatuchak Market", "Asiatique Riverfront", "Siam Paragon"],
  "Chiang Mai":  ["Old City Gate", "Nimman Community Mall", "Huay Tung Tao Lake", "Wat Phra Singh", "Doi Suthep"],
  "Phuket":      ["Patong Beach", "Old Town", "Big Buddha Hill", "Rawai Pier", "Phromthep Cape"],
  "Pattaya":     ["Jomtien Beach", "Walking Street", "Nong Nooch Garden", "Pattaya Park", "Koh Larn"],
  "Hua Hin":     ["Cicada Market", "Hua Hin Beach", "Khao Takiab Temple", "Hua Hin Night Market", "Pranburi Forest Park"],
}

// Title templates per category — each template seeds a set of variations.
// Overlapping tokens (e.g. "Morning", "Group", "Session") make the trigram
// index useful; substrings like "yoga", "walk", "market" are searchable.
const TITLE_TEMPLATES: Record<Category, string[]> = {
  "Social Companion": [
    "Morning Coffee Chat",
    "Senior Book Club",
    "Afternoon Tea Social",
    "Storytelling Circle",
    "Community Bingo Night",
    "Friendship Gathering",
    "Memory Lane Meetup",
    "Neighborhood Walk & Talk",
  ],
  "Exercise": [
    "Chill Group Walk",
    "Gentle Morning Stretch",
    "Tai Chi in the Park",
    "Senior Water Aerobics",
    "Evening Power Walk",
    "Seated Strength Session",
    "Balance & Mobility Class",
    "Beachside Jog Group",
  ],
  "Food": [
    "Group Dinner",
    "Thai Cooking Workshop",
    "Farmers Market Tour",
    "Healthy Lunch Gathering",
    "Dessert Tasting Circle",
    "Sunday Brunch Social",
    "Night Market Food Walk",
    "Herbal Tea Tasting",
  ],
  "Wellness": [
    "Yoga Group",
    "Meditation For Wellness",
    "Gentle Yoga Session",
    "Breathing & Relaxation",
    "Sound Bath Therapy",
    "Aromatherapy Afternoon",
    "Wellness Walking Tour",
    "Mindful Nature Walk",
  ],
  "Religion": [
    "Temple Morning Chant",
    "Guided Temple Visit",
    "Merit-Making Trip",
    "Sunday Temple Gathering",
    "Meditation Retreat Day",
    "Full Moon Ceremony",
    "Morning Alms Walk",
    "Dharma Talk Afternoon",
  ],
}

const TAG_POOL: Record<Category, string[]> = {
  "Social Companion": ["Social", "Community", "Friendship", "Connection"],
  "Exercise":         ["Exercise", "Fitness", "Wellness", "Outdoor"],
  "Food":             ["Food", "Cooking", "Social", "Cultural"],
  "Wellness":         ["Wellness", "Mindfulness", "Relaxation", "Exercise"],
  "Religion":         ["Religion", "Meditation", "Cultural", "Spiritual"],
}

const DURATIONS = ["60 Mins", "90 Mins", "120 Mins", "150 Mins", "180 Mins"]

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]!)
  }
  return out
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function randomInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

function buildActivity(index: number, pocIds: string[]) {
  const category = CATEGORIES[index % CATEGORIES.length]
  const city = CITIES[index % CITIES.length]
  const venues = VENUES[city]
  const venue = venues[randomInt(0, venues.length - 1)]
  const titles = TITLE_TEMPLATES[category]
  const title = titles[index % titles.length]
  const tags = pickN(TAG_POOL[category], randomInt(2, 3))

  // Deterministic POC assignment: consecutive activities share the same host
  // so a given host runs a small cluster of activities (realistic scheduling).
  const pocId = pocIds.length > 0
    ? pocIds[Math.floor((index * pocIds.length) / Math.max(1, TOTAL))]
    : null

  // Spread StartDate uniformly across ±90 days from today.
  const dayOffset = Math.floor(rand(-90, 90))
  const start = new Date()
  start.setDate(start.getDate() + dayOffset)
  start.setHours(randomInt(7, 18), [0, 30][randomInt(0, 1)], 0, 0)
  const durationHours = [1, 1.5, 2, 2.5, 3][randomInt(0, 4)]
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000)

  // Price spread 0..1950 in 50-THB steps (so slider boundaries at 0/2000 work).
  const price = randomInt(0, 39) * 50

  const maxPeople = randomInt(6, 25)
  const participantCount = randomInt(0, maxPeople)
  const rating = Math.round(rand(3.8, 5.0) * 10) / 10
  const reviews = randomInt(0, 60)

  // picsum.photos: free, no API key. Seeded URLs give stable but varied images.
  const seedBase = `oonjai-${index}`
  const images = Array.from({length: 5}, (_, i) => `https://picsum.photos/seed/${seedBase}-${i}/800/600`)

  return {
    title,
    category,
    tags,
    pocId,
    startDate: start,
    endDate: end,
    location: `${venue}, ${city}`,
    price,
    participantCount,
    duration: `${durationHours * 60} Mins`,
    durationLabel: DURATIONS[randomInt(0, DURATIONS.length - 1)],
    maxPeople,
    rating,
    reviews,
    images,
  }
}

async function main() {
  try {
    if (RESET) {
      console.log("resetting: deleting all existing ACTIVITY rows...")
      await sql`DELETE FROM "ACTIVITY"`
    }

    const existing = await sql`SELECT COUNT(*)::int AS n FROM "ACTIVITY"`
    console.log(`existing ACTIVITY rows: ${existing[0]!.n}`)
    console.log(`seeding ${TOTAL} new activities...`)

    const pocRows = await sql`SELECT "POCID" FROM "Point_of_Contact" ORDER BY "POCID"`
    const pocIds = pocRows.map((r: any) => r.POCID as string)
    if (pocIds.length === 0) {
      console.log("WARNING: no Point_of_Contact rows found — activities will have POCID=NULL. Run the POC seed first.")
    } else {
      console.log(`found ${pocIds.length} POCs — assigning deterministically across activities`)
    }

    const BATCH = 200
    const now = new Date()
    let inserted = 0
    for (let start = 0; start < TOTAL; start += BATCH) {
      const rows = []
      for (let i = start; i < Math.min(start + BATCH, TOTAL); i++) {
        const a = buildActivity(i, pocIds)
        rows.push({
          Title: a.title,
          Category: a.category,
          Tags: JSON.stringify(a.tags),
          POCID: a.pocId,
          StartDate: a.startDate,
          EndDate: a.endDate,
          Location: a.location,
          Price: a.price,
          ParticipantCount: a.participantCount,
          Duration: a.duration,
          MaxPeople: a.maxPeople,
          Rating: a.rating,
          Reviews: a.reviews,
          Images: JSON.stringify(a.images),
          CreatedDate: now,
        })
      }
      await sql`INSERT INTO "ACTIVITY" ${sql(rows as any)}`
      inserted += rows.length
      process.stdout.write(`  inserted ${inserted}/${TOTAL}\n`)
    }

    // Summary per category / city so you can sanity-check the distribution.
    const byCat = await sql`SELECT "Category", COUNT(*)::int AS n FROM "ACTIVITY" GROUP BY "Category" ORDER BY n DESC`
    const byLoc = await sql`SELECT split_part("Location", ', ', 2) AS city, COUNT(*)::int AS n FROM "ACTIVITY" GROUP BY city ORDER BY n DESC`
    console.log("\ndistribution by category:")
    for (const r of byCat) console.log(`  ${r.Category.padEnd(18)} ${r.n}`)
    console.log("\ndistribution by city:")
    for (const r of byLoc) console.log(`  ${(r.city || "(none)").padEnd(14)} ${r.n}`)

    console.log("\ndone.")
  } finally {
    await sql.end({timeout: 5})
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
