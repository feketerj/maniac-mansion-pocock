# Maniac Mansion (The Eccentric Estate v2.1.0) - Matt Pocock Engineering Edition

## Agent skills

### Issue tracker
GitHub issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels
Default canonical triage labels. See `docs/agents/triage-labels.md`.

### Domain docs
Single-context domain modeling (`CONTEXT.md` and `docs/adr/`). See `docs/agents/domain.md`.

### Deep Modules
Packages and engine subsystems are deep modules: see `src/packages/README.md` before adding or importing one.
Public entry points expose clean behavioral seams; internals and implementation details remain private.
Testing verifies observable behavioral contracts, never implementation details or internal state.
Zero Vector Policy: authentic 16-color EGA raster art, 12-frame 4-way walk cycles, no geometric canvas approximations.
