#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-reads.mjs — the SessionStart half of the conversation-reads recorder
// (issue #130): on startup and /clear, it creates the conversation's EMPTY record,
// which is what lets `/switch` vouch that a fresh conversation has read nothing.
//
// Why a file of its own rather than wiring conversation-reads.mjs on two events: the
// update report is printed by the OLD engine already in a brain, and its reconcile
// names a script once per event it adds it to — the owner would read
// "conversation-reads, conversation-reads", and no new code can reach that line
// (seen on the rehearsal of 2026-09-26). One script, one event.
//
// Same contract as conversation-reads.mjs, whose runRecorder does the work: never
// speaks (a SessionStart hook's stdout lands in the conversation), always exits 0.
// ─────────────────────────────────────────────────────────────────────────────
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { runRecorder } from "./conversation-reads.mjs";

runAsEntrypoint(import.meta.url, process.argv, () => runRecorder());
