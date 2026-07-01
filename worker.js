// Cloudflare Worker — serves the Drill Builder app at / and handles POST /api/name.
// Deploy: wrangler deploy
// Secret required: wrangler secret put ANTHROPIC_API_KEY

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

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Hodge Performance — Drill Builder</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;700;800&family=Inter:wght@400;500;600&family=Spline+Sans+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  :root{
    --night:#0e1a24;        /* field at dusk */
    --night-2:#13242f;
    --panel:#162a36;
    --line:#26404f;
    --chalk:#eceadf;        /* worn chalk */
    --chalk-dim:#9fb0b9;
    --turf:#4f9d5d;         /* active spine only */
    --turf-dim:#1c3525;
    --gold:#c9962e;         /* yard-marker geometry */
    --gold-dim:#3a2f12;
    --flag:#c2533a;         /* draft / unsaved */
    --radius:12px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-text-size-adjust:100%}
  body{
    background:
      radial-gradient(120% 80% at 50% -10%, #18303d 0%, var(--night) 55%) fixed,
      var(--night);
    color:var(--chalk);
    font-family:"Inter",system-ui,sans-serif;
    line-height:1.45;
    padding:clamp(16px,4vw,40px) clamp(14px,4vw,40px) 140px;
    min-height:100vh;
  }
  .wrap{max-width:760px;margin:0 auto}

  /* ---------- header ---------- */
  header{position:relative;margin-bottom:22px}
  .eyebrow{
    font-family:"Spline Sans Mono",monospace;font-size:11px;letter-spacing:.34em;
    text-transform:uppercase;color:var(--gold);margin-bottom:10px;
  }
  h1{
    font-family:"Saira Condensed",sans-serif;font-weight:800;
    font-size:clamp(40px,11vw,72px);line-height:.86;letter-spacing:-.01em;
    text-transform:uppercase;
  }
  h1 .l2{display:block;color:var(--chalk-dim);-webkit-text-stroke:0}
  .lede{color:var(--chalk-dim);font-size:14px;margin-top:14px;max-width:520px}
  .draft{
    display:inline-flex;align-items:center;gap:7px;margin-top:14px;
    font-family:"Spline Sans Mono",monospace;font-size:10px;font-weight:500;
    letter-spacing:.18em;text-transform:uppercase;color:var(--flag);
    border:1px solid color-mix(in srgb,var(--flag) 55%,transparent);
    border-radius:100px;padding:5px 12px;
  }
  .draft i{width:6px;height:6px;border-radius:50%;background:var(--flag);
    animation:pulse 2.2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}

  /* ---------- clock ---------- */
  .clock{
    margin:24px 0 8px;padding:18px 20px;border:1px solid var(--line);
    border-radius:var(--radius);background:linear-gradient(180deg,var(--panel),var(--night-2));
    position:relative;overflow:hidden;
  }
  .clock-top{display:flex;align-items:baseline;justify-content:space-between;gap:14px}
  .clock .big{font-family:"Saira Condensed",sans-serif;font-weight:800;font-size:46px;line-height:1}
  .clock .big small{font-size:15px;color:var(--chalk-dim);font-weight:600;margin-left:4px}
  .clock .state{font-family:"Spline Sans Mono",monospace;font-size:12px;letter-spacing:.06em;color:var(--chalk-dim);text-align:right}
  .clock .state b{color:var(--turf);display:block;font-size:13px;letter-spacing:.1em;text-transform:uppercase}
  .clock .state b.over{color:var(--flag)}
  .rail{margin-top:14px;height:8px;border-radius:6px;background:#0b1820;position:relative;overflow:hidden}
  .rail i{position:absolute;inset:0 100% 0 0;background:linear-gradient(90deg,var(--turf),#6fc07e);transition:right .3s cubic-bezier(.4,0,.2,1)}
  .yardlines{position:absolute;inset:0;display:flex;justify-content:space-between;padding:0 33.33%}
  .yardlines span{width:1px;background:color-mix(in srgb,var(--gold) 50%,transparent)}

  /* ---------- spine ---------- */
  .section-h{
    display:flex;align-items:center;gap:10px;margin:30px 0 4px;
    font-family:"Spline Sans Mono",monospace;font-size:11px;letter-spacing:.22em;
    text-transform:uppercase;color:var(--chalk-dim);
  }
  .section-h .ln{flex:1;height:1px;background:var(--line)}

  .spine{position:relative}
  .step{
    position:relative;background:var(--panel);border:1px solid var(--line);
    border-radius:var(--radius);padding:14px 14px 12px;margin-bottom:12px;
    transition:border-color .18s,box-shadow .18s,transform .08s;
  }
  .step::before{
    content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:3px;
    background:var(--turf);opacity:.9;
  }
  .step.drop-armed{border-color:var(--turf);box-shadow:0 0 0 1px var(--turf),0 10px 30px rgba(0,0,0,.4)}
  .step-top{display:flex;align-items:flex-start;gap:12px}
  .glyph{flex:none;width:34px;height:34px;margin-top:1px}
  .glyph svg{width:100%;height:100%;display:block;overflow:visible}
  .glyph .stem{stroke:var(--gold);stroke-width:2.2;fill:none;stroke-linecap:round;stroke-linejoin:round}
  .glyph .dot{fill:var(--gold)}
  .step .nm{flex:1;min-width:0;font-family:"Saira Condensed",sans-serif;font-weight:700;
    font-size:19px;letter-spacing:.01em;outline:none;line-height:1.1;padding-top:5px}
  .step .nm:focus{color:#fff}
  .step .mins{flex:none;display:flex;align-items:center;gap:5px;
    font-family:"Spline Sans Mono",monospace;color:var(--chalk-dim);font-size:13px;padding-top:6px}
  .step .mins input{width:40px;background:var(--night);border:1px solid var(--line);
    color:var(--chalk);border-radius:7px;padding:5px;text-align:center;
    font-family:inherit;font-size:13px}
  .step .mins span{font-size:10px;text-transform:uppercase;letter-spacing:.08em}
  .step .del{flex:none;background:none;border:none;color:color-mix(in srgb,var(--chalk-dim) 50%,transparent);
    font-size:17px;line-height:1;cursor:pointer;padding:6px 2px 0;margin-left:2px;transition:color .15s}
  .step .del:hover{color:var(--flag)}

  /* assigned drill chips inside a step */
  .slot{margin:11px 0 2px 46px;display:flex;flex-wrap:wrap;gap:7px;min-height:30px}
  .slot.empty::before{
    content:"Drop drills here";font-family:"Spline Sans Mono",monospace;font-size:11px;
    letter-spacing:.08em;color:color-mix(in srgb,var(--chalk-dim) 55%,transparent);
    border:1px dashed var(--line);border-radius:8px;padding:6px 11px;
  }
  .pill{
    display:inline-flex;align-items:center;gap:7px;background:var(--turf-dim);
    border:1px solid color-mix(in srgb,var(--turf) 45%,transparent);
    color:var(--chalk);border-radius:100px;padding:6px 9px 6px 12px;font-size:13px;font-weight:500;
  }
  .pill button{background:none;border:none;color:var(--turf);font-size:15px;line-height:1;
    cursor:pointer;padding:0 1px;opacity:.8}
  .pill button:hover{opacity:1}

  /* ---------- drill bank (sheet) ---------- */
  .bank{
    position:fixed;left:0;right:0;bottom:0;z-index:40;
    background:linear-gradient(180deg,var(--night-2),#0b151c);
    border-top:1px solid var(--line);
    box-shadow:0 -16px 40px rgba(0,0,0,.5);
    padding:12px clamp(14px,4vw,28px) calc(14px + env(safe-area-inset-bottom));
    transform:translateY(calc(100% - 64px));transition:transform .35s cubic-bezier(.4,0,.2,1);
  }
  .bank.open{transform:translateY(0)}
  .bank-handle{display:flex;align-items:center;justify-content:space-between;cursor:pointer;height:40px}
  .bank-handle .lbl{font-family:"Saira Condensed",sans-serif;font-weight:700;font-size:18px;
    text-transform:uppercase;letter-spacing:.02em;display:flex;align-items:center;gap:9px}
  .bank-handle .lbl em{font-family:"Spline Sans Mono",monospace;font-style:normal;font-size:11px;
    color:var(--gold);background:var(--gold-dim);border-radius:100px;padding:2px 9px;font-weight:500}
  .bank-handle .chev{color:var(--chalk-dim);transition:transform .35s;font-size:13px}
  .bank.open .bank-handle .chev{transform:rotate(180deg)}
  .bank-handle .editToggle{font-family:"Spline Sans Mono",monospace;font-size:10px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--chalk-dim);background:none;border:1px solid var(--line);
    border-radius:100px;padding:4px 11px;cursor:pointer;margin-right:10px}
  .bank-handle .editToggle.on{color:var(--gold);border-color:var(--gold)}
  .bank-handle .right{display:flex;align-items:center}
  .bank-inner{max-height:46vh;overflow-y:auto;padding:6px 2px 10px;-webkit-overflow-scrolling:touch}
  .bank-search{width:100%;background:var(--night);border:1px solid var(--line);color:var(--chalk);
    border-radius:9px;padding:10px 12px;font-family:inherit;font-size:14px;margin:4px 0 12px}
  .bank-search::placeholder{color:color-mix(in srgb,var(--chalk-dim) 60%,transparent)}
  .cat{margin-bottom:14px}
  .cat h4{font-family:"Spline Sans Mono",monospace;font-size:10px;letter-spacing:.2em;
    text-transform:uppercase;color:var(--gold);margin-bottom:8px;display:flex;align-items:center;gap:8px}
  .cat h4 .cname{outline:none}
  .cat h4 .cname:focus{color:#fff;background:var(--gold-dim);border-radius:4px;padding:0 5px;margin:0 -5px}
  .cat h4 .ln{flex:1;height:1px;background:color-mix(in srgb,var(--gold) 22%,transparent)}
  .cat h4 .catdel{background:none;border:none;color:color-mix(in srgb,var(--gold) 55%,transparent);
    font-size:14px;line-height:1;cursor:pointer;padding:0 2px;font-family:inherit}
  .cat h4 .catdel:hover{color:var(--flag)}
  .chips{display:flex;flex-wrap:wrap;gap:7px}
  .chip{
    position:relative;background:var(--panel);border:1px solid var(--line);color:var(--chalk);
    border-radius:100px;padding:7px 13px;font-size:13px;font-weight:500;cursor:grab;
    transition:border-color .15s,background .15s,transform .08s;user-select:none;
    touch-action:manipulation;display:inline-flex;align-items:center;gap:7px;
  }
  .chip .cx{background:none;border:none;color:var(--chalk-dim);font-size:14px;line-height:1;
    cursor:pointer;padding:0;opacity:0;width:0;overflow:hidden;transition:opacity .15s,width .15s}
  .chip.editmode .cx{opacity:.7;width:14px}
  .chip.editmode{cursor:text;border-style:dashed}
  .chip .cx:hover{color:var(--flag);opacity:1}
  .chip:hover{border-color:var(--gold)}
  .chip:active{cursor:grabbing;transform:scale(.96)}
  .chip.used{opacity:.32;text-decoration:line-through}
  .addchip{display:flex;gap:8px;margin-top:6px}
  .addchip input{flex:1;background:var(--night);border:1px dashed var(--line);color:var(--chalk);
    border-radius:100px;padding:7px 14px;font-family:inherit;font-size:13px}
  .addchip button{background:var(--gold);color:#1a1405;border:none;border-radius:100px;
    padding:7px 15px;font-weight:700;font-size:13px;cursor:pointer;font-family:"Saira Condensed",sans-serif;
    letter-spacing:.04em;text-transform:uppercase}

  /* ---------- toolbar ---------- */
  .tools{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}
  .tbtn{font-family:"Saira Condensed",sans-serif;font-weight:700;font-size:14px;
    letter-spacing:.05em;text-transform:uppercase;border-radius:9px;padding:11px 16px;cursor:pointer;border:1px solid var(--line)}
  .tbtn.solid{background:var(--turf);color:#06140a;border-color:var(--turf)}
  .tbtn.ghost{background:none;color:var(--chalk-dim)}
  .tbtn.ghost:hover{color:var(--chalk);border-color:var(--chalk-dim)}

  /* drag clone */
  .ghost-clone{position:fixed;z-index:999;pointer-events:none;opacity:.95;
    box-shadow:0 14px 34px rgba(0,0,0,.6);transform:rotate(-2deg);margin:0}
  .saved-flash{position:fixed;left:50%;bottom:150px;transform:translateX(-50%);
    background:var(--turf);color:#06140a;font-family:"Spline Sans Mono",monospace;font-size:12px;
    padding:8px 16px;border-radius:100px;opacity:0;transition:opacity .3s;z-index:60;pointer-events:none;letter-spacing:.05em}
  .saved-flash.show{opacity:1}

  /* ---------- saved sessions ---------- */
  .sessions{display:flex;flex-direction:column;gap:10px;margin-bottom:6px}
  .sessions.empty::before{
    content:"No saved sessions yet — build a sequence above, then Save Session.";
    font-family:"Spline Sans Mono",monospace;font-size:12px;color:var(--chalk-dim);
    border:1px dashed var(--line);border-radius:10px;padding:14px;display:block;
  }
  .session-card{
    background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);
    padding:13px 14px;display:flex;align-items:center;gap:12px;
  }
  .session-card .info{flex:1;min-width:0}
  .session-card .nm{font-family:"Saira Condensed",sans-serif;font-weight:700;font-size:17px;
    text-transform:uppercase;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .session-card .meta{font-family:"Spline Sans Mono",monospace;font-size:11px;color:var(--chalk-dim);
    margin-top:3px;letter-spacing:.04em}
  .session-card .acts{display:flex;gap:6px;flex:none}
  .session-card .acts button{
    background:none;border:1px solid var(--line);color:var(--chalk-dim);border-radius:8px;
    padding:6px 10px;font-family:"Spline Sans Mono",monospace;font-size:10px;letter-spacing:.08em;
    text-transform:uppercase;cursor:pointer;
  }
  .session-card .acts button:hover{color:var(--chalk);border-color:var(--chalk-dim)}
  .session-card .acts button.load{color:var(--turf);border-color:color-mix(in srgb,var(--turf) 45%,transparent)}
  .session-card .acts button.del:hover{color:var(--flag);border-color:var(--flag)}

  /* ---------- modal (save session) ---------- */
  .modal{position:fixed;inset:0;z-index:90;background:rgba(6,12,16,.72);backdrop-filter:blur(3px);
    display:none;align-items:center;justify-content:center;padding:20px}
  .modal.open{display:flex}
  .modal-card{width:100%;max-width:420px;background:linear-gradient(180deg,var(--night-2),#0a141b);
    border:1px solid var(--line);border-radius:16px;padding:20px}
  .modal-card h3{font-family:"Saira Condensed",sans-serif;font-weight:700;font-size:19px;text-transform:uppercase}
  .modal-card p{color:var(--chalk-dim);font-size:12px;margin:6px 0 14px}
  .modal-card input{width:100%;background:var(--night);border:1px solid var(--line);color:var(--chalk);
    border-radius:9px;padding:11px 13px;font-family:inherit;font-size:15px;margin-bottom:16px}
  .modal-actions{display:flex;justify-content:flex-end;gap:10px}
  .modal-actions button{font-family:"Saira Condensed",sans-serif;font-weight:700;font-size:13px;
    letter-spacing:.05em;text-transform:uppercase;border-radius:9px;padding:9px 16px;cursor:pointer;
    border:1px solid var(--line);background:none;color:var(--chalk-dim)}
  .modal-actions button.primary{background:var(--turf);color:#06140a;border-color:var(--turf)}

  footer{margin-top:30px;font-family:"Spline Sans Mono",monospace;font-size:10px;
    letter-spacing:.1em;color:color-mix(in srgb,var(--chalk-dim) 50%,transparent)}

  /* ---------- naming helper ---------- */
  .name-btn{background:none;border:none;color:var(--gold);font-family:"Spline Sans Mono",monospace;
    font-size:10px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;padding:0 0 0 4px;opacity:.75}
  .name-btn:hover{opacity:1}
  .pill .name-btn{padding-left:2px}
  .helper{position:fixed;inset:0;z-index:80;background:rgba(6,12,16,.72);
    backdrop-filter:blur(3px);display:none;align-items:flex-end;justify-content:center}
  .helper.open{display:flex}
  .helper-card{width:100%;max-width:560px;height:min(82vh,720px);background:linear-gradient(180deg,var(--night-2),#0a141b);
    border:1px solid var(--line);border-bottom:none;border-radius:18px 18px 0 0;display:flex;flex-direction:column;overflow:hidden}
  .helper-head{display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:16px 18px;border-bottom:1px solid var(--line)}
  .helper-head .ttl{font-family:"Saira Condensed",sans-serif;font-weight:700;font-size:19px;text-transform:uppercase;letter-spacing:.02em}
  .helper-head .ttl small{display:block;font-family:"Spline Sans Mono",monospace;font-size:10px;
    letter-spacing:.14em;color:var(--gold);text-transform:none;font-weight:400;margin-top:2px}
  .helper-head .close{background:none;border:none;color:var(--chalk-dim);font-size:22px;cursor:pointer;line-height:1}
  .helper-body{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:12px;-webkit-overflow-scrolling:touch}
  .msg{max-width:85%;padding:11px 14px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap}
  .msg.a{align-self:flex-start;background:var(--panel);border:1px solid var(--line);border-bottom-left-radius:4px}
  .msg.u{align-self:flex-end;background:var(--turf-dim);border:1px solid color-mix(in srgb,var(--turf) 40%,transparent);border-bottom-right-radius:4px}
  .msg.think{align-self:flex-start;color:var(--chalk-dim);font-style:italic;font-size:13px}
  .lockbar{padding:10px 18px;border-top:1px solid var(--line);display:none;align-items:center;gap:10px;background:var(--gold-dim)}
  .lockbar.show{display:flex}
  .lockbar .nm{flex:1;font-family:"Saira Condensed",sans-serif;font-weight:700;font-size:18px;color:var(--gold)}
  .lockbar button{background:var(--gold);color:#1a1405;border:none;border-radius:8px;padding:9px 16px;
    font-family:"Saira Condensed",sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;font-size:14px}
  .helper-input{display:flex;gap:9px;padding:14px 18px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--line)}
  .helper-input textarea{flex:1;background:var(--night);border:1px solid var(--line);color:var(--chalk);
    border-radius:11px;padding:11px 13px;font-family:inherit;font-size:15px;resize:none;max-height:120px;line-height:1.4}
  .helper-input button{flex:none;background:var(--turf);color:#06140a;border:none;border-radius:11px;
    padding:0 18px;font-family:"Saira Condensed",sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;cursor:pointer}
  .helper-input button:disabled{opacity:.4;cursor:default}

  /* ---------- print: wall sheet ---------- */
  @media print{
    @page{margin:14mm}
    body{background:#fff;color:#000;padding:0}
    .clock .rail,.bank,.tools,.draft,.lede,.glyph .stem,.section-h .ln{}
    .bank,.tools,.draft,.sessions,.section-h:has(+ .sessions),.modal{display:none!important}
    .step{border:1px solid #000;break-inside:avoid}
    .step::before{background:#000}
    .glyph .stem{stroke:#000}.glyph .dot{fill:#000}
    .pill{background:#fff;border:1px solid #000;color:#000}
    .pill button{display:none}
    h1,.eyebrow,.cat h4{color:#000}
    .clock{border:1px solid #000;background:#fff}
    .step .mins input{border:none;background:none;color:#000;font-weight:700}
  }
  @media (prefers-reduced-motion:reduce){
    *{animation:none!important;transition:none!important}
  }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="eyebrow">Hodge Performance · WR System</div>
    <h1>Drill<span class="l2">Builder</span></h1>
    <p class="lede">Your sequence runs down the page. Pull drills up from the bank into any step. Rename, re-order, set the minutes — it's all yours to move. This is the working draft.</p>
    <span class="draft"><i></i>Draft — you direct the changes</span>
  </header>

  <div class="clock">
    <div class="clock-top">
      <div class="big" id="big">60<small>min</small></div>
      <div class="state"><b id="stateLabel">1-hour core</b><span id="stateSub">spine only</span></div>
    </div>
    <div class="rail"><i id="railFill"></i><div class="yardlines"><span></span><span></span></div></div>
  </div>

  <div class="section-h">Session Sequence<span class="ln"></span></div>
  <div class="spine" id="spine"></div>

  <div class="tools">
    <button class="tbtn solid" id="saveSessionBtn">Save Session</button>
    <button class="tbtn ghost" onclick="window.print()">Print wall sheet</button>
    <button class="tbtn ghost" id="addStep">Add step</button>
    <button class="tbtn ghost" id="reset">Reset draft</button>
  </div>

  <div class="section-h">Saved Sessions<span class="ln"></span></div>
  <div class="sessions" id="sessions"></div>

  <footer>LMW LABS · HODGE PERFORMANCE · WORKING DRAFT</footer>
</div>

<!-- SAVE SESSION MODAL -->
<div class="modal" id="saveModal">
  <div class="modal-card">
    <h3>Save Session</h3>
    <p>Name this sequence so you can pull it back up — or share it — later.</p>
    <input id="saveNameInput" placeholder="e.g. 60-Min Core" maxlength="60">
    <div class="modal-actions">
      <button id="saveCancelBtn">Cancel</button>
      <button class="primary" id="saveConfirmBtn">Save</button>
    </div>
  </div>
</div>

<!-- DRILL BANK -->
<div class="bank" id="bank">
  <div class="bank-handle" id="bankHandle">
    <span class="lbl">Drill Bank <em id="bankCount">0</em></span>
    <span class="right"><button class="editToggle" id="editToggle">Edit</button><span class="chev">▲ tap</span></span>
  </div>
  <input class="bank-search" id="search" placeholder="Search drills…" aria-label="Search drills">
  <div class="bank-inner" id="bankInner"></div>
</div>

<div class="saved-flash" id="flash">saved</div>

<!-- NAMING HELPER -->
<div class="helper" id="helper">
  <div class="helper-card">
    <div class="helper-head">
      <div class="ttl">Name It<small id="helperSub">drill naming helper</small></div>
      <button class="close" id="helperClose" aria-label="Close">×</button>
    </div>
    <div class="helper-body" id="helperBody"></div>
    <div class="lockbar" id="lockbar">
      <span class="nm" id="lockName"></span>
      <button id="lockBtn">Lock this name</button>
    </div>
    <div class="helper-input">
      <textarea id="helperText" rows="1" placeholder="Talk it through…" aria-label="Your message"></textarea>
      <button id="helperSend">Send</button>
    </div>
  </div>
</div>

<script>
"use strict";

/* ===== route-stem glyphs (the visual signature) ===== */
const GLYPHS=[
  '<svg viewBox="0 0 40 40"><path class="stem" d="M20 36 L20 8"/><circle class="dot" cx="20" cy="6" r="3"/></svg>',          // go / vertical
  '<svg viewBox="0 0 40 40"><path class="stem" d="M20 36 L20 18 L34 18"/><circle class="dot" cx="36" cy="18" r="3"/></svg>',   // out
  '<svg viewBox="0 0 40 40"><path class="stem" d="M20 36 L20 18 L8 8"/><circle class="dot" cx="6" cy="6" r="3"/></svg>',       // post / slant
  '<svg viewBox="0 0 40 40"><path class="stem" d="M20 36 L20 20 L32 8"/><circle class="dot" cx="34" cy="6" r="3"/></svg>',     // corner
  '<svg viewBox="0 0 40 40"><path class="stem" d="M20 36 L20 16 Q20 10 14 12"/><circle class="dot" cx="12" cy="12" r="3"/></svg>', // curl/hitch
  '<svg viewBox="0 0 40 40"><path class="stem" d="M20 36 L20 22 L30 22 L30 12"/><circle class="dot" cx="30" cy="10" r="3"/></svg>', // out-up
  '<svg viewBox="0 0 40 40"><path class="stem" d="M12 34 L20 22 L12 14 L20 6"/><circle class="dot" cx="22" cy="5" r="3"/></svg>',  // stutter/zig
];
function glyph(i){return GLYPHS[i%GLYPHS.length];}

/* ===== DRAFT: spine + his drill bank (verbatim from pages 51-55) ===== */
const DRAFT={
  spine:[
    {name:"Activation", min:5, drills:[]},
    {name:"Dynamic Warm-Up", min:10, drills:[]},
    {name:"Stance and Start / Release", min:5, drills:[]},
    {name:"Fundamental Footwork or Speed Mechanics", min:10, drills:[]},
    {name:"Footwork + Type of Catch", min:10, drills:[]},
    {name:"Footwork Cadence", min:10, drills:[]},
    {name:"Top of Route into Full Route", min:10, drills:[]},
  ],
  bank:{
    "Stance & Start":[
      "Regular stance and start","Power chute + small hurdle starts","SL leg starts",
      "Hurdle over front foot starts","Tennis ball drops start"
    ],
    "Releases":[
      "Speed release (get skinny)","Come to balance","Basketball release","One step release",
      "Two step release","Slide release","Dart release","Shed release","Release, stack, shed","Hold line release"
    ],
    "Hand Fighting":[
      "Blaze","Come to balance","Dip & rip","Near hand swipe","Shed",
      "Hand on hip: swipe-push","Hand on shoulder: swat-stiff","Hands on in breaking route: swing-push back hip"
    ],
    "Catches":[
      "Stationary w/ arm drive","Seated w/ arm drive","Kneeling w/ arm drive","Contested: catch + hit w/ bag",
      "Route + tail bag catch","Hands around pole","Hands around tall dummy","Plate taps catches","Ladder drill catches",
      "Lateral figure 8 coming forward","Vertical cones hips turn","Hexagon hips","Staggered foot fire catches",
      "Lateral hips to spinning hips","Over shoulder track","Over top of head","React off tennis ball",
      "Tennis ball drop catches","Tennis ball clap catches"
    ],
    "Ball Drills":[
      "Back shoulder","Jump ball","Catches away from your body","Traffic catches","Reaction catch","Very poorly thrown ball catches"
    ],
    "Hips":[
      "Vertical cones + hot feet + twisting hips","Lateral hip turns","Lateral + forward hip turns",
      "Lateral + forward + twist in circle","Hexagon + step back + hips around + run + catch"
    ],
    "Top of Route":[
      "Throw by @ top of route (curl)","Use line throw by (Harvey)","Shoulder grab throw by (slingshot)",
      "Space release (2 step)","Nod technique","Set step (digs/outs)","Hurdle knee over to set step",
      "Quick 3 shoulders down (curl)","Quick 3 + burst (dig)"
    ],
    "Footwork / Cadence":[
      "Ring a stick","Cone pick up","B stick drill","Foot fire ring drill","Ladder drill",
      "2 lateral cones figure 8","Hexagon 2 feet in 2 feet out","Hexagon ickey","Mini hurdle lateral step overs"
    ],
    "Blocking":[
      "Base blocking","3 way blocking","Mirror drill - close distance","Mirror drill","Push crack"
    ],
    "Routes (prep)":[
      "Hitch","Slant","Sluggo","Lucy (option)","Glance","Quick speed out","Quick square out","6 step out",
      "Curl","Comeback","Basic","Deep In (speed cut dig)","Bender","Deep over","Comet","Corner","Bite",
      "Corner pump","Post","Go route","Hinge","Stutter","Slot fade","Falcon (pick fade)","Whip","Drag","Slant whip"
    ]
  }
};

/* ===== state ===== */
let canSave=true;
function clone(o){return JSON.parse(JSON.stringify(o));}
function load(){
  try{const s=localStorage.getItem('hp_drill_v1');if(s){const p=JSON.parse(s);
    if(p&&Array.isArray(p.spine)&&p.bank)return p;}}catch(e){}
  return clone(DRAFT);
}
function save(){if(!canSave)return;try{localStorage.setItem('hp_drill_v1',JSON.stringify(state));flash();}catch(e){canSave=false;}}
let state=load();
let editMode=false;

const spineEl=document.getElementById('spine');
const bankInner=document.getElementById('bankInner');

/* ===== render spine ===== */
function renderSpine(){
 try{
  spineEl.innerHTML='';
  state.spine.forEach((s,i)=>{
    const step=document.createElement('div');
    step.className='step';step.dataset.i=i;

    const top=document.createElement('div');top.className='step-top';
    const g=document.createElement('div');g.className='glyph';g.innerHTML=glyph(i);
    const nm=document.createElement('div');nm.className='nm';nm.contentEditable='true';nm.spellcheck=false;nm.textContent=s.name||'';
    nm.addEventListener('input',()=>{state.spine[i].name=nm.textContent;save();});
    const mins=document.createElement('div');mins.className='mins';
    const inp=document.createElement('input');inp.type='number';inp.min='0';inp.value=(s.min!=null?s.min:0);inp.setAttribute('aria-label','minutes');
    inp.addEventListener('input',()=>{state.spine[i].min=+inp.value||0;updateClock();save();});
    const ms=document.createElement('span');ms.textContent='min';
    mins.appendChild(inp);mins.appendChild(ms);
    const del=document.createElement('button');del.className='del';del.setAttribute('aria-label','Delete step');del.textContent='\\u2715';
    del.addEventListener('click',()=>{
      if(confirm('Delete step "'+(s.name||'')+'"? Its drills go back to the bank.')){
        state.spine.splice(i,1);renderSpine();renderBank();save();
      }
    });
    top.appendChild(g);top.appendChild(nm);top.appendChild(mins);top.appendChild(del);

    const slot=document.createElement('div');
    slot.className='slot'+((s.drills&&s.drills.length)?'':' empty');
    slot.dataset.i=i;
    (s.drills||[]).forEach((d,di)=>{
      const pill=document.createElement('span');pill.className='pill';
      const t=document.createElement('span');t.textContent=d;
      const x=document.createElement('button');x.setAttribute('aria-label','Remove drill');x.textContent='×';
      x.addEventListener('click',()=>{state.spine[i].drills.splice(di,1);renderSpine();renderBank();save();});
      pill.appendChild(t);pill.appendChild(x);slot.appendChild(pill);
    });

    step.appendChild(top);step.appendChild(slot);
    spineEl.appendChild(step);
  });
  updateClock();
 }catch(err){
  spineEl.innerHTML='<div style="border:1px solid #c2533a;border-radius:12px;padding:14px;font-size:13px">'+
    'Display hiccup — open in Safari or Chrome (not inside a chat app). Your sequence: '+
    state.spine.map((s,i)=>(i+1)+'. '+s.name).join('  ')+'</div>';
 }
}

/* ===== render bank ===== */
let allChips=[];
function renderBank(){
  bankInner.innerHTML='';
  allChips=[];
  const used=new Set();
  state.spine.forEach(s=>(s.drills||[]).forEach(d=>used.add(d)));
  const q=(document.getElementById('search').value||'').toLowerCase().trim();
  let count=0;
  Object.keys(state.bank).forEach(cat=>{
    const items=state.bank[cat].filter(d=>!q||d.toLowerCase().includes(q));
    if(!items.length && q)return; // hide empty cats only while searching
    const wrap=document.createElement('div');wrap.className='cat';
    const h=document.createElement('h4');
    const cname=document.createElement('span');cname.className='cname';cname.textContent=cat;
    if(editMode){
      cname.contentEditable='true';cname.spellcheck=false;
      cname.addEventListener('blur',()=>{
        const nv=cname.textContent.trim();
        if(nv && nv!==cat && !state.bank[nv]){
          state.bank[nv]=state.bank[cat];delete state.bank[cat];
          // repoint any assigned drills? names unchanged, so fine
          renderBank();save();
        } else if(!nv){ cname.textContent=cat; }
      });
      cname.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();cname.blur();}});
    }
    const ln=document.createElement('span');ln.className='ln';
    h.appendChild(cname);h.appendChild(ln);
    if(editMode){
      const cd=document.createElement('button');cd.className='catdel';cd.textContent='delete';
      cd.addEventListener('click',()=>{
        if(confirm('Delete the entire "'+cat+'" category and all its drills?')){
          delete state.bank[cat];renderBank();save();
        }
      });
      h.appendChild(cd);
    }
    wrap.appendChild(h);
    const chips=document.createElement('div');chips.className='chips';
    items.forEach(d=>{
      const c=document.createElement('div');c.className='chip'+(used.has(d)?' used':'')+(editMode?' editmode':'');
      c.dataset.drill=d;
      const label=document.createElement('span');label.textContent=d;
      if(editMode){
        label.contentEditable='true';label.spellcheck=false;label.style.outline='none';
        label.addEventListener('blur',()=>{
          const nv=label.textContent.trim();
          if(nv && nv!==d){
            const arr=state.bank[cat];const idx=arr.indexOf(d);if(idx>-1)arr[idx]=nv;
            // update any assigned copies on the spine too
            state.spine.forEach(st=>{if(st.drills){const j=st.drills.indexOf(d);if(j>-1)st.drills[j]=nv;}});
            renderSpine();renderBank();save();
          } else if(!nv){ label.textContent=d; }
        });
        label.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();label.blur();}});
      }
      c.appendChild(label);
      if(editMode){
        const cx=document.createElement('button');cx.className='cx';cx.setAttribute('aria-label','Delete drill');cx.textContent='\\u2715';
        cx.addEventListener('click',()=>{
          const arr=state.bank[cat];const idx=arr.indexOf(d);if(idx>-1)arr.splice(idx,1);
          state.spine.forEach(st=>{if(st.drills){const j=st.drills.indexOf(d);if(j>-1)st.drills.splice(j,1);}});
          renderSpine();renderBank();save();
        });
        c.appendChild(cx);
      } else {
        const nb=document.createElement('button');nb.className='name-btn';nb.textContent='name';
        nb.addEventListener('click',ev=>{ev.stopPropagation();openHelper(cat,d);});
        c.appendChild(nb);
        chipDrag(c,d);
      }
      chips.appendChild(c);allChips.push(c);count++;
    });
    wrap.appendChild(chips);
    // add-your-own for this category
    const add=document.createElement('div');add.className='addchip';
    const ai=document.createElement('input');ai.placeholder='Add to '+cat+'…';
    const ab=document.createElement('button');ab.textContent='Add';
    const doAdd=()=>{const v=ai.value.trim();if(!v)return;state.bank[cat].push(v);ai.value='';renderBank();save();};
    ab.addEventListener('click',doAdd);
    ai.addEventListener('keydown',e=>{if(e.key==='Enter')doAdd();});
    add.appendChild(ai);add.appendChild(ab);wrap.appendChild(add);
    bankInner.appendChild(wrap);
  });
  if(editMode){
    const addcat=document.createElement('div');addcat.className='addchip';addcat.style.marginTop='4px';
    const ci=document.createElement('input');ci.placeholder='New category name…';
    const cb=document.createElement('button');cb.textContent='Add Category';
    const doAddCat=()=>{const v=ci.value.trim();if(!v||state.bank[v])return;state.bank[v]=[];ci.value='';renderBank();save();};
    cb.addEventListener('click',doAddCat);
    ci.addEventListener('keydown',e=>{if(e.key==='Enter')doAddCat();});
    addcat.appendChild(ci);addcat.appendChild(cb);bankInner.appendChild(addcat);
  }
  document.getElementById('bankCount').textContent=count;
}
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

/* ===== drop a drill onto a step ===== */
function assign(drill,stepIndex){
  if(stepIndex==null||!state.spine[stepIndex])return;
  const arr=state.spine[stepIndex].drills||(state.spine[stepIndex].drills=[]);
  if(!arr.includes(drill))arr.push(drill);
  renderSpine();renderBank();save();
}

/* ===== chip drag: mouse + touch ===== */
function chipDrag(chip,drill){
  // desktop
  chip.draggable=true;
  chip.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',drill);e.dataTransfer.effectAllowed='copy';});
  // touch
  let hold=null,lifted=false,gclone=null,sx=0,sy=0;
  chip.addEventListener('touchstart',e=>{
    const t=e.touches[0];sx=t.clientX;sy=t.clientY;
    hold=setTimeout(()=>{
      lifted=true;
      const r=chip.getBoundingClientRect();
      gclone=chip.cloneNode(true);gclone.classList.add('ghost-clone');
      gclone.style.left=r.left+'px';gclone.style.top=r.top+'px';gclone.style.width=r.width+'px';
      gclone.dataset.ox=(sx-r.left);gclone.dataset.oy=(sy-r.top);
      document.body.appendChild(gclone);
      if(navigator.vibrate)navigator.vibrate(12);
      closeBankSoft();
    },200);
  },{passive:true});
  chip.addEventListener('touchmove',e=>{
    if(!lifted){const t=e.touches[0];if(Math.abs(t.clientX-sx)>8||Math.abs(t.clientY-sy)>8)clearTimeout(hold);return;}
    e.preventDefault();
    const t=e.touches[0];
    gclone.style.left=(t.clientX-(+gclone.dataset.ox))+'px';
    gclone.style.top=(t.clientY-(+gclone.dataset.oy))+'px';
    armStep(document.elementFromPoint(t.clientX,t.clientY));
    autoScroll(t.clientY);
  },{passive:false});
  chip.addEventListener('touchend',e=>{
    clearTimeout(hold);
    if(!lifted)return;
    const t=e.changedTouches[0];
    const el=document.elementFromPoint(t.clientX,t.clientY);
    const step=el&&el.closest('.step');
    if(gclone){gclone.remove();gclone=null;}
    clearArmed();
    if(step)assign(drill,+step.dataset.i);
    lifted=false;
  });
  chip.addEventListener('touchcancel',()=>{clearTimeout(hold);if(gclone){gclone.remove();gclone=null;}clearArmed();lifted=false;});
}
function armStep(el){clearArmed();const s=el&&el.closest('.step');if(s)s.classList.add('drop-armed');}
function clearArmed(){document.querySelectorAll('.drop-armed').forEach(s=>s.classList.remove('drop-armed'));}
function autoScroll(y){const m=90;if(y<m)window.scrollBy(0,-14);else if(y>window.innerHeight-m)window.scrollBy(0,14);}

/* desktop drop targets on steps */
spineEl.addEventListener('dragover',e=>{const s=e.target.closest('.step');if(s){e.preventDefault();clearArmed();s.classList.add('drop-armed');}});
spineEl.addEventListener('dragleave',e=>{const s=e.target.closest('.step');if(s)s.classList.remove('drop-armed');});
spineEl.addEventListener('drop',e=>{const s=e.target.closest('.step');if(s){e.preventDefault();s.classList.remove('drop-armed');assign(e.dataTransfer.getData('text/plain'),+s.dataset.i);}});

/* ===== clock ===== */
function updateClock(){
  const total=state.spine.reduce((a,s)=>a+(+s.min||0),0);
  document.getElementById('big').innerHTML=total+'<small>min</small>';
  document.getElementById('railFill').style.right=Math.max(0,100-(total/120*100))+'%';
  const L=document.getElementById('stateLabel'),S=document.getElementById('stateSub');
  L.classList.remove('over');
  if(total<=60){L.textContent='1-hour core';S.textContent='spine only';}
  else if(total<=90){L.textContent='90-min build';S.textContent='+ 1–2 modules';}
  else if(total<=120){L.textContent='full session';S.textContent='+ 3 modules';}
  else{L.textContent=(total-120)+' over';L.classList.add('over');S.textContent='trim a step';}
}

/* ===== edit mode toggle ===== */
const bank=document.getElementById('bank');
document.getElementById('editToggle').addEventListener('click',e=>{
  e.stopPropagation();
  editMode=!editMode;
  e.target.classList.toggle('on',editMode);
  e.target.textContent=editMode?'Done':'Edit';
  if(editMode && !bank.classList.contains('open'))bank.classList.add('open');
  renderBank();
});
document.getElementById('bankHandle').addEventListener('click',()=>bank.classList.toggle('open'));
function closeBankSoft(){bank.classList.remove('open');}
document.getElementById('search').addEventListener('input',()=>{renderBank();if(!bank.classList.contains('open'))bank.classList.add('open');});

/* ===== buttons ===== */
document.getElementById('addStep').addEventListener('click',()=>{
  state.spine.push({name:'New step',min:5,drills:[]});renderSpine();save();
  window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
});
document.getElementById('reset').addEventListener('click',()=>{
  state=clone(DRAFT);renderSpine();renderBank();save();
});

/* ===== saved flash ===== */
let flashT=null;
function flash(msg){const f=document.getElementById('flash');f.textContent=msg||'saved';f.classList.add('show');clearTimeout(flashT);flashT=setTimeout(()=>f.classList.remove('show'),1400);}

/* ===== saved sessions (named, saveable, shareable snapshots of a sequence) ===== */
function loadSessions(){
  try{const s=localStorage.getItem('hp_sessions_v1');if(s){const p=JSON.parse(s);if(Array.isArray(p))return p;}}catch(e){}
  return [];
}
function saveSessionsList(){try{localStorage.setItem('hp_sessions_v1',JSON.stringify(sessions));}catch(e){}}
let sessions=loadSessions();
function sessionMinutes(spine){return (spine||[]).reduce((a,s)=>a+(+s.min||0),0);}

/* url-safe base64 of a session payload, for the Share link */
function encodeSession(obj){
  const bytes=new TextEncoder().encode(JSON.stringify(obj));
  let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));
  return btoa(bin).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
}
function decodeSession(str){
  try{
    const bin=atob(str.replace(/-/g,'+').replace(/_/g,'/'));
    const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }catch(e){return null;}
}
function shareUrl(sess){return location.origin+location.pathname+'#s='+encodeSession({name:sess.name,spine:sess.spine});}
function copyShareLink(sess){
  const url=shareUrl(sess);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>flash('link copied')).catch(()=>window.prompt('Copy this link to share the session:',url));
  }else{
    window.prompt('Copy this link to share the session:',url);
  }
}

function renderSessions(){
  const el=document.getElementById('sessions');
  el.innerHTML='';
  el.classList.toggle('empty',sessions.length===0);
  sessions.forEach((sess,i)=>{
    const card=document.createElement('div');card.className='session-card';
    const info=document.createElement('div');info.className='info';
    const nm=document.createElement('div');nm.className='nm';nm.textContent=sess.name;
    const meta=document.createElement('div');meta.className='meta';
    const d=new Date(sess.savedAt);
    meta.textContent=sessionMinutes(sess.spine)+' min · saved '+(isNaN(d)?'':d.toLocaleDateString(undefined,{month:'short',day:'numeric'}));
    info.appendChild(nm);info.appendChild(meta);

    const acts=document.createElement('div');acts.className='acts';
    const loadBtn=document.createElement('button');loadBtn.className='load';loadBtn.textContent='Load';
    loadBtn.addEventListener('click',()=>{
      const hasWork=state.spine.some(s=>(s.drills&&s.drills.length));
      if(hasWork&&!confirm('Load "'+sess.name+'"? This replaces your current working sequence (saved sessions are unaffected — save first if you want to keep it).'))return;
      state.spine=clone(sess.spine);renderSpine();save();
      window.scrollTo({top:0,behavior:'smooth'});
    });
    const shareBtn=document.createElement('button');shareBtn.textContent='Share';
    shareBtn.addEventListener('click',()=>copyShareLink(sess));
    const printBtn=document.createElement('button');printBtn.textContent='Print';
    printBtn.addEventListener('click',()=>{
      const prevSpine=clone(state.spine);
      state.spine=clone(sess.spine);renderSpine();
      setTimeout(()=>{window.print();state.spine=prevSpine;renderSpine();},50);
    });
    const delBtn=document.createElement('button');delBtn.className='del';delBtn.textContent='Delete';
    delBtn.addEventListener('click',()=>{
      if(confirm('Delete saved session "'+sess.name+'"? This can\\'t be undone.')){
        sessions.splice(i,1);saveSessionsList();renderSessions();
      }
    });
    acts.appendChild(loadBtn);acts.appendChild(shareBtn);acts.appendChild(printBtn);acts.appendChild(delBtn);
    card.appendChild(info);card.appendChild(acts);
    el.appendChild(card);
  });
}

/* ===== save-session modal ===== */
const saveModal=document.getElementById('saveModal');
const saveNameInput=document.getElementById('saveNameInput');
document.getElementById('saveSessionBtn').addEventListener('click',()=>{
  const total=state.spine.reduce((a,s)=>a+(+s.min||0),0);
  saveNameInput.value=total+' Min Session';
  saveModal.classList.add('open');
  setTimeout(()=>{saveNameInput.focus();saveNameInput.select();},50);
});
document.getElementById('saveCancelBtn').addEventListener('click',()=>saveModal.classList.remove('open'));
saveModal.addEventListener('click',e=>{if(e.target===saveModal)saveModal.classList.remove('open');});
function confirmSaveSession(){
  const name=saveNameInput.value.trim();
  if(!name)return;
  sessions.unshift({id:Date.now()+'-'+Math.random().toString(36).slice(2,8),name,savedAt:new Date().toISOString(),spine:clone(state.spine)});
  saveSessionsList();renderSessions();
  saveModal.classList.remove('open');
  state.spine=clone(DRAFT.spine);renderSpine();save();
  flash('session saved');
  window.scrollTo({top:0,behavior:'smooth'});
}
document.getElementById('saveConfirmBtn').addEventListener('click',confirmSaveSession);
saveNameInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();confirmSaveSession();}});

/* ===== import a session from a shared link (#s=...) ===== */
function checkSharedImport(){
  const m=location.hash.match(/#s=([^&]+)/);
  if(!m)return;
  history.replaceState(null,'',location.pathname+location.search);
  const payload=decodeSession(decodeURIComponent(m[1]));
  if(!payload||!Array.isArray(payload.spine))return;
  const name=payload.name||'Shared Session';
  if(confirm('Import shared session "'+name+'" into your saved sessions?')){
    sessions.unshift({id:Date.now()+'-'+Math.random().toString(36).slice(2,8),name,savedAt:new Date().toISOString(),spine:clone(payload.spine)});
    saveSessionsList();renderSessions();
    flash('session imported');
  }
}

/* ===== chalk-draw intro on glyphs ===== */
function chalkDraw(){
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  document.querySelectorAll('.glyph .stem').forEach((p,i)=>{
    try{const len=p.getTotalLength();p.style.strokeDasharray=len;p.style.strokeDashoffset=len;
      p.style.transition='stroke-dashoffset .7s ease '+(i*0.08)+'s';
      requestAnimationFrame(()=>requestAnimationFrame(()=>{p.style.strokeDashoffset=0;}));}catch(e){}
  });
}

/* ===== naming helper ===== */
const helper=document.getElementById('helper');
const helperBody=document.getElementById('helperBody');
const helperText=document.getElementById('helperText');
const helperSend=document.getElementById('helperSend');
const lockbar=document.getElementById('lockbar');
const lockName=document.getElementById('lockName');
let convo=[];            // {role, content}
let activeCat=null, activeDrill=null, proposedName=null;

function knownPatterns(){
  // give the model his existing vocabulary so it stays consistent with him
  const names=[];
  Object.values(state.bank).forEach(arr=>arr.forEach(d=>{ if(d.split(' ').length<=2) names.push(d); }));
  return 'His existing short drill/route names (stay consistent with this vernacular): '+
    Array.from(new Set(names)).slice(0,60).join(', ');
}

function openHelper(cat,drill){
  activeCat=cat;activeDrill=drill;proposedName=null;
  convo=[];helperBody.innerHTML='';lockbar.classList.remove('show');
  document.getElementById('helperSub').textContent='naming: '+drill;
  helper.classList.add('open');
  // seed first assistant turn
  const seed='The drill on the table is: "'+drill+'" (currently in the "'+cat+'" group). Help me name it.';
  pushMsg('u',seed,true); // show as context but styled as user kickoff
  send(seed,true);
  setTimeout(()=>helperText.focus(),200);
}
function closeHelper(){helper.classList.remove('open');}
document.getElementById('helperClose').addEventListener('click',closeHelper);
helper.addEventListener('click',e=>{if(e.target===helper)closeHelper();});

function pushMsg(role,text,hideKickoff){
  if(!(hideKickoff&&role==='u'&&convo.length===0)){
    const m=document.createElement('div');m.className='msg '+(role==='assistant'?'a':'u');
    m.textContent=text;helperBody.appendChild(m);
    helperBody.scrollTop=helperBody.scrollHeight;
  }
}
function thinking(on){
  let t=document.getElementById('thinkMsg');
  if(on&&!t){t=document.createElement('div');t.id='thinkMsg';t.className='msg think';t.textContent='thinking…';
    helperBody.appendChild(t);helperBody.scrollTop=helperBody.scrollHeight;}
  if(!on&&t)t.remove();
}

async function send(userText,isSeed){
  if(!isSeed){pushMsg('u',userText);}
  convo.push({role:'user',content:userText});
  helperSend.disabled=true;thinking(true);
  try{
    const res=await fetch('/api/name',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:convo,drillContext:'Drill being named: "'+activeDrill+'" in group "'+activeCat+'". '+knownPatterns()})
    });
    const data=await res.json();
    thinking(false);
    if(data.error){pushMsg('assistant','(Helper offline: '+(data.error)+') You can still type a name and lock it.');helperSend.disabled=false;return;}
    let text=data.text||'';
    // capture NAME: line
    const m=text.match(/NAME:\\s*(.+)\\s*$/m);
    if(m){proposedName=m[1].trim().replace(/^["']|["']$/g,'');text=text.replace(/NAME:\\s*.+\\s*$/m,'').trim();
      lockName.textContent='“'+proposedName+'”';lockbar.classList.add('show');}
    if(text)pushMsg('assistant',text);
    convo.push({role:'assistant',content:data.text||text});
  }catch(e){
    thinking(false);
    pushMsg('assistant','(Couldn\\u2019t reach the helper. Check connection — you can still type a name and lock it.)');
  }
  helperSend.disabled=false;
}

helperSend.addEventListener('click',()=>{
  const v=helperText.value.trim();if(!v)return;helperText.value='';helperText.style.height='auto';send(v);
});
helperText.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();helperSend.click();}
});
helperText.addEventListener('input',()=>{helperText.style.height='auto';helperText.style.height=Math.min(120,helperText.scrollHeight)+'px';});

document.getElementById('lockBtn').addEventListener('click',()=>{
  const newName=proposedName||lockName.textContent.replace(/[“”"]/g,'').trim();
  if(!newName||!activeCat||!activeDrill)return;
  const arr=state.bank[activeCat];const idx=arr.indexOf(activeDrill);
  if(idx>-1)arr[idx]=newName;
  state.spine.forEach(st=>{if(st.drills){const j=st.drills.indexOf(activeDrill);if(j>-1)st.drills[j]=newName;}});
  renderSpine();renderBank();save();
  closeHelper();
});

/* ===== boot ===== */
renderSpine();renderBank();renderSessions();chalkDraw();checkSharedImport();
</script>
</body>
</html>`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (pathname === "/api/name" && request.method === "POST") {
      return apiName(request, env);
    }

    return new Response(HTML, {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  },
};

async function apiName(request, env) {
  const h = { ...CORS_HEADERS, "Content-Type": "application/json" };

  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Server not configured: missing API key." }),
      { status: 500, headers: h }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad request." }), { status: 400, headers: h });
  }

  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages) {
    return new Response(JSON.stringify({ error: "Missing messages." }), { status: 400, headers: h });
  }

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
        messages,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(
        JSON.stringify({ error: "Upstream error", detail: t.slice(0, 500) }),
        { status: 502, headers: h }
      );
    }

    const data = await r.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return new Response(JSON.stringify({ text }), { status: 200, headers: h });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Request failed.", detail: String(e).slice(0, 300) }),
      { status: 500, headers: h }
    );
  }
}
