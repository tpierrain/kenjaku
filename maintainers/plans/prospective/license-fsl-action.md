<!-- STATUS: ⏸️ PROSPECTIVE — decided in principle, NOT started. Opened 2026-09-27 at the owner's ask. -->

# Action plan — a possible move from Apache 2.0 to the FSL

## 📍 STATE

- **Owner's call (2026-09-27): keep Apache 2.0 for now.** Nothing to do until he says otherwise.
- **If the license ever changes, it is the FSL** (Functional Source License, Apache-2.0 future), not
  Elastic 2.0, not AGPL v3. Settled; do not re-open the comparison.
- **What holds him back:** Kenjaku could no longer call itself "open source" (for two years per version).
- **A session may, alone:** nothing. This starts only on his explicit order.

## Why the FSL, if anything (the comparison of 2026-09-27)

- The risk the owner named: someone repackaging Kenjaku into a product sold dear. Kenjaku runs on the
  user's machine, so the threat is a repackaged app, not a hosted service.
- **FSL** forbids exactly that ("competing use") and nothing else: personal and at-work use, forks,
  modifications and consultants installing it for a client all stay allowed. Each version becomes
  Apache 2.0 two years after its release.
- **Elastic 2.0** rejected: it mainly forbids offering the software as a hosted service, and still
  allows selling a repackaged, closed derivative — the very case the owner fears.
- **AGPL v3** rejected: it keeps the "open source" label but allows selling, it only forbids closing
  the code; and many companies ban it outright, which hurts at-work adoption, the core use case.

## Facts checked on 2026-09-27

- The owner is the sole author of every commit, so he can relicense alone, with no one's consent.
- Every version published so far (up to v5.5.3) stays Apache 2.0 forever. Four forks exist, all
  untouched copies of old versions (0 commits of their own, 1,000 to 2,100 commits behind).
- Not legal advice: a review by someone qualified before switching.

## Tracking

- [ ] **L1 — The owner orders the switch** (nothing below starts before).
- [ ] **L2 — Legal read** of FSL-1.1-ALv2 by someone qualified.
- [ ] **L3 — Relicense**, from one named version on
  - [ ] L3.1 Replace `LICENSE` with FSL-1.1-ALv2.
  - [ ] L3.2 README: the `## License` section, and the "open license (Apache-2.0) → zero lock-in"
        promise (zero lock-in stays true: the notes are the user's Markdown; "open license" does not).
  - [ ] L3.3 The reliability board image that repeats "open license" (`docs/img/board-reliability.png`
        and its alt text).
  - [ ] L3.4 Say it in that version's release note, plainly: what changes for users (nothing for
        personal or at-work use) and what does not (past versions stay Apache 2.0).
