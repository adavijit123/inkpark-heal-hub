export type Faq = {
  id: string;
  question: string;
  keywords: string[];
  short: string;
  do: string;
  avoid: string;
  concern: string;
};

export const FAQS: Faq[] = [
  {
    id: "shower",
    question: "Can I shower?",
    keywords: ["shower", "bath", "wash", "water", "clean"],
    short:
      "Yes — from day one, but keep it short, lukewarm and gentle. Never soak the tattoo.",
    do: "Shower with lukewarm water for 5–10 minutes. Let water run over the tattoo gently, then pat dry with a clean paper towel. Wash once or twice a day with a mild, fragrance-free soap.",
    avoid: "Hot water, high-pressure shower heads aimed at the tattoo, scrubbing, loofahs, and long baths. No soaking in tubs until fully healed.",
    concern:
      "If the skin stays soggy, overly white or wrinkled after showers, you are over-wetting it. Message us if it doesn't improve within a day.",
  },
  {
    id: "workout",
    question: "Can I work out?",
    keywords: ["gym", "workout", "exercise", "training", "sweat", "run", "sport", "fitness"],
    short:
      "Light movement is fine after 48 hours, but avoid heavy training for about 2 weeks.",
    do: "Wait at least 48 hours before any exercise. Start light, wear loose clean clothing over the tattoo, and shower immediately after sweating.",
    avoid: "Heavy lifting that stretches the tattooed skin, contact sports, and anything that causes heavy sweating onto the fresh tattoo during week one.",
    concern:
      "If the tattoo cracks, bleeds or stings badly after a workout, stop training that area and message us with a photo.",
  },
  {
    id: "sleep",
    question: "Can I sleep on my tattoo?",
    keywords: ["sleep", "bed", "night", "pillow", "lying"],
    short:
      "Try not to sleep directly on a fresh tattoo for the first 4–7 nights.",
    do: "Sleep on the opposite side, use clean bedsheets, and wear loose soft clothing. If the tattoo sticks to fabric, wet the fabric with lukewarm water before peeling it away.",
    avoid: "Rough sheets, pets in the bed, and tight sleepwear pressing on the tattoo. Never rip stuck fabric off dry.",
    concern:
      "Minor imprint marks or light colour transfer on sheets is normal. Heavy bleeding or stuck fabric that won't release with water — contact us.",
  },
  {
    id: "swimming",
    question: "Can I go swimming?",
    keywords: ["swim", "swimming", "pool", "sea", "ocean", "water", "beach", "bath"],
    short:
      "No swimming for at least 2–3 weeks — until the tattoo is fully healed.",
    do: "Wait until all peeling has finished and the skin feels completely smooth — usually 3 weeks, sometimes 4. Quick showers are fine; submersion is not.",
    avoid: "Pools, the sea, lakes, hot tubs and bathtubs. Chlorine, salt and bacteria can fade the ink and cause infection.",
    concern:
      "If you accidentally soaked the tattoo and it becomes red, swollen or starts oozing, message us with a photo the same day.",
  },
  {
    id: "sunscreen",
    question: "Can I use sunscreen?",
    keywords: ["sunscreen", "sun", "spf", "tan", "uv", "sunburn"],
    short:
      "Not on a fresh tattoo. Only after it is fully healed — then always use SPF 50.",
    do: "Keep the healing tattoo covered with loose clothing and out of the sun. Once fully healed (3–4 weeks), apply SPF 50+ every time it's exposed.",
    avoid: "Sunscreen or any lotion not approved for open skin during healing. Direct sun on a fresh tattoo — it burns easily and fades the ink permanently.",
    concern:
      "If the tattoo got sunburnt while healing and blisters or peels heavily, contact us before applying anything.",
  },
  {
    id: "peeling",
    question: "Why is my tattoo peeling?",
    keywords: ["peeling", "peel", "flaking", "flake", "skin", "scab", "shedding"],
    short:
      "Peeling around day 4–6 is completely normal — your skin is shedding its top layer as it heals.",
    do: "Let the flakes fall off on their own. Keep washing gently and moisturize 2–3 times a day with a thin layer of the recommended balm.",
    avoid: "Picking, scratching or pulling the peeling skin — this pulls out ink and leaves patchy spots. Don't over-moisturize.",
    concern:
      "Peeling with thick scabs, yellow fluid or strong redness is not normal. Send us a photo if you see any of these.",
  },
  {
    id: "faded",
    question: "Why does my tattoo look faded?",
    keywords: ["faded", "fade", "dull", "cloudy", "milky", "grey", "color", "colour"],
    short:
      "A dull, milky look during weeks 2–4 is normal — it's a thin new layer of skin over the ink. True colour returns once healed.",
    do: "Be patient. Keep moisturizing and protect it from the sun. The tattoo usually looks fully settled by week 4–6.",
    avoid: "Judging the final result before it's healed, exfoliating to 'brighten' it, or sun exposure.",
    concern:
      "If the tattoo still looks patchy or uneven after 6 weeks, message us — a free touch-up may be needed.",
  },
  {
    id: "itchy",
    question: "Why is my tattoo itchy?",
    keywords: ["itchy", "itch", "scratch", "irritation", "tickle"],
    short:
      "Itching is a normal healing sign, especially during days 4–10 as the skin regenerates.",
    do: "Apply a thin layer of moisturizer when it itches, or gently pat (never scratch) the area with clean fingers. Cold, clean compresses also help.",
    avoid: "Scratching, slapping or rubbing the tattoo — even through clothing. Avoid fragranced lotions that can worsen irritation.",
    concern:
      "Intense itching with a spreading red rash, bumps or hives may be an allergic reaction. Message us with a photo straight away.",
  },
  {
    id: "shave",
    question: "When can I shave?",
    keywords: ["shave", "shaving", "razor", "hair", "wax", "trim"],
    short:
      "Only after the tattoo is fully healed — usually 3–4 weeks. A razor over healing skin can ruin the ink.",
    do: "Wait until the skin is completely smooth with no flaking or tenderness. Then shave gently with a fresh, clean razor.",
    avoid: "Shaving, waxing or epilating over the tattoo while any peeling or scabbing remains — no exceptions.",
    concern:
      "If you accidentally shaved over it and the skin broke or ink lifted, send us a photo so we can check it.",
  },
  {
    id: "beach",
    question: "When can I go to the beach?",
    keywords: ["beach", "sea", "vacation", "holiday", "sun", "sand", "swim", "water"],
    short:
      "Give it 3–4 weeks. Beach trips combine the three biggest risks: sun, salt water and sand.",
    do: "Wait until fully healed. When you go, use SPF 50+, reapply after swimming, and rinse salt and sand off with fresh water.",
    avoid: "Sand touching a healing tattoo, sunbathing, and swimming in the sea before it's healed.",
    concern:
      "If sand or seawater got into a healing tattoo and it turns red, swollen or painful, contact us the same day.",
  },
];

export function searchFaqs(query: string): Faq[] {
  const q = query.trim().toLowerCase();
  if (!q) return FAQS;
  const words = q.split(/\s+/);
  return FAQS.filter((f) => {
    const haystack = `${f.question} ${f.keywords.join(" ")} ${f.short}`.toLowerCase();
    return words.some((w) => w.length > 1 && haystack.includes(w));
  });
}
