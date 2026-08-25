# Public MVP Roadmap

Working list for turning the personal app into a public product.
Derived from the strategy note in `src/assets/Plan.txt` plus an audit of the
code on 2026-08-25. The strategy note stays as-is (it is the "why"); this file
is the "what and in what order", and it is the one we keep current.

Branch: `public-mvp`.

---

## Already done — the strategy note is out of date here

The note assumes no auth, no favorites and a desktop-only UI. Actually shipped:

- **Firebase Auth** — Google sign-in, email/password, signup, forgot password.
- **Favorites** — heart on each card, `/my-lists` page, stored per user.
- **Tag filtering** — grouped into location / vibe / food, clear-all,
  auto-disabling of tags that would return nothing, instant results.
- **Mobile navigation** — hamburger + right drawer, page title in the top bar,
  header collapsed on Explore and Recipes.
- **Admin tooling** — add / edit / delete place, bulk tag manager, image upload
  with cropping, per-tag image selection so a card shows the photo that matches
  the active filter.
- **Map** — Google Map with markers and info windows under the results.
- **Recipes** — categories, time filters, detail view, admin editing.
- **Perf** — places cached in localStorage for 10 minutes, images uploaded with
  a 1-year cache header.

So the remaining work is narrower than the note suggests: it is mostly
**publicness** (URLs, sharing, SEO, analytics, lockdown, brand), not features.

---

## Decisions I need from Florent

These block work that is otherwise ready to go.

1. **Brand.** Rebrand to KajDaJademe, or keep Dodi's Places? Is
   `kajdajademe.mk` bought, and are the IG/TikTok handles free? Everything in
   §7 waits on this. Cheap either way — the name lives in a handful of places.
2. **Recipes.** The note calls it an internal tool. Last week we made it a
   public nav link. Which is it for launch? (My take: keep the page public but
   drop it from the main nav until it has enough content to stand next to
   Explore — it reads as a different product right now.)
3. **Firestore rules.** There is no `firestore.rules` in the repo, so whatever
   is live was set in the console and nobody here can see it. I need to look at
   the current rules before writing new ones, and rules deploys are the one
   thing I will not push without you confirming — a bad rule locks out reads
   for everyone.

---

## Now — must be true before showing this to the public

### 1. Lock the admin down for real
Admin is currently one boolean derived from an email address, checked only in
templates. Every admin route is directly reachable by URL for anyone, and the
writes behind them are only as safe as the (unseen) Firestore rules.

- Route guard on `/add-place`, `/add-place/:id`, `/tag-manager`.
- Move them under a single `/admin` prefix so there is one thing to protect.
- Admin identity from a Firestore claim/doc, not a hardcoded email string.
- `firestore.rules` in the repo: public read on `places`/`tags`, writes only
  for admin, `users/{uid}` readable and writable only by that user.
- Storage rules the same shape.

**Done when:** pasting `/admin/add-place` while logged out redirects to Explore,
and a non-admin write is rejected by rules, not just hidden in the UI.

### 2. Place detail pages with real URLs
Today a card goes straight to Google Maps. There is no page to share, nothing
for Google to index, and the extra photos we already store are never shown.

- Route `/place/:slug`, slug from the name (`cafe-paname`), id as fallback.
- Content: hero photo, 3–5 photo gallery, description, neighborhood, tags,
  directions button, save-to-favorites, share button.
- Card tap opens the detail page; "Open in Google Maps" stays as a direct action.
- Back returns to Explore with filters intact.

**Done when:** I can send you a link to one place and it opens on that place.

### 3. Explore states
The screen currently has no loading, empty or error state — the page is simply
blank until Firestore answers.

- Skeleton cards while places load.
- Friendly empty state: "No places match all these filters yet. Try removing one."
- Error state with a retry.

### 4. Analytics from day one
Nothing is measured right now, so there is no way to tell whether any of this
works, and no numbers to show a restaurant later.

- Firebase Analytics wired up, page views per route.
- Events: filter selected, card opened, detail opened, directions clicked,
  share clicked, favorite added, search performed.

### 5. Search
Name and tag keyword search on Explore. Filtering stays the primary mechanism —
search is the escape hatch for "I know the place, just find it".

### 6. SEO and link previews
Worth being honest: this is a client-rendered SPA, so meta tags set in the
browser do **not** produce WhatsApp/Messenger previews and give Google very
little. Doing this properly means prerendering the place pages
(`ng build --prerender`, or Angular SSR on Cloud Run). That is a real chunk of
work — I would slot it right after the detail pages exist, since it depends on
them, and it is what makes sharing actually look good.

- Per-place title/description/OG image.
- `index.html` title and description that aren't "DodiPlaces".
- Prerender or SSR so crawlers and chat apps see them.

### 7. Rebrand and domain (blocked on decision 1)
Name, logo/wordmark, favicon, `index.html` title, nav, footer, custom domain on
Firebase Hosting, redirect from `dodi-s-places.web.app`.

### 8. PWA
`@angular/pwa`: manifest, icons, offline shell, add-to-home-screen. Small job,
big perceived-quality win on phones.

### 9. Content
30–50 places, each with several strong photos, spread across neighborhoods and
categories. Not code, but it is the thing that decides whether launch lands.

---

## Next — shortly after launch

- **Mood / occasion filters** (date, work & coffee, cheap but good, quick bite).
  Probably the strongest differentiator in the whole note, but it needs tag
  work on existing places first.
- **Recently added** — "New this week" strip on Explore, using `createdAt`.
- **Curated collections** — `/collections/best-croissants-skopje`, hand-picked,
  each a shareable page. Doubles as SEO landing pages.
- **Surprise Me** — random place from the current filters. Half a day of work.
- **Share a filtered search** — encode filters in the URL so a filtered Explore
  is linkable. Needed before "here are the dessert places I found" works.
- **Lists** beyond favorites (Date Night, Places to Try).

## Later

- Trending from real signals (only once there is real traffic).
- Admin dashboard over the analytics events.
- Sponsored / featured placements, clearly labelled.
- More cities.

## Explicitly not doing now

Reviews, star ratings, comments, restaurant self-service accounts, native apps,
reservations, delivery, AI recommendations, follower system, Macedonia-wide
coverage. Same list as the note, and I agree with it.

---

## Order I'm working in

1 → 2 → 3 → 4 → 5 → 6, with 7 slotted in whenever the brand decision lands, and
8 near the end because it is quick. Each lands as its own commit on
`public-mvp`; nothing goes to the live site until you say so.
