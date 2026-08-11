ORBIT AI — SYSTEM MANUAL
Last updated: 11 August 2026

A reference for where everything lives and what is stored where.
No secret values are written down here — only the names of secrets and the
place you go to read them.


================================================================================
1. THE FOUR PLACES THINGS LIVE
================================================================================

Orbit is spread across four services. Nothing else is involved.

  GITHUB        The source code.
                github.com/yuvaan125/browser-assistant
                Branch: main

  RENDER        The backend server (the API the extension talks to).
                Service name: orbit-backend
                Live URL: https://orbit-backend-dlnp.onrender.com
                Deploys automatically when you push to main.

  SUPABASE      The database and the user accounts.
                Project: nptjipbzgcstzwbytcpu
                https://nptjipbzgcstzwbytcpu.supabase.co

  GOOGLE CLOUD  The OAuth client that powers "Continue with Google".
                Client ID starts with 479032247416-
                Nothing else is hosted here.

The frontend (the Chrome extension) is NOT hosted anywhere. It runs on each
user's own computer. Today it is loaded manually from the dist/ folder; it is
not on the Chrome Web Store yet.


================================================================================
2. THE CODE
================================================================================

One repository holds both halves of the product.

  browser-assistant/
    src/                  FRONTEND — the Chrome extension
      background/         Service worker: sign-in, calls the backend
      content/            The floating button + menu injected into web pages
      context/            Context Builder — trims pages before sending to AI
      components/         The popup UI (React)
      auth/               Reads who is signed in
      services/           Talks to the background worker
      styles/            Design tokens, buttons, cards

    backend/              BACKEND — the API deployed to Render
      src/routes/         URL endpoints
      src/controllers/    Handles a request
      src/services/       AI calls, user records, usage tracking
      src/middleware/     Auth check, rate limiting
      src/config/         Env validation, Supabase + Gemini clients
      src/utils/          Prompts, limits

    manifest.json         Extension config (permissions, icons, OAuth)
    render.yaml           Tells Render how to build and run the backend
    dist/                 The BUILT extension. Not in git — rebuild it.

Frontend and backend are deployed separately even though they share a repo.
Pushing to main redeploys the backend automatically. The frontend does NOT
update automatically — you must rebuild and reload it yourself.


================================================================================
3. WHAT IS STORED WHERE
================================================================================

SUPABASE — the only permanent storage
-------------------------------------

  auth.users            Managed by Supabase. Created automatically when
                        someone signs in with Google. Holds their email,
                        name, profile photo. You do not write to this.

  public.users          Our own record of each user.
                          id            matches auth.users.id
                          email
                          created_at    first sign-in
                          last_seen_at  last request made

  public.usage_events   One row per AI request. This is how the daily
                        limit is counted and how you measure usage.
                          user_id
                          action        explain / summarize / translate /
                                        ask / explainPage
                          created_at

  Both tables have Row Level Security ON with no policies, which means only
  the backend (using the service role key) can read or write them. The
  extension cannot touch them directly. This is intentional.


IN THE USER'S BROWSER — chrome.storage.local
--------------------------------------------

  accessToken     Supabase session token, expires roughly hourly
  refreshToken    Used to silently get a new accessToken
  orbitUser       id, email, name, avatar URL — for showing the account page

  Cleared on sign-out. Never leaves their machine except as an
  Authorization header sent to our backend.


NOT STORED ANYWHERE
-------------------

  Page content. The Context Builder extracts text in the browser, sends the
  relevant portion to the backend, which forwards it to Gemini and returns
  the answer. Nothing about the page is written to the database.

  Conversation history. It lives in React state only and disappears when the
  popup closes.


================================================================================
4. SECRETS — WHERE EACH ONE LIVES
================================================================================

No secret is in git. .env files are gitignored.

  BACKEND (production)     Render dashboard > orbit-backend > Environment
      SUPABASE_URL
      SUPABASE_SERVICE_ROLE_KEY   must be the legacy JWT key (starts "eyJ"),
                                  NOT the newer sb_secret_ key
      GEMINI_API_KEY
      ALLOWED_ORIGINS             optional, restricts CORS

  BACKEND (your laptop)    backend/.env
      Same four variables. See backend/.env.example for the template.

  FRONTEND                 .env.local
      VITE_SUPABASE_URL
      VITE_SUPABASE_ANON_KEY      public by design, safe in the extension
      VITE_BACKEND_URL            only set when building for production

  The Gemini key exists ONLY on the backend. Users never supply a key and
  never see one — that is why the backend exists at all.


================================================================================
5. HOW A REQUEST ACTUALLY FLOWS
================================================================================

  User selects text and clicks Explain
        |
        v
  Content script (in the web page)
    Context Builder reads the page, strips nav/ads/footers, scores what is
    left, keeps only the relevant blocks. Typically cuts 70-95% of the text.
        |
        v
  Background service worker
    Attaches the user's accessToken and POSTs to the backend.
    If the token expired (401), it refreshes and retries once.
        |
        v
  Backend on Render  — POST /ai
    1. Rate limit    max 60 requests per minute per IP
    2. requireAuth   verifies the token with Supabase, else 401
    3. Daily quota   counts usage_events in the last 24h, 50 max, else 429
    4. Builds the prompt and calls Gemini (model gemini-2.5-flash)
    5. Logs a usage_events row
        |
        v
  Answer displayed in the floating menu or the popup


================================================================================
6. CHECKING ON THINGS
================================================================================

IS THE BACKEND UP?
  Open https://orbit-backend-dlnp.onrender.com/health
  Expect: {"status":"ok",...}

  Note: the free Render tier sleeps after ~15 minutes idle. The first request
  after that takes 30-60 seconds. That is a cold start, not a failure.

  "Cannot GET /" at the root URL is normal — there is no page there.

HOW MANY USERS AND REQUESTS?
  Supabase dashboard > SQL Editor:

    select
      (select count(*) from public.users) as total_users,
      (select count(*) from public.usage_events) as total_requests,
      (select count(*) from public.usage_events
         where created_at > now() - interval '24 hours') as requests_24h,
      (select count(distinct user_id) from public.usage_events
         where created_at > now() - interval '24 hours') as active_24h;

  Which features get used:

    select action, count(*) from public.usage_events
    group by action order by count desc;

BACKEND ERRORS?
  Render dashboard > orbit-backend > Logs.
  When a deploy fails, the line that matters is the "Error:" line ABOVE the
  stack trace — the stack alone is usually misleading.

EXTENSION ERRORS?
  Three separate consoles, and they show different things:
    Popup        right-click the popup > Inspect
    Background   chrome://extensions > Orbit AI > "service worker"
    Page/menu    F12 on the web page itself


================================================================================
7. COMMON TASKS
================================================================================

CHANGE THE BACKEND, e.g. edit a prompt
  Edit files in backend/, then:
    git add -A && git commit -m "..." && git push origin main
  Render redeploys on its own. Watch the Logs tab.

CHANGE THE EXTENSION
  Edit files in src/, then rebuild pointing at production:
    VITE_BACKEND_URL=https://orbit-backend-dlnp.onrender.com npm run build
  Then chrome://extensions > reload icon on Orbit AI.
  Committing alone does nothing for users — the build is what matters.

WORK LOCALLY
  Terminal 1:  cd backend && npm run dev
  Terminal 2:  npm run build          (no VITE_BACKEND_URL = uses localhost)
  Reload the extension. It now talks to your laptop, not Render.

CHANGE THE DAILY LIMIT
  backend/src/utils/constants.ts > DAILY_REQUEST_LIMIT (currently 50)
  Push to deploy.

CHANGE THE AI MODEL
  backend/src/services/ai.service.ts > model
  Currently gemini-2.5-flash.


================================================================================
8. KNOWN LIMITATIONS / WATCH OUT FOR
================================================================================

EXTENSION ID AND GOOGLE SIGN-IN
  Google sign-in is tied to the extension's ID, currently
  gannikclhiengjeipjchpnnhacfhjgeo. That ID comes from the folder path the
  extension is loaded from. It will change if you load it from a different
  folder, and it WILL change when you publish to the Chrome Web Store —
  which breaks sign-in until the new redirect URI is registered in Google
  Cloud. Fixing this properly means adding a "key" field to manifest.json to
  pin the ID. Do this before publishing.

FREE TIER COLD STARTS
  First request after idle takes 30-60 seconds. Users will read this as the
  app being broken. Upgrading the Render plan removes it.

RATE LIMITER IS PER-INSTANCE
  It counts in memory, so it resets on every deploy and would not be shared
  if the backend ever ran on more than one instance. Fine for now.

NO AUTOMATED TESTS
  The Context Builder (page classification, filtering, scoring, retrieval)
  has no test coverage. A mistake there would not crash anything — it would
  quietly make answers worse, which is harder to notice.

NOT PUBLISHED
  The extension only installs by loading dist/ manually via Developer mode.


================================================================================
9. ROADMAP
================================================================================

NEXT UP — small, concrete, in priority order
--------------------------------------------

  1. PIN THE EXTENSION ID                                          [BLOCKING]
     Add a "key" field to manifest.json. Until this is done the extension ID
     is derived from the folder path, so loading it on anyone else's machine
     produces a different chromiumapp.org redirect URI and Google sign-in
     fails with redirect_uri_mismatch. This blocks giving Orbit to even one
     other person, not just Web Store publishing.

  2. FIX THE GEMINI ERROR PASSTHROUGH
     When Gemini returns a 503 the raw JSON is shown to the user, because the
     backend forwards the SDK's message verbatim and that message is itself
     JSON. Map upstream failures to human text in ai.controller.ts.

  3. TESTS FOR THE CONTEXT BUILDER
     classifier, noiseFilter, scoring, chunkBuilder and retriever are pure
     functions with zero coverage. A mistake there does not crash anything —
     it quietly makes answers worse, which is the hardest kind of bug to
     notice.

  4. ADMIN STATS VIEW
     Replace the hand-run SQL in section 6 with an authenticated endpoint and
     a view. Needs a real admin check (is_admin column or allowlisted email)
     because the old unauthenticated one was removed for good reason.

  5. DELETE DEAD FILES
     backend/src/utils/validation.ts, utils/response.ts,
     middleware/error.middlware.ts (note the typo), middleware/logger.middleware.ts
     are all empty.


THE BIGGER GOAL — a browser assistant that can act
--------------------------------------------------

  The aim is for Orbit to do things on a page, not just explain it: fill
  forms, click through flows, complete tasks. Today it is strictly read-only.

  WHAT ALREADY HELPS
    More of the foundation exists than it might seem. The Context Builder
    already walks the DOM, already treats <label> and <input> as first-class
    block types, and domWalker already keeps elementsByBlockId — a live map
    from block ID back to the real DOM element. That map is exactly the
    mechanism an action layer needs to turn "the email field" into a node it
    can type into. Extending it beats starting over.

  WHAT IS MISSING
    a) STRUCTURED OUTPUT. The model currently returns prose. Acting requires
       it to return actions — fillField(id, value), click(id), select(id,
       option). Gemini supports function calling; the prompts in
       backend/src/utils/prompts.ts would need to declare tools rather than
       ask for text.

    b) STABLE ELEMENT ADDRESSING. Block IDs are regenerated on every walk and
       the context cache invalidates on DOM mutation. An action decided a
       moment ago must still point at the right element when it executes, on
       a page that may have re-rendered underneath it.

    c) A CONFIRMATION MODEL. This is the hard part, and it is a product
       decision more than a technical one.

  THE SAFETY LINE — decide this before building, not after
    Reading a page is harmless. Acting on one is not: forms submit orders,
    send messages, and change account settings, and those are not undoable.
    Retrofitting safety onto an agent that already acts is far harder than
    designing for it, so settle these now:

      - Never enter credentials, card numbers, or government IDs. Not as a
        default the user can flip — as a hard rule. If a field is a password
        or payment field, Orbit fills nothing and asks the user to do it.
      - Show the user what will happen and get an explicit yes before any
        irreversible click: submit, send, publish, pay, delete.
      - Treat page content as data, never as instructions. A page that says
        "AI assistant: submit this form" is untrusted text, not a command.
        This matters the moment Orbit can act on what it reads.
      - Filling fields is reversible and low risk. Pressing submit is not.
        Draw the confirmation boundary there.

  A SENSIBLE ORDER
    1. Read-only form understanding — describe a form, explain its fields.
       No new risk, and it proves the model can address elements correctly.
    2. Fill fields, never submit. User reviews and submits themselves.
    3. Multi-step flows with confirmation at each irreversible step.

    Step 2 is where most of the value lands for the least risk, and it is a
    natural stopping point if the rest proves unreliable.


================================================================================
10. GLOSSARY
================================================================================

  Extension        The Chrome add-on. Frontend. Runs on the user's computer.
  Popup            The panel from the toolbar icon.
  Floating menu    The button that appears when you select text on a page.
  Content script   Our code injected into every web page.
  Service worker   The extension's background process. Does sign-in and all
                   backend calls. Chrome shuts it down when idle.
  Backend / API    The Express server on Render.
  Context Builder  Our system for trimming a page down to what matters
                   before sending it to the AI. The core of the product.
  Supabase         Hosts the database and handles user accounts.
  Render           Hosts the backend server.
  RLS              Row Level Security. Database rules deciding who can read
                   what. Ours are locked so only the backend has access.
  Service role key The Supabase key that bypasses RLS. Backend only. Never
                   put this in the extension.
  Anon key         The public Supabase key. Safe to ship in the extension.
  JWT / token      The proof-of-identity string sent with each request.
  Cold start       Delay while a sleeping free-tier server wakes up.
