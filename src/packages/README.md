# Deep Packages Architecture

All modules in this directory are deep modules: a large amount of capability behind a narrow, intentional public surface.

## Layout

```
src/packages/<name>/
  index.ts        ← public entry point. External modules may import ONLY root files.
  lib/            ← implementation internals: private, free to import each other.
  tests/          ← co-located tests: import through entry points, not private internals.
```

## Rules

1. **Entry-point boundary**: Code outside a package must import only that package's root entry points, never files in `lib/` or internal subfolders.
2. **Intra-package freedom**: Files inside `lib/` may import each other freely.
3. **Tests through entry points**: Tests must exercise behavior via the public entry points.
4. **No cycles**: Cyclic dependencies between packages are prohibited.
5. **No barrel files**: Do not create catch-all barrel files re-exporting private internals; expose focused entry points.
