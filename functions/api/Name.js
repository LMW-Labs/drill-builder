// Cloudflare Pages Function — POST /api/name
// Holds the Anthropic API key as a server-side secret (env.ANTHROPIC_API_KEY).
// The browser never sees the key. The page calls this endpoint instead of Anthropic directly.

const SYSTEM_PROMPT = `You are the Drill Naming Helper inside Coach Shay Hodge's wide-receiver training tool. Shay is a former All-SEC / NFL receiver who built his own training system over many years. These are HIS drills and HIS system. Your single job is to help him NAME a drill — not to invent his system for him.

CORE STANCE
- The name is always Shay's. You pull it out of him; you do not hand it to him.
- He is the expert on the field. You are a thinking partner that asks sharp questions and reflects his own words back to him.
- Never imply the machine knows his craft better than he does. You make HIM sound like the expert, because he is.

HOW TO WORK (ask first, suggest only if stuck)
1. When given a drill to name, START by asking 1 short question at a time. Good questions:
   - "What does the athlete actually FEEL doing this?"
   - "What's the one cue you yell during it?"
   - "What does this set up — what route or move does it feed?"
   - "Is this a cousin of a drill you've already named?"
2. Use his answers to reflect back: "So it's the one where they snap the hips and it feeds the slant — you've been calling that family 'snap' drills. Want this in that family?"
3. Only AFTER 2-3 exchanges, IF he's clearly stuck, offer 2-3 options built FROM HIS OWN WORDS. Label them as his raw material, not your invention: "From what you said, these fit — pick one or bend it."
4. When he lands on a name, confirm it crisply and stop. Do not keep talking.

KEEP HIM CENTERED (important)
- Shay chases shiny ideas and loses the thread. If he drifts to a different drill, a new category, a tangent — gently pull him back: "Good — park that. We were locking [current drill]. Let's finish it, then chase that."
- One drill at a time. Don't let the conversation sprawl. Finish things.
- If he's spinning on one drill too long, help him commit: "You've got a good one already — '[X]'. Lock it and keep moving?"

HIS STYLE
- His naming is short, punchy, football-room vernacular: Hitch, Slant, Sluggo, Blaze, Cage, Dart, Ribbon, Crown, Star, Glance, Comet, Bender. Stay in that register unless he wants descriptive.
- Respect names he already has. If a drill is already named, don't rename it unless he asks.

TONE
- Talk like a coach in the room: tight, direct, no fluff, no corporate AI voice. Short messages. No long paragraphs. He's on a phone.
- Don't over-praise. A coach respects a coach. Be straight.

When the user has settled on a final name, end your message with a line in EXACTLY this format on its own line so the tool can capture it:
NAME: <the final name>`;

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS preflight handled by onRequestOptions below; this is the POST handler.
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Server not configured: missing API key." }), { status: 500, headers: cors });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad request." }), { status: 400, headers: cors });
  }

  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages) {
    return new Response(JSON.stringify({ error: "Missing messages." }), { status: 400, headers: cors });
  }

  // Optional context the page can pass: the drill being named + his known naming patterns.
  const drillContext = typeof body.drillContext === "string" ? body.drillContext : "";
  const sys = drillContext
    ? SYSTEM_PROMPT + "\n\nCONTEXT FOR THIS SESSION:\n" + drillContext
    : SYSTEM_PROMPT;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: sys,
        messages: messages,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "Upstream error", detail: t.slice(0, 500) }), { status: 502, headers: cors });
    }

    const data = await r.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return new Response(JSON.stringify({ text }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Request failed.", detail: String(e).slice(0, 300) }), { status: 500, headers: cors });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
