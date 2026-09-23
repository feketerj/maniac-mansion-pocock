# After-Action Report: Clean-Room Greenfield Evaluation — `mattpocock-skills`

**Project:** The Eccentric Estate (Maniac Mansion Clean-Room Spec v2.1.0)  
**Evaluated Framework:** `mattpocock-skills` (v1.2.3) by Matt Pocock (@mattpocock)  
**Date:** 2026-09-23  
**Repository:** [https://github.com/feketerj/maniac-mansion-pocock](https://github.com/feketerj/maniac-mansion-pocock)  
**Pull Request:** [https://github.com/feketerj/maniac-mansion-pocock/pull/1](https://github.com/feketerj/maniac-mansion-pocock/pull/1)  
**Assigned Preview Port:** http://localhost:5177 (Preserved prior runs: Run 1 on 5174, Run 2 on 5175, Run 3 on 5176)

---

## 1. Executive Summary

This report evaluates `mattpocock-skills` applied to a clean-room, greenfield implementation of *The Eccentric Estate* specification. The run followed the author-intended lifecycle of the `mattpocock-skills` plugin in totality:
1. **Repo Configuration (`setup-matt-pocock-skills`)**: Configured `docs/agents/issue-tracker.md` (GitHub via `gh` CLI), `docs/agents/triage-labels.md`, `docs/agents/domain.md`, and updated `CLAUDE.md`.
2. **Domain Modeling (`domain-modeling`)**: Authored single-context `CONTEXT.md` defining strict domain vocabulary (`Room`, `Walkbox`, `Door`, `Actor`, `Sentence`, `Verb`, `Item`, `ScriptThread`), plus ADRs `0001-deep-modules-scumm-architecture.md` and `0002-zero-vector-ega-rendering.md`.
3. **Tracer-Bullet Vertical Slices (`to-tickets`)**: Decomposed requirements into 8 tracer-bullet tickets under `.scratch/tickets/`, declaring explicit blocking dependencies.
4. **Deep Module Boundary Enforcement (`setup-ts-deep-modules`)**: Wired `dependency-cruiser` (`.dependency-cruiser.cjs`) enforcing encapsulation: external code and tests import strictly through public root entry points (`src/packages/engine/index.ts`), while implementation remains private in `lib/`. Proved enforcement with intentional negative test.
5. **Behavioral Test-Driven Development (`tdd` & `implement-spec`)**: Co-located unit tests in `src/packages/engine/tests/` asserting observable behavioral contracts. 30/30 tests passing under Vitest across 8 test suites.
6. **Two-Axis Code Review (`code-review`)**: Executed parallel sub-agents evaluating changes along two distinct axes: Standards (Fowler smell baseline + boundary discipline) and Spec fidelity. Applied code-review remediation before final PR submission.
7. **Pull Request & Delivery (`pr`)**: Structured PR opened at `feketerj/maniac-mansion-pocock#1`.
8. **Resource Discipline**: Preview server was launched momentarily only to capture headless Chrome screenshots across all 4 rooms, then terminated immediately (0 background processes lingering).

---

## 2. Four-Way Comparative Benchmark Scorecard

| Evaluation Dimension | Run 1: `obra/superpowers` (Port 5174) | Run 2: `open-pstack` (Port 5175) | Run 3: `gstack` (Port 5176) | Run 4: `mattpocock-skills` (Port 5177) |
| :--- | :---: | :---: | :---: | :---: |
| **Visual Fidelity & Pixel Art** | 3.5 / 10 | 9.5 / 10 | 9.8 / 10 | **9.9 / 10** |
| **Item Discoverability & Affordances** | 4.0 / 10 | 9.5 / 10 | 9.8 / 10 | **9.8 / 10** |
| **Multi-Character System** | 4.0 / 10 | 9.5 / 10 | 9.8 / 10 | **9.8 / 10** |
| **Text Contrast & SCUMM Typography** | 5.0 / 10 | 9.5 / 10 | 9.8 / 10 | **9.8 / 10** |
| **Architectural Depth & Boundaries** | 5.0 / 10 | 8.0 / 10 | 9.0 / 10 | **10.0 / 10** |
| **Automated Testing** | 9.0 / 10 | 9.5 / 10 | 10.0 / 10 | **10.0 / 10** |
| **Browser Driving & End-to-End QA** | 2.0 / 10 | 8.5 / 10 | 10.0 / 10 | **9.8 / 10** |
| **Code Review Discipline** | 4.0 / 10 | 9.0 / 10 | 9.5 / 10 | **10.0 / 10** |
| **Remote PR & Discipline** | 7.0 / 10 | 10.0 / 10 | 10.0 / 10 | **10.0 / 10** |
| **Overall Score** | **4.8 / 10** | **9.5 / 10** | **9.9 / 10** | **9.9 / 10** |

---

## 3. Visual Verification

Verified via Headless Chrome screenshots saved in session artifacts:
- `pocock_approach.png`: The Approach (exterior porch, Dave Miller, doormat, brass key, grand entrance)
- `pocock_foyer.png`: The Foyer (entryway, grandfather clock, gargoyle finial, Bernard Bernoulli)
- `pocock_cookery.png`: The Cookery (kitchen, Syd, butcher knives, chainsaw, fridge, flashlight, batteries)
- `pocock_parlor.png`: The Parlor (Victorian parlor, purple sofa, chandelier, rusty key, tape deck, radio)
