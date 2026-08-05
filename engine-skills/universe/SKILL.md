---
name: universe
description: "Alias of /switch. Universes: switch, list, create, rename, describe, delete. Reached by typing /universe (or /univers) — routing is literal, so nothing else here triggers it."
version: 1.0.0
---

# /universe — an alias of `/switch`

The command that owns universes is named after the verb (`/switch`), and this is the noun most
people reach for first. There is nothing else here.

**Do this:** invoke the **`switch`** skill and follow it, passing along whatever arguments were
given to `/universe` (e.g. `/universe acme` means `/switch acme`). Do not re-derive its behaviour
from this file — `switch` is the only place the rules live.
