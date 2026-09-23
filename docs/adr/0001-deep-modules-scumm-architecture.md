# 0001 Deep Modules SCUMM Architecture

We structure the adventure game engine into deep modules with narrow public entry points (`navmesh`, `actor`, `room`, `vm`, `ui`, `audio`) rather than a single monolithic game loop or scattered utility helpers. This isolates complex spatial pathfinding, cooperative script coroutines, and sentence composition behind observable behavioral contracts that can be tested without mocking internal state.
