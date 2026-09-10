# public-speaking

Operating guidance for AI agents working in this repository.

## What this is

Steve Wade's speaker portfolio site: bio, headshot, and talk list, published
to [speaking.stevenwade.xyz](https://speaking.stevenwade.xyz). It's public,
and it's what an event organiser sees when deciding whether to book him, so
treat accuracy and polish here as reputation-bearing, not optional.

## Repository layout

- `site/` is the entire published output. No build step; every file under
  it is uploaded as-is, preserving its path. `site/index.html` is the
  homepage; `site/theme.css` is the shared stylesheet every page links to
  with a root-relative `<link>`; `site/<slug>/index.html` is a per-talk
  subpage (`site/the-human-api/`, `site/kubernetes-workshop/`).
- `scripts/publish-r2.js` walks `site/` and PUTs each file to the
  `stevenwade-xyz-slides` Cloudflare R2 bucket under the `speaking/` key
  prefix, reusing [swade1987/slides](https://github.com/swade1987/slides)'s
  existing R2 + Worker pipeline for `*.stevenwade.xyz`. No Cloudflare
  resources belong to this repo.
- `.github/workflows/publish.yml` runs the publish script on every push to
  `main` that touches `site/`.
- `assets/` holds the pre-restructure profile picture pointer; the
  canonical headshot lives at `site/headshot.jpg`.

## Publishing

```bash
node scripts/publish-r2.js site speaking
```

Needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment
(a non-expiring R2 read/write token, same convention as the `swade1987/slides`
CI credential). In CI these are the `CLOUDFLARE_R2_TOKEN` /
`CLOUDFLARE_ACCOUNT_ID` repo secrets.

## Constraints that matter

- **A subpage's URL needs a trailing slash.** `slides-router` (the Worker
  serving this domain) only appends `index.html` to a path ending in `/` -
  `speaking.stevenwade.xyz/kubernetes-workshop` 404s, `/kubernetes-workshop/`
  resolves. Every internal link to a subpage must carry the trailing slash;
  this was hit live building the-human-api and is easy to reintroduce on a
  new subpage.
- **Every fact about Steve's history (bio claims, past-talk dates, training
  venues, testimonials) must be independently verified before publishing,
  never guessed or "probably fine."** The original README carried fabricated
  bio claims (Platform Fix OS™, a distorted £100M framing) that the Platform
  Fix board flagged and this repo replaced. Only two talks were
  independently verified when this repo was rebuilt; everything else in the
  current homepage archive was added only after Steve explicitly confirmed
  it, talk by talk, with a source (an email thread, a schedule screenshot, a
  video link) - not from the old README's unverified list alone. Extend
  this discipline to anything new: ask before adding a claim, cite what
  confirmed it in the commit message.
- **No em dashes, anywhere in this repo's prose.** Steve's explicit
  instruction (2026-09-10) - they read as an AI-generated tell. Use a
  period, colon, comma, or restructure the sentence instead. Check with
  `grep -rn "—" site/ README.md CLAUDE.md` before committing prose changes.
  A quoted external title (someone else's exact video/talk title) is the
  one exception - don't rewrite someone else's words - but even those get
  normalized to a colon here when there's no other reason to keep the
  original punctuation.
- **Actions are pinned by SHA, not a floating tag.** If you need to bump
  one, resolve the real value first (`gh api repos/<owner>/<repo>/git/refs/tags/<tag>`)
  rather than typing a SHA from memory. Dependabot opens the bump PRs going
  forward; prefer merging those over hand-editing pins.
- **`main` has a branch ruleset (id `22787401`), same shape as
  `platformfix/podium`'s.** Blocks deletion and force-push, requires a pull
  request, and requires the `commit-lint` and `pr-lint` status checks to
  pass before merge. `required_approving_review_count: 0` - GitHub blocks a
  PR author approving their own PR, so a review requirement here would just
  deadlock every PR (same reasoning `platformfix/podium`'s CLAUDE.md
  documents). Steve (`swade1987`) is a bypass actor, so his own pushes can
  still land directly - but the point of turning this on was to actually
  route changes through PRs, so use one anyway rather than relying on the
  bypass. Verify the live rule with `gh api repos/swade1987/public-speaking/rulesets/22787401`
  rather than trusting this note, in case it's changed since.
- **`allowed_merge_methods` is `["merge", "squash"]` - rebase merge is
  deliberately excluded**, unlike `platformfix/podium`'s ruleset (which
  currently allows all three). A GitHub rebase merge rewrites every commit
  with a new SHA and signs none of them, silently landing unsigned commits
  on `main`; squash and merge-commit are both signed by GitHub's own key
  instead. Default to squash.

## Commits and pull requests

Conventional Commits, checked by `commit-lint` (commit messages) and
`pr-lint` (PR titles) - both required status checks on the `main` ruleset.
Every commit carries a `Signed-off-by:` trailer (`git commit -s`).
