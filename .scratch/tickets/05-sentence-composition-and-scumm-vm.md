# 05: Sentence Composition and SCUMM VM

**What to build:** SCUMM verb sentence composer (`GIVE`, `OPEN`, `CLOSE`, `PICK UP`, `LOOK AT`, `TALK TO`, `USE`, `PUSH`, `PULL`) with 2-word preposition support ("Use X with Y", "Give X to Y"), cooperative script execution threads, inventory management, and dialog/message overlays.

**Blocked by:** 04: Room State and Interactive Entities

**Status:** ready-for-agent

- [ ] Sentence construction state machine (Verb -> DirectObject -> Preposition -> IndirectObject)
- [ ] Script VM execution for verbs and object handlers
- [ ] Inventory addition/removal and item usage logic
- [ ] Unit tests for sentence dispatch and puzzle progression
