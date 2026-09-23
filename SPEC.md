# **SYSTEM SPECIFICATION DOCUMENT: "THE ECCENTRIC ESTATE"**

**Document Version:** 2.1.0 **Target Architecture:** Multi-Agent Autonomous Engineering Framework **Target Platform:** Spec-Driven Adventure Engine (SDAE) \- HTML5/Canvas/WebGL **Design Paradigm:** Entity-Component-System (ECS) with Cooperative Script Multitasking **Resolution Constraint:** 320x200 Native (Scaled to Modern Viewports via Nearest-Neighbor Interpolation)

## **1\. SYSTEM ARCHITECTURE & TECH STACK GUIDELINES**

The target software requires the deployment of a highly specialized, state-driven 2D engine designed to faithfully replicate the late-1980s macro-scripted adventure game architectures1. The engine's foundational design mandates a strict separation of concerns between the rendering pipeline, the state machine, the pathfinding module, and the cooperative multitasking script executor. The architecture is engineered to ensure deterministic execution, cross-platform equivalence, and complete adherence to the mechanical constraints of the source era4.

### **1.1. Core Engine Subsystems and The Virtual Machine**

At the heart of the engine is a custom Virtual Machine (VM) responsible for script execution, state mutation, and thread management5. Unlike modern event-driven architectures that rely heavily on asynchronous callbacks, this engine utilizes a synchronized, tick-based execution loop operating at a fixed 60 Hz (approximately 16.67ms per frame)7. The VM interprets a proprietary bytecode (or an Abstract Syntax Tree equivalent) that implements a robust set of operational codes (opcodes) dictating every facet of the game's logic9.

The VM's dispatcher evaluates opcodes based on a strict parameter mode flag system6. The memory architecture supports multiple variable scopes: bit-variables (booleans for simple binary states), local variables (confined to the current room's memory space), indexed arrays, and global variables (persistent across the entire game state)6. This hierarchical memory model is critical for maintaining the complex puzzle dependency graphs required by the game design.

&nbsp;

| Subsystem | Responsibility | Technical Implementation Guidelines |
| :---- | :---- | :---- |
| **Virtual Machine (VM)** | Script execution, state mutation, threading. | Custom bytecode or AST-based interpreter. Must support yielding, wait-states (wait\_for\_actor, wait\_for\_camera), and cooperative multitasking for concurrent background scripts12. |
| **Rendering Pipeline** | 8-bit palette indexed rendering, Z-Plane sorting. | HTML5 Canvas ImageData manipulation. Must enforce a strict 256-color indexed palette. Sprites and backgrounds share this global palette to emulate EGA/VGA limitations14. |
| **Input Manager** | Mouse coordinates, click interception, verb assignment. | Intercepts screen interactions. Maps modern viewport coordinates back to the internal 320x200 space. Passes contextual objects to the Sentence Constructor1. |
| **Pathfinding (NavMesh)** | Walkbox traversal, scaling, depth sorting. | Dijkstra or A\* algorithm traversing a discrete Walkbox Matrix. Handles dynamic scaling of actor sprites based on Y-axis position within specific walkboxes17. |
| **State Manager** | Persistence of world, room, and actor data. | Bitwise flag arrays for boolean states. Global variables (cross-room). Local variables (room-specific). Must serialize to structured formats (e.g., JSON) for exact Save/Load equivalence6. |

### **1.2. The Cooperative Scripting Model and Multitasking**

The engine's ability to simulate a living world relies on a cooperative scripting model. Logic and rendering are decoupled, ensuring that script execution does not inherently block the rendering pipeline unless explicitly instructed to do so via wait states8.

Scripts are categorized into two primary execution threads:

> 1. **Global Scripts:** These threads are always active and reside in the engine's persistent memory. They handle overarching systems such as the time-of-day progression, background non-player character (NPC) schedules, global puzzle timers (e.g., the countdown for a package delivery at the front door), and macro-level state checks14.  
> 2. **Local Scripts:** These threads are instantiated only when a specific room is loaded and are bound entirely to that room's context. They manage localized animations and environmental logic, such as a dripping faucet in the kitchen or flickering lights in the basement. Crucially, local scripts are systematically destroyed and garbage-collected upon room transition to prevent memory leaks and logical conflicts13.

**Execution Prioritization and Suspension:** During each 16.67ms tick, the VM iterates through all active script threads based on a predefined prioritization hierarchy21. A thread executes its instructions sequentially until it encounters a blocking opcode—such as a temporal delay (delay(1000)), a spatial requirement (walk\_actor\_to(actor\_id, x, y)), or an animation lock. Once blocked, the thread yields control, allowing the VM to process the next thread6.

Furthermore, the engine must support dynamic thread suspension for the implementation of cutscenes. When a critical narrative event occurs, the engine executes an equivalent to an endCutScene or freeze opcode, which temporarily suspends all non-essential global and local threads. User input is frozen, the camera's programmatic follow logic is overridden to frame the scene, and execution is restricted to the specific cutscene thread until the sequence concludes, at which point the dormant threads are reawakened9.

### **1.3. Rendering Architecture: Z-Buffers, Z-Planes, and Walkboxes**

The target software operates entirely within a 2D rendering context, yet it must convincingly simulate three-dimensional space and depth. This is achieved through a meticulous implementation of Z-buffers, Z-planes, and dynamically scaled Walkboxes14.

Rooms are not rendered as flat, single-layer images. They are composite scenes built from multiple depth planes:

* **Background Plane (Z0):** The base static image of the room, representing the furthest depth.  
* **Z-Planes (Z1 \- Z4):** Masking layers containing pixel data for foreground objects (e.g., a table, a couch, a pillar). These planes define objects that characters can walk *behind*17.  
* **Dynamic Actor Z-Depth:** An actor's rendering priority is calculated dynamically on every frame. The actor's baseline Y-coordinate (the bottom of their sprite's bounding box) determines their precise Z-index. If an actor's Y-coordinate is "higher" on the screen (representing a position further back in the simulated perspective) than a specific Z-Plane's baseline Y-coordinate, the Z-Plane is rendered *over* the actor, effectively masking them17.

Walkboxes serve a dual purpose: pathfinding and spatial scaling. Each walkbox defines a set of geometric parameters that govern how an actor's sprite is rendered within its boundaries. As an actor moves along the Y-axis (up or down the screen), the engine interpolates their sprite's scale between the walkbox's predefined scale\_min and scale\_max values. This scaling is essential for creating the optical illusion of characters moving deeper into the room's background or stepping closer to the foreground camera17.

## **2\. UI & PRESENTATION STANDARDS**

The user interface must be a 1:1 functional replication of the classic late-1980s verb-object sentence-construction paradigm1. The visual presentation is strictly locked at an internal resolution of 320x200 pixels. To accommodate modern displays, the engine must scale this native resolution using nearest-neighbor interpolation to preserve the sharp, hard-edged aesthetic of original 8-bit pixel art15. Anti-aliasing or bilinear filtering must be explicitly disabled in the rendering pipeline.

### **2.1. Screen Grid Layout and Spatial Division**

The 320x200 screen space is rigidly partitioned into three horizontal zones, each serving a distinct interactive purpose. This layout must remain immutable throughout standard gameplay, ensuring a consistent user experience.

&nbsp;

| Zone | Dimensions (Pixels) | Coordinates (X, Y) | Architectural Function |
| :---- | :---- | :---- | :---- |
| **Action Area** | 320 x 144 | (0, 0\) to (320, 144\) | The primary viewport for room backgrounds, actors, and environmental objects. Handles camera panning, sprite rendering, and spatial click detection. |
| **Sentence Line** | 320 x 8 | (0, 144\) to (320, 152\) | The linguistic feedback zone. Displays the active constructed sentence based on user input (e.g., "Use Brass Key with Grand Entrance Doors")1. |
| **Control Panel** | 320 x 48 | (0, 152\) to (320, 200\) | The interactive command center. Houses the Verb Bar matrix on the left and the scrollable Inventory list on the right25. |

### **2.2. The Verb Bar Matrix and Linguistic Architecture**

The Verb Bar occupies the left side of the Control Panel (spanning X-coordinates 0 through 200). It consists of 15 persistent verbs arranged in a highly specific 3-column by 5-row grid. This verb matrix forms the entire linguistic foundation of the game's mechanics25.

The default active verb, selected automatically when no other verb is explicitly clicked, is Walk to19. The engine's Input Manager intercepts clicks on the Action Area and, if no contextual object is clicked, defaults to passing coordinates to the pathfinding system.

| Column 1 (X: 0-66) | Column 2 (X: 67-133) | Column 3 (X: 134-200) |
| :---- | :---- | :---- |
| Push | Pull | Give |
| Open | Close | Look at |
| Walk to | Pick up | What is |
| Unlock | Turn on | Turn off |
| Use | Read | Talk to |

This 15-verb system dictates the game's possibility space. The engine evaluates syntax by constructing sentences: \[Subject/Verb\] \+ \[Direct Object\] \+ \[Indirect Object/Preposition\]1. For example, clicking "Give" primes the engine for a Direct Object (an item from the inventory). Clicking "Brass Key" appends the item to the sentence, followed by the preposition "to". The engine then waits for an Indirect Object (an actor in the Action Area). The final constructed phrase, "Give Brass Key to The Scholar," is then dispatched to the event state machine for evaluation25.

### **2.3. Inventory Management and Display Mechanics**

The Inventory Area occupies the right side of the Control Panel (spanning X-coordinates 201 through 320). The inventory system is designed with a strict dichotomy between logical capacity and visual presentation21.

* **Logical Capacity:** Each actor possesses an independent, conceptually unlimited inventory array26. Items picked up are appended to this array, modifying the global state flags associated with those specific objects21.  
* **Visual Display:** The graphical interface can only display a maximum of four item text strings simultaneously due to the 48-pixel height constraint of the Control Panel.  
* **Scrolling Mechanics:** To navigate the inventory array, the interface relies on two directional arrow sprites located at X: 304, Y: 152 (Up) and X: 304, Y: 184 (Down). Clicking these arrows iterates the display index of the inventory array, exposing items hidden off-screen31.  
* **Interaction Behavior:** Clicking a displayed inventory item appends its semantic ID to the Sentence Line as a target object. It functions seamlessly within the verb-object syntax (e.g., clicking "Use", then clicking "Flashlight" in the inventory results in the sentence prefix "Use Flashlight with ")26.

### **2.4. Typography, Dialog Rendering, and Timing**

The textual presentation of dialog and system messages is critical to the game's aesthetic and narrative delivery. The engine utilizes a monospaced, 8-bit bitmapped font, where each character occupies a rigid 8x8 pixel bounding box32.

* **Dynamic Rendering:** Text is not constrained to a static dialog box. Instead, dialog is rendered dynamically in the Action Area, floating directly above the bounding box of the speaking actor to visually anchor the speech to the character.  
* **Color Coding:** To enhance readability and characterize the dialogue, text is strictly color-coded using the global 256-color palette33. Each character archetype is assigned a specific hexadecimal equivalent:  
  * The Protagonist: Deep Blue (\#0000AA)  
  * The Scholar: Bright Green (\#00AA00)  
  * The Rocker: Vibrant Magenta (\#AA00AA)  
  * The Frightening Matron: Blood Red (\#AA0000)  
  * System Prompts / Sentence Line: Pure White (\#FFFFFF) or Light Gray (\#AAAAAA)  
* **Procedural Timing:** The duration a line of dialog remains on screen is not hardcoded. The engine calculates the display time procedurally based on string length, ensuring players have adequate time to read. The algorithm follows a standard formula: display\_time\_ms \= (character\_count \* 50\) \+ 1000\. This ensures a baseline minimum display time of one second for even the shortest exclamations7.

## **3\. CORE MECHANICS & PHYSICS**

The mechanical foundation of the target software relies entirely on discrete 2D mathematics. It explicitly eschews modern continuous physics engines, rigid-body dynamics, or floating-point collision resolving. Movement and interaction are strictly governed by polygonal constraints and predefined coordinate mapping.

### **3.1. Click-to-Move & The Walkbox NavMesh**

Actor navigation is constrained by a network of invisible polygonal regions known as **Walkboxes**17. The entire walkable surface of a room is defined by these interconnected polygons.

> 1. **Walkbox Definition:** Each walkbox is mathematically defined by an array of 2D vertices (\[x1, y1\], \[x2, y2\], ...). These vertices form a convex polygon within the 320x200 screen space17.  
> 2. **The NavMesh Graph:** Walkboxes are not isolated; they are linked together via shared edges. The engine maintains a mathematical matrix that defines which boxes connect to one another, forming a traversable Navigation Mesh (NavMesh)17.  
> 3. **Pathfinding Algorithm:** When the Input Manager detects a valid "Walk to" command, the engine executes a multi-step pathfinding routine18:  
   * It identifies the target Walkbox containing the user's clicked destination coordinate.  
   * It identifies the origin Walkbox containing the active actor's current baseline coordinate.  
   * It executes an A\* (A-Star) or Dijkstra search algorithm across the Walkbox matrix to determine the shortest logical sequence of connected boxes required to reach the destination18.  
   * The engine calculates straight-line movement vectors through the calculated midpoints of the shared edges connecting the sequential walkboxes. The actor sprite is then translated along these vectors frame-by-frame until the destination is reached11.  
> 4. **Perspective Scaling:** As detailed in the rendering architecture, each Walkbox possesses scale\_min and scale\_max parameters. The engine linearly interpolates the actor's scale based on their Y-axis delta within the box, simulating Z-depth perspective17.

### **3.2. Discrete Collision Detection**

Collision detection in the engine is separated into two distinct paradigms: mouse-to-object interaction and actor-to-environment constraints.

* **Mouse-to-Object (Picking):** Environmental objects and actors define a 2D bounding box (or, in more complex geometries, a simplified picking polygon)6. The engine utilizes a standard point-in-polygon algorithm to check if the user's cursor coordinates intersect with a valid object during a click event. This intersection is what populates the object noun in the Sentence Line1.  
* **Actor-to-Environment (Pathing):** Actors do not possess collision hulls that push against walls. Instead, spatial constraints are entirely dictated by the boundaries of the Walkboxes. If a mathematical coordinate falls outside all defined Walkboxes in a room, it is deemed impassable terrain. The engine simply refuses to plot a path to that coordinate, effectively preventing the actor from walking through walls or over obstacles without requiring continuous physics calculations17.

### **3.3. Interaction Distance, Actor Facing, and Animation States**

A core tenet of the engine's design is that executing a verb on an environmental object requires the actor to be in physical proximity to that object. The engine enforces spatial realism before triggering event logic.

> 1. **The Walk-To Coordinate:** Every interactable object in the game possesses predefined spatial parameters: interact\_x, interact\_y, and interact\_facing12.  
> 2. **The Interaction Execution Loop:**  
   * The user constructs a valid sentence, e.g., "Open Grand Entrance Doors"25.  
   * The engine intercepts the command and temporarily pauses user input13.  
   * The pathfinding module commands the actor to navigate via the NavMesh to the specific interact\_x and interact\_y coordinates associated with the doors12.  
   * Upon arrival, the engine triggers an animation state change, updating the actor's sprite to match the interact\_facing parameter (which must be one of the four cardinal directions: UP, DOWN, LEFT, RIGHT)11.  
   * With the spatial preconditions met, the engine finally fires the object's on\_open event script, updating the game state and triggering any associated animations or audio1.  
   * The script concludes, and the engine resumes user input, restoring control to the player13.

## **4\. VERB-OBJECT EVENT MATRIX**

The Verb-Object Event Matrix forms the logical core of the game's interactive systems. It defines the strict, hardcoded responses for specific combinations of verbs and environmental objects. The engine evaluates these combinations through an event-handling state machine36.

If a user constructs a sentence whose verb-object combination is not explicitly defined in the matrix (an unhandled event), the engine routes the command to a fallback subroutine. This routine triggers a default, verb-specific negative response from the active character (e.g., attempting to "Pick up" a heavy static object like a refrigerator will trigger the dialogue, "I can't pick that up," or attempting to "Talk to" an inanimate object will trigger, "It has nothing to say.")9.

### **4.1. Core Environmental Objects & Mechanical Puzzles**

The following matrix outlines the critical puzzle dependencies and state changes required for progression through the first four areas.

&nbsp;

| Object Semantic ID | Verb | Execution Pre-Conditions | Internal State Change & Engine Action | Observable Output & Feedback |
| :---- | :---- | :---- | :---- | :---- |
| **OBJ\_DOORMAT** | Pull | None | mat\_moved \= true | Actor plays pull animation. Doormat sprite translates left. Reveals OBJ\_BRASS\_KEY underneath38. |
| **OBJ\_DOORMAT** | Look at | mat\_moved \== false | None | Character dialogue: "It says 'Welcome to the Eccentric Estate'." |
| **OBJ\_BRASS\_KEY** | Pick up | mat\_moved \== true | inventory.add(OBJ\_BRASS\_KEY), OBJ\_BRASS\_KEY.visible \= false | The key sprite is destroyed/hidden from the room background. The item icon populates in the active actor's UI inventory21. |
| **OBJ\_FRONT\_DOOR** | Unlock | Sentence exactly: "Unlock Front Door with Brass Key" | front\_door\_locked \= false | Audio trigger: sfx\_unlock.wav. Character dialogue: "It's unlocked."26 |
| **OBJ\_FRONT\_DOOR** | Open | front\_door\_locked \== false | front\_door\_open \= true | Door sprite updates to its 'Open' frame. The engine enables the NavMesh Walkbox connection to Area 2 (The Foyer)41. |
| **OBJ\_GARGOYLE** | Push | None | foyer\_right\_door\_open \= true | Gargoyle finial depresses. Audio trigger: heavy stone grinding. The heavy right door in the Foyer slowly clicks open39. |
| **OBJ\_GARGOYLE** | Pull | None | foyer\_right\_door\_open \= false | Gargoyle resets to default position. The right door in the Foyer swings shut and locks. |
| **OBJ\_FRIDGE** | Open | None | fridge\_open \= true | Fridge door sprite updates to 'Open'. Reveals multiple internal items for interaction39. |
| **OBJ\_ANT\_RADIO** | Open | None | radio\_open \= true | Radio back panel sprite is removed. Reveals OBJ\_VACUUM\_TUBE nested inside41. |
| **OBJ\_CHANDELIER** | Look at | None | None | Character dialogue: "There is a rusty key resting on the glass."41 |

### **4.2. Inter-Item and Character Matrix**

This matrix governs how inventory items interact with one another and how objects are transferred between characters, which is a vital mechanic for solving asymmetric puzzles.

&nbsp;

| Source Item | Target Item / Actor | Verb | Execution Pre-Conditions | State Change & Effect |
| :---- | :---- | :---- | :---- | :---- |
| **OBJ\_OLD\_BATT** | **OBJ\_FLASHLIGHT** | Use | Both items must be present in the active actor's inventory array. | flashlight\_powered \= true. The OBJ\_OLD\_BATT item is consumed and permanently removed from the inventory39. |
| **OBJ\_AUDIO\_TAPE** | **OBJ\_TAPE\_DECK** | Use | Audio Tape in inventory, Tape Deck door is physically open in the room. | tape\_inserted \= true. The OBJ\_AUDIO\_TAPE item is consumed from inventory and nested within the deck logic38. |
| **Any Item** | **Any Actor** | Give | Both the active actor and the target actor must occupy the same Room coordinate space. | The engine executes an array transfer. The item ID is popped from Actor A's inventory array and pushed to Actor B's inventory array. Enables cooperative puzzle solving39. |

## **5\. ROOM SPECIFICATIONS (FIRST 4 ROOMS)**

These detailed specifications provide the exact spatial data, boundary mathematics, object hierarchies, and local script logic required to construct the initial game states for the first four playable areas. The engine relies on these parameters to build the navigation mesh and handle rendering priorities34.

### **5.1. Area 1: The Approach (Exterior Driveway / Porch)**

The opening area serves as the player's introduction to the UI and spatial navigation. It establishes the atmosphere and presents the first mechanical obstacle: gaining entry to the estate.

* **Internal Dimensions:** 640 x 200 pixels. The room utilizes horizontal camera scrolling, as it exceeds the 320-pixel viewport width.  
* **Background Asset:** bg\_approach.png  
* **Default BGM:** Ambient night sounds. A local script thread plays sfx\_crickets.wav on a continuous loop13.

#### **Walkboxes (Coordinates formatted as \[x1,y1\], \[x2,y2\]...)**

The NavMesh guides the player from the driveway up to the elevated porch.

* WB\_DRIVEWAY: \[0,144\], \[640,144\], \[640,180\], \[0,180\] (Scale Interpolation: 100% to 100%)  
* WB\_PATH: \[280,144\], \[360,144\], \[340,110\], \[300,110\] (Scale Interpolation: 100% at bottom, shrinking to 80% at top to simulate depth)  
* WB\_PORCH: \[240,110\], \[400,110\], \[400,90\], \[240,90\] (Scale Interpolation: 80% to 70%)

#### **Z-Planes (Depth Masking)**

* ZP\_BUSHES\_LEFT: A masking polygon covering the dense foliage on the left side of the screen (\[0,144\] to \[150,200\]). Baseline Y: 160\. If an actor walks behind the bushes (Y \< 160), this plane renders over them, partially obscuring the sprite.  
* ZP\_PORCH\_RAIL: A masking polygon covering the wooden railing of the porch (\[240,110\] to \[280,130\]). Baseline Y: 115\.

#### **Interactable Objects**

&nbsp;

| Object Name | Semantic ID | Bounding Box (Pixels) | Interact Pos (X, Y, Dir) | Default Logic State |
| :---- | :---- | :---- | :---- | :---- |
| Heavy Doormat | OBJ\_DOORMAT | \[290,100\] \- \[350,110\] | 320, 105, DOWN | moved: false |
| Brass Key | OBJ\_BRASS\_KEY | \[315,102\] \- \[325,107\] | 320, 105, DOWN | visible: false |
| Grand Doors | OBJ\_FRONT\_DOOR | \[280,30\] \- \[360,90\] | 320, 95, UP | locked: true, open: false |
| Warning Sign | OBJ\_SIGN | \[50,90\] \- \[90,130\] | 70, 145, UP | Static. (Text: "Beware of Occupants") |
| Suspicious Package | OBJ\_PACKAGE | \[100,160\] \- \[120,170\] | 110, 165, DOWN | visible: true. (Contains stamps/film equivalent)40 |

#### **Local Scripts & Events**

* on\_room\_enter: The engine evaluates the global flag front\_door\_open. If true, the engine dynamically enables the NavMesh edge connecting WB\_PORCH to the entry coordinate of Area 2: WB\_FOYER\_ENTRY1.

### **5.2. Area 2: The Entry Hallway (Foyer)**

The Foyer acts as the central hub of the ground floor, branching off into multiple crucial areas. It introduces complex multi-door navigation and hidden mechanisms.

* **Internal Dimensions:** 480 x 200 pixels (Horizontal Scrolling required).  
* **Background Asset:** bg\_foyer.png  
* **Default BGM:** An oppressive silence broken only by a local script thread looping the heavy, rhythmic ticking of a grandfather clock (sfx\_ticktock.wav)13.

#### **Walkboxes**

* WB\_FOYER\_MAIN: \[40,144\], \[440,144\], \[440,110\], \[40,110\] (Scale Interpolation: 100% to 85%)  
* WB\_STAIRS: \[200,110\], \[280,110\], \[260,40\], \[220,40\] (Scale Interpolation: 85% at the base, drastically shrinking to 50% at the top landing to force a strong perspective shift).

#### **Z-Planes (Depth Masking)**

* ZP\_STAIR\_BANISTER: A complex masking polygon precisely tracing the ornate wooden staircase railing. The Baseline Y is calculated dynamically based on the slope of the stairs to ensure the actor's legs are properly occluded as they ascend.

#### **Interactable Objects**

&nbsp;

| Object Name | Semantic ID | Bounding Box (Pixels) | Interact Pos (X, Y, Dir) | Default Logic State |
| :---- | :---- | :---- | :---- | :---- |
| Grandfather Clock | OBJ\_CLOCK | \[60,40\] \- \[100,130\] | 80, 135, UP | Static |
| Left Door | OBJ\_DOOR\_KITCHEN | \[10,60\] \- \[40,130\] | 45, 120, LEFT | locked: false, open: false |
| Right Door | OBJ\_DOOR\_PARLOR | \[440,60\] \- \[470,130\] | 435, 120, RIGHT | locked: false, open: false |
| Gargoyle Finial | OBJ\_GARGOYLE | \[290,80\] \- \[310,110\] | 300, 115, UP | pushed: false |
| Heavy Steel Door | OBJ\_DOOR\_BASE | \[330,60\] \- \[380,110\] | 355, 115, UP | locked: true, open: false (Leads to basement/dungeon equivalent)39 |

#### **Local Scripts & Events**

* on\_gargoyle\_push: The engine pauses input, plays sfx\_stone\_grind.wav, and sets OBJ\_DOOR\_BASE.open \= true. The background tilemap is updated to swap the closed door sprite for the open doorway sprite, revealing the dark path to the basement41.  
* on\_room\_enter\_first\_time: A global cutscene trigger evaluates if this is the player's first entry. If true, the engine freezes local threads, forces the camera to pan to the top of the stairs, and spawns a brief, non-interactive animation of "The Militant Son" character walking down the hall, establishing the threat of hostile NPCs roaming the house13.

### **5.3. Area 3: The Cookery (Kitchen)**

The Cookery is a resource-dense environment critical for solving numerous subsequent puzzles. It requires detailed object state management due to the high density of interactable items stored within other objects.

* **Internal Dimensions:** 640 x 200 pixels (Horizontal Scrolling required).  
* **Background Asset:** bg\_cookery.png  
* **Default BGM:** None. Ambient hum of the refrigerator.

#### **Walkboxes**

* WB\_COOKERY\_FLOOR: \[0,144\], \[640,144\], \[640,110\], \[0,110\] (Scale Interpolation: 100% to 85%)

#### **Z-Planes (Depth Masking)**

* ZP\_ISLAND\_COUNTER: A masking polygon covering the large center kitchen island. Baseline Y: 125\. Crucial for allowing characters to walk "behind" the counter while remaining visible from the chest up.

#### **Interactable Objects**

&nbsp;

| Object Name | Semantic ID | Bounding Box (Pixels) | Interact Pos (X, Y, Dir) | Default Logic State |
| :---- | :---- | :---- | :---- | :---- |
| Cookery Door | OBJ\_DOOR\_COOKERY | \[600,60\] \- \[630,130\] | 595, 120, RIGHT | open: true (Must mathematically mirror the state of the Foyer Left Door) |
| Industrial Fridge | OBJ\_FRIDGE | \[50,50\] \- \[130,120\] | 90, 125, UP | open: false |
| Pungent Cheese | OBJ\_CHEESE | \[60,60\] \- \[80,75\] | 90, 125, UP | visible: false (Rendered inside Fridge)40 |
| Fizzy Cola Can | OBJ\_COLA | \[90,60\] \- \[100,75\] | 90, 125, UP | visible: false (Rendered inside Fridge)40 |
| Wilted Lettuce | OBJ\_LETTUCE | \[60,90\] \- \[80,105\] | 90, 125, UP | visible: false (Rendered inside Fridge)40 |
| Heavy Flashlight | OBJ\_FLASHLIGHT | \[200,90\] \- \[220,100\] | 210, 115, UP | visible: true (Resting on counter)39 |
| Old Batteries | OBJ\_OLD\_BATT | \[230,95\] \- \[240,100\] | 235, 115, UP | visible: true (Resting on counter)39 |
| Microwave Oven | OBJ\_MICROWAVE | \[300,70\] \- \[350,95\] | 325, 115, UP | open: false, running: false \[cite: 13, 42\] |
| Faucet | OBJ\_FAUCET | \[400,80\] \- \[420,95\] | 410, 115, UP | flowing: false |

#### **Local Scripts & Events**

* on\_fridge\_open: The engine sets OBJ\_CHEESE.visible \= true, OBJ\_COLA.visible \= true, and OBJ\_LETTUCE.visible \= true. The script swaps the base Fridge sprite for the open frame, dynamically drawing the newly visible items on top39.  
* on\_faucet\_turnon: Instantiates a local cooperative thread named thread\_water\_drip. This thread continuously plays sfx\_water.wav and cycles through water animation frames on a 150ms timer until explicitly stopped. This is required for filling the empty glass jar (found later) to solve the radioactive water puzzle13.  
* on\_faucet\_turnoff: The engine terminates thread\_water\_drip and resets the faucet sprite to its default static frame13.

### **5.4. Area 4: The Parlor (Living Room)**

The Parlor is an intimate, single-screen environment that contains a multi-step, logic-heavy puzzle requiring sequence breaking and item combination to solve.

* **Internal Dimensions:** 320 x 200 pixels. (No Camera Scrolling. The entire room fits within the viewport).  
* **Background Asset:** bg\_parlor.png  
* **Default BGM:** None.

#### **Walkboxes**

* WB\_PARLOR\_MAIN: \[0,144\], \[320,144\], \[320,110\], \[0,110\] (Scale Interpolation: 100% to 85%). A simple trapezoidal navmesh covering the visible floor space.

#### **Z-Planes (Depth Masking)**

* ZP\_COUCH: A masking polygon tracing the large sofa positioned in the immediate foreground. Baseline Y: 135\. This prevents actors from appearing to walk "on top" of the furniture.

#### **Interactable Objects**

&nbsp;

| Object Name | Semantic ID | Bounding Box (Pixels) | Interact Pos (X, Y, Dir) | Default Logic State |
| :---- | :---- | :---- | :---- | :---- |
| Parlor Door | OBJ\_DOOR\_FOYER\_R | \[10,60\] \- \[40,130\] | 45, 120, LEFT | open: true (Must mirror Foyer Right Door state) |
| Media Cabinet | OBJ\_CABINET | \[200,80\] \- \[260,120\] | 230, 125, UP | open: false |
| Tape Deck | OBJ\_TAPE\_DECK | \[210,90\] \- \[250,110\] | 230, 125, UP | visible: false (Hidden inside Cabinet)41 |
| Antique Radio | OBJ\_ANT\_RADIO | \[220,50\] \- \[250,80\] | 235, 125, UP | open: false |
| Vacuum Tube | OBJ\_VACUUM\_TUBE | \[230,60\] \- \[240,75\] | 235, 125, UP | visible: false (Hidden inside Radio)39 |
| Glass Chandelier | OBJ\_CHANDELIER | \[130,10\] \- \[190,50\] | 160, 115, UP | shattered: false |
| Rusty Key | OBJ\_RUSTY\_KEY | \[155,30\] \- \[165,40\] | 160, 115, UP | attached\_to\_chandelier: true |
| Loose Wood Panel | OBJ\_PANEL | \[280,70\] \- \[300,110\] | 290, 115, UP | open: false |
| Blank Audio Tape | OBJ\_AUDIO\_TAPE | \[285,80\] \- \[295,90\] | 290, 115, UP | visible: false (Hidden inside Panel)41 |

#### **Local Scripts & Events**

The Parlor contains a complex, highly specific event sequence required to retrieve the Rusty Key, which is initially unreachable by the actors.

* on\_cabinet\_open: Executes logic to set OBJ\_TAPE\_DECK.visible \= true42.  
* on\_radio\_open: Executes logic to set OBJ\_VACUUM\_TUBE.visible \= true39.  
* on\_panel\_open: Executes logic to set OBJ\_AUDIO\_TAPE.visible \= true39.  
* tape\_deck\_play\_high\_pitch: This is the primary **Puzzle Trigger**. The script evaluates a complex conditional check: If OBJ\_TAPE\_DECK is toggled "Turn on" AND its internal inventory array contains the item OBJ\_AUDIO\_TAPE\_HIGH\_FREQ (which is the blank audio tape that must be recorded upon later in a different room and brought back)38:  
  * The engine initiates a cutscene lock, freezing all user input and halting background global threads13.  
  * The audio subsystem triggers sfx\_glass\_shatter.wav at maximum volume.  
  * The state flag OBJ\_CHANDELIER.shattered is set to true. The engine swaps the pristine chandelier sprite for the broken variant38.  
  * The state flag OBJ\_RUSTY\_KEY.attached\_to\_chandelier is set to false.  
  * The engine executes a hardcoded animation, interpolating OBJ\_RUSTY\_KEY's Y-coordinate, simulating it falling to the floor (Y \= 120).  
  * Crucially, the script updates OBJ\_RUSTY\_KEY's interaction bounding box and interact\_y parameter to match the new floor coordinate, allowing the player to finally execute a "Pick up" command on it38.  
  * The script releases the cutscene lock, unfreezes the threads, and resumes standard user input polling13.

#### **Works cited**

> 1. DISE:AGame Technology-based Digital Interactive Storytelling, [https://researchonline.ljmu.ac.uk/id/eprint/6101/1/555598.pdf](https://researchonline.ljmu.ac.uk/id/eprint/6101/1/555598.pdf)  
> 2. Introduction to game development \[2nd ed., International ed, [https://dokumen.pub/introduction-to-game-development-2nd-ed-international-ed-9781584506799-1584506792-1584507055-9780840031037-0840031033.html](https://dokumen.pub/introduction-to-game-development-2nd-ed-international-ed-9781584506799-1584506792-1584507055-9780840031037-0840031033.html)  
> 3. (PDF) Ready: A Commodore 64 Retrospective \- ResearchGate, [https://www.researchgate.net/publication/285502951\_Ready\_A\_commodore\_64\_retrospective](https://www.researchgate.net/publication/285502951_Ready_A_commodore_64_retrospective)  
> 4. How to Make Your Own C++ Game Engine, [https://www.gamedeveloper.com/game-platforms/how-to-make-your-own-c-game-engine](https://www.gamedeveloper.com/game-platforms/how-to-make-your-own-c-game-engine)  
> 5. Super Simple State Machine \- Keith M. Programming \- WordPress.com, [https://keithmaggio.wordpress.com/code/supersimplestatemachine/](https://keithmaggio.wordpress.com/code/supersimplestatemachine/)  
> 6. SCUMM v5 — Opcode Dispatch \+ Bytecode Conventions \- GrogVM, [https://grogvm.dev/docs/scumm/opcodes/](https://grogvm.dev/docs/scumm/opcodes/)  
> 7. SCUMM v5 timing — the jiffy / frame split \- GrogVM, [https://grogvm.dev/docs/scumm/timing/](https://grogvm.dev/docs/scumm/timing/)  
> 8. Andy's GSoC Blog, [https://blogs.scummvm.org/andy/](https://blogs.scummvm.org/andy/)  
> 9. SCUMM/V5 opcodes \- ScummVM :: Wiki, [https://wiki.scummvm.org/index.php/SCUMM/V5\_opcodes](https://wiki.scummvm.org/index.php/SCUMM/V5_opcodes)  
> 10. Release notes — ScummVM Documentation documentation, [https://docs.scummvm.org/en/latest/help/release.html](https://docs.scummvm.org/en/latest/help/release.html)  
> 11. SCUMM Tutorial 0.1 \- Start Page, [https://tandell.com/misc/SCUMM-Tutorial-0.1.pdf](https://tandell.com/misc/SCUMM-Tutorial-0.1.pdf)  
> 12. The SCUMM Diary: Stories behind one of the greatest game, [https://www.gamedeveloper.com/design/the-scumm-diary-stories-behind-one-of-the-greatest-game-engines-ever-made](https://www.gamedeveloper.com/design/the-scumm-diary-stories-behind-one-of-the-greatest-game-engines-ever-made)  
> 13. Implementing cutscenes \- Official Thimbleweed Park Forums, [https://forums.thimbleweedpark.com/t/implementing-cutscenes/2836](https://forums.thimbleweedpark.com/t/implementing-cutscenes/2836)  
> 14. Core Techniques and Algorithms in Game Programming, [https://theswissbay.ch/pdf/Gentoomen%20Library/Algorithms/Core%20Techniques%20and%20Algorithms%20in%20Game%20Programming.pdf](https://theswissbay.ch/pdf/Gentoomen%20Library/Algorithms/Core%20Techniques%20and%20Algorithms%20in%20Game%20Programming.pdf)  
> 15. The Art of Point-and-Click Adventure Games 0995658668, [https://dokumen.pub/the-art-of-point-and-click-adventure-games-0995658668-9780995658660.html](https://dokumen.pub/the-art-of-point-and-click-adventure-games-0995658668-9780995658660.html)  
> 16. PS VITA / PS TV \- ScummVM | PSX-Place, [https://www.psx-place.com/threads/scummvm.29676/](https://www.psx-place.com/threads/scummvm.29676/)  
> 17. SCUMM/Technical Reference/Box resources \- ScummVM :: Wiki, [https://wiki.scummvm.org/index.php/SCUMM/Technical\_Reference/Box\_resources](https://wiki.scummvm.org/index.php/SCUMM/Technical_Reference/Box_resources)  
> 18. apps — ximg.app, [https://apps.ximg.app/](https://apps.ximg.app/)  
> 19. ags.md \- Github-Gist, [https://gist.github.com/sonneveld/08fd441cebc94da9a1112ad8bf6fd1e9](https://gist.github.com/sonneveld/08fd441cebc94da9a1112ad8bf6fd1e9)  
> 20. Script Writing Guide for Beginners | PDF \- Scribd, [https://www.scribd.com/document/873336447/Modding-Skyrim-Scripter-s-Edition](https://www.scribd.com/document/873336447/Modding-Skyrim-Scripter-s-Edition)  
> 21. User Manual \- Adventure Creator, [https://adventurecreator.org/files/Manual.pdf](https://adventurecreator.org/files/Manual.pdf)  
> 22. scumm-8/src/game.p8 at master \- GitHub, [https://github.com/Liquidream/scumm-8/blob/master/src/game.p8](https://github.com/Liquidream/scumm-8/blob/master/src/game.p8)  
> 23. Game Design Essentials \[1 ed.\] 9781118159279, 9781118226094, [https://dokumen.pub/game-design-essentials-1nbsped-9781118159279-9781118226094-9781118239339-9781118264072.html](https://dokumen.pub/game-design-essentials-1nbsped-9781118159279-9781118226094-9781118239339-9781118264072.html)  
> 24. Turn-based Strategy Video Game Engine for Mobile Devices, [https://upcommons.upc.edu/bitstreams/a0dea6f2-f15f-4353-acda-32bceb480c72/download](https://upcommons.upc.edu/bitstreams/a0dea6f2-f15f-4353-acda-32bceb480c72/download)  
> 25. Complete Guide \- Steam Community, [https://steamcommunity.com/sharedfiles/filedetails/?l=german\&id=148869000%2F1000](https://steamcommunity.com/sharedfiles/filedetails/?l=german&id=148869000/1000)  
> 26. Maniac Mansion \- Guide and Walkthrough \- PC \- By TSC \- GameFAQs, [https://gamefaqs.gamespot.com/pc/468722-maniac-mansion/faqs/34332](https://gamefaqs.gamespot.com/pc/468722-maniac-mansion/faqs/34332)  
> 27. Far Far Futures \- Joey Jones on Interactive Fiction, [https://farfarfutures.wordpress.com/category/interactive-fiction-2/](https://farfarfutures.wordpress.com/category/interactive-fiction-2/)  
> 28. Extending Experiences \- Lauda, [https://lauda.ulapland.fi/bitstream/handle/10024/61794/eexp\_final%5B1%5D.pdf?sequence=3\&isAllowed=y](https://lauda.ulapland.fi/bitstream/handle/10024/61794/eexp_final%5B1%5D.pdf?sequence=3&isAllowed=y)  
> 29. cleanroom-task.md  
> 30. Bug Reports for v1.0.143.0 \- Larian Studios forums, [https://forums.larian.com/ubbthreads.php?ubb=showflat\&Number=482444\&page=all](https://forums.larian.com/ubbthreads.php?ubb=showflat&Number=482444&page=all)  
> 31. Myst and Riven: The World of the D'ni (Landmark Video Games), [https://library.oapen.org/bitstream/handle/20.500.12657/24017/1006116.pdf?sequence=1\&isAllowed=y](https://library.oapen.org/bitstream/handle/20.500.12657/24017/1006116.pdf?sequence=1&isAllowed=y)  
> 32. Game — ScummVM Documentation documentation, [https://docs.scummvm.org/en/latest/settings/game.html](https://docs.scummvm.org/en/latest/settings/game.html)  
> 33. SCUMM/Technical Reference/String format \- ScummVM :: Wiki, [https://wiki.scummvm.org/index.php/SCUMM/Technical\_Reference/String\_format](https://wiki.scummvm.org/index.php/SCUMM/Technical_Reference/String_format)  
> 34. SCUMM/Technical Reference/Room resources \- ScummVM :: Wiki, [https://wiki.scummvm.org/index.php?title=SCUMM/Technical\_Reference/Room\_resources](https://wiki.scummvm.org/index.php?title=SCUMM/Technical_Reference/Room_resources)  
> 35. SCUMM/Technical Reference/Script resources \- ScummVM :: Wiki, [https://wiki.scummvm.org/index.php/SCUMM/Technical\_Reference/Script\_resources](https://wiki.scummvm.org/index.php/SCUMM/Technical_Reference/Script_resources)  
> 36. State · Design Patterns Revisited \- Game Programming Patterns, [https://gameprogrammingpatterns.com/state.html](https://gameprogrammingpatterns.com/state.html)  
> 37. Keep Your Sanity With Event Handling State Machines \- sf softwareist, [https://www.sfsoftwareist.com/2011/11/21/keep-your-sanity-with-event-handling-state-machines/](https://www.sfsoftwareist.com/2011/11/21/keep-your-sanity-with-event-handling-state-machines/)  
> 38. Maniac Mansion walkthrough by Steve Novicki \- Just Adventure, [https://www.justadventure.com/walkthrough/maniac-2/](https://www.justadventure.com/walkthrough/maniac-2/)  
> 39. Maniac Mansion \- Guide and Walkthrough \- NES \- By geluf, [https://gamefaqs.gamespot.com/nes/563438-maniac-mansion/faqs/16769](https://gamefaqs.gamespot.com/nes/563438-maniac-mansion/faqs/16769)  
> 40. Items | Maniac Mansion Wiki \- Fandom, [https://maniacmansion.fandom.com/wiki/Items](https://maniacmansion.fandom.com/wiki/Items)  
> 41. Maniac Mansion (Maniac\_Mansion.txt) \- :: CASA ::, [https://solutionarchive.com/file/id,6891/](https://solutionarchive.com/file/id,6891/)  
> 42. Maniac Mansion/Mansion layout \- StrategyWiki, [https://strategywiki.org/wiki/Maniac\_Mansion/Mansion\_layout](https://strategywiki.org/wiki/Maniac_Mansion/Mansion_layout)  
> 43. Walkthrough \- IGN, [https://www.ign.com/articles/2005/03/16/maniac-mansion-walkthrough-596619](https://www.ign.com/articles/2005/03/16/maniac-mansion-walkthrough-596619)