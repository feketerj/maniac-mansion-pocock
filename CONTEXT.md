# The Eccentric Estate (Maniac Mansion Domain)

The domain model for an authentic 1987 Lucasfilm-style point-and-click graphical adventure engine recreating The Eccentric Estate.

## Language

### Navigation & World

**Room**:
A discrete physical environment containing an authentic 16-color EGA background, walkboxes, z-depth sorted entities, and entry points.
_Avoid_: Scene, level, screen, map

**Walkbox**:
A convex traversable floor polygon that constrains actor navigation and projects out-of-bounds target clicks to the nearest legal boundary.
_Avoid_: Navmesh tile, collision box, floor region

**Door**:
An interactive portal connecting two rooms that tracks open, closed, and locked states and manages room transition triggers.
_Avoid_: Portal, gateway, entrance

### Actors & Presentation

**Actor**:
An interactive protagonist or non-player character possessing a position, orientation, 12-frame walk cycle, and inventory.
_Avoid_: Character, entity, sprite, avatar

**Sentence**:
The active command constructed by the player, formatted as `Verb [DirectObject] [Preposition] [IndirectObject]`.
_Avoid_: Command, instruction, action buffer

**Verb**:
One of the canonical nine action primitives (`OPEN`, `CLOSE`, `GIVE`, `PICK UP`, `LOOK AT`, `TALK TO`, `USE`, `PUSH`, `PULL`).
_Avoid_: Action, verb command, operation

**Item**:
A collectible or manipulable object residing either in a room's interactive object pool or in an actor's inventory.
_Avoid_: Prop, inventory entity, collectible

### Execution

**ScriptThread**:
A cooperative coroutine executing room lifecycle logic, object interactions, or cutscene sequences without blocking frame rendering.
_Avoid_: Routine, coroutine, task, process
