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

## Decisions — settled 2026-08-25

1. **Brand: KajDaJademe.** Domain `kajdajademe.mk` is free but not bought yet.
   The app is rebranded; connecting the domain is the only piece still waiting,
   and buying it is now the top to-do outside the code.
2. **Recipes: admin only.** It is personal. Lives at `/admin/recipes` behind the
   guard, out of the public nav, and admin-only in the Firestore rules too.
3. **Firestore rules: ship them.** Written, wired into `firebase.json`, deployed.
   Worth recording why this mattered: before them, an unauthenticated read of
   `/users` and `/recipes` returned `200` — every user's favourites, and the
   recipe collection, were readable by anyone who knew the project id.

## Now — must be true before showing this to the public

### 1. Lock the admin down for real — code done, rules pending
Admin is currently one boolean derived from an email address, checked only in
templates. Every admin route is directly reachable by URL for anyone, and the
writes behind them are only as safe as the (unseen) Firestore rules.

- Route guard on `/add-place`, `/add-place/:id`, `/tag-manager`.
- Move them under a single `/admin` prefix so there is one thing to protect.
- Admin identity from a Firestore claim/doc, not a hardcoded email string.
- `firestore.rules` in the repo: public read on `places`/`tags`, writes only
  for admin, `users/{uid}` readable and writable only by that user.
- Storage rules the same shape.

Shipped: `adminGuard`, everything moved under `/admin/*` with redirects from
the old URLs, `firestore.rules` + `storage.rules` written. Still open: admin
identity from a claim rather than an email, and actually deploying the rules
(decision 3).

**Done when:** pasting `/admin/add-place` while logged out redirects to Explore,
and a non-admin write is rejected by rules, not just hidden in the UI.

### 2. Place detail pages with real URLs — done
Today a card goes straight to Google Maps. There is no page to share, nothing
for Google to index, and the extra photos we already store are never shown.

- Route `/place/:slug`, slug from the name (`cafe-paname`), id as fallback.
- Content: hero photo, 3–5 photo gallery, description, neighborhood, tags,
  directions button, save-to-favorites, share button.
- Card tap opens the detail page; "Open in Google Maps" stays as a direct action.
- Back returns to Explore with filters intact.

Shipped: `/place/:slug` with gallery, description, tags, directions, share and
favourites; Explore and Favourites cards open it; loading and not-found states.

**Done when:** ~~I can send you a link to one place and it opens on that
place.~~ Yes — try one from the preview link.

### 3. Explore states — done
The screen currently has no loading, empty or error state — the page is simply
blank until Firestore answers.

Shipped: skeleton cards, "No places match all these filters yet" with a clear
button, empty-catalog state, and an error state whose retry actually refetches.
Cards now also load before the Google Maps script rather than after it.

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

### 7. Rebrand and domain — half done
Done: name in the Explore header, mobile top bar, `index.html` title,
description and fallback OG tags.
Left: **buy `kajdajademe.mk`**, connect it in Firebase Hosting, redirect
`dodi-s-places.web.app`, and a favicon/wordmark that isn't the Angular default.

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

## Progress

- ✅ Roadmap written (this file)
- ✅ 1. Admin guarded and moved to `/admin` (rules written, not deployed)
- ✅ 2. Place pages at `/place/:slug`
- ✅ 3. Explore loading / empty / error states
- ✅ Rebrand to KajDaJademe in-app; Recipes moved behind the admin guard
- ⬜ 4. Analytics — next
- ⬜ 5. Search
- ⬜ Buy and connect `kajdajademe.mk`

## Order I'm working in

1 → 2 → 3 → 4 → 5 → 6, with 7 slotted in whenever the brand decision lands, and
8 near the end because it is quick. Each lands as its own commit on
`public-mvp`; nothing goes to the live site until you say so.
