import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../src/packages/engine';

describe('Puzzle Chains & Spec-Defined Interaction Behavior', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  it('pulls doormat to reveal brass key, then picks up key and unlocks front door', () => {
    const actor = engine.actorManager.getActiveActor();
    const doormat = engine.roomManager.getObject('OBJ_DOORMAT')!;
    const key = engine.roomManager.getObject('OBJ_BRASS_KEY')!;
    const frontDoor = engine.roomManager.getObject('OBJ_FRONT_DOOR')!;

    expect(key.visible).toBe(false);
    expect(frontDoor.locked).toBe(true);
    expect(frontDoor.open).toBe(false);

    // 1. Pull Doormat
    engine.eventDispatcher.executeCommand({
      verb: 'PULL',
      directObj: doormat,
    });
    // In automated test, advance VM threads
    for (let i = 0; i < 60; i++) engine.update(0.1);

    expect(key.visible).toBe(true);

    // 2. Pick up Brass Key
    engine.eventDispatcher.executeCommand({
      verb: 'PICK_UP',
      directObj: key,
    });
    for (let i = 0; i < 60; i++) engine.update(0.1);

    expect(key.visible).toBe(false);
    expect(actor.hasItem('OBJ_BRASS_KEY')).toBe(true);

    // 3. Unlock Front Door with Brass Key
    engine.eventDispatcher.executeCommand({
      verb: 'UNLOCK',
      directObj: frontDoor,
      indirectObj: { id: 'OBJ_BRASS_KEY', name: 'Brass Key', isInventory: true },
    });
    for (let i = 0; i < 60; i++) engine.update(0.1);

    expect(frontDoor.locked).toBe(false);

    // 4. Open Front Door
    engine.eventDispatcher.executeCommand({
      verb: 'OPEN',
      directObj: frontDoor,
    });
    for (let i = 0; i < 60; i++) engine.update(0.1);

    expect(frontDoor.open).toBe(true);
  });

  it('pushes gargoyle finial in Foyer to unlock heavy steel basement door', () => {
    engine.roomManager.setCurrentRoom('AREA_FOYER');
    const gargoyle = engine.roomManager.getObject('OBJ_GARGOYLE')!;
    const baseDoor = engine.roomManager.getObject('OBJ_DOOR_BASE')!;

    expect(baseDoor.locked).toBe(true);

    engine.eventDispatcher.executeCommand({
      verb: 'PUSH',
      directObj: gargoyle,
    });
    for (let i = 0; i < 20; i++) engine.update(0.1);

    expect(baseDoor.locked).toBe(false);
    expect(baseDoor.open).toBe(true);
  });

  it('combines old batteries with heavy flashlight to produce powered flashlight', () => {
    const actor = engine.actorManager.getActiveActor();
    actor.addItem({ id: 'OBJ_FLASHLIGHT', name: 'Heavy Flashlight', description: 'desc' });
    actor.addItem({ id: 'OBJ_OLD_BATT', name: 'Old Batteries', description: 'desc' });

    engine.eventDispatcher.executeCommand({
      verb: 'USE',
      directObj: { id: 'OBJ_OLD_BATT', name: 'Old Batteries', isInventory: true },
      indirectObj: { id: 'OBJ_FLASHLIGHT', name: 'Heavy Flashlight', isInventory: true },
    });

    expect(actor.hasItem('OBJ_OLD_BATT')).toBe(false);
    expect(actor.hasItem('OBJ_FLASHLIGHT')).toBe(false);
    expect(actor.hasItem('OBJ_FLASHLIGHT_POWERED')).toBe(true);
  });

  it('opens industrial fridge to reveal cheese, cola, and lettuce', () => {
    engine.actorManager.setActiveActor('syd');
    engine.roomManager.setCurrentRoom('AREA_COOKERY');
    const fridge = engine.roomManager.getObject('OBJ_FRIDGE')!;
    const cheese = engine.roomManager.getObject('OBJ_CHEESE')!;
    const cola = engine.roomManager.getObject('OBJ_COLA')!;
    const lettuce = engine.roomManager.getObject('OBJ_LETTUCE')!;

    expect(cheese.visible).toBe(false);
    expect(cola.visible).toBe(false);
    expect(lettuce.visible).toBe(false);

    engine.eventDispatcher.executeCommand({
      verb: 'OPEN',
      directObj: fridge,
    });
    for (let i = 0; i < 40; i++) engine.update(0.1);

    expect(fridge.open).toBe(true);
    expect(cheese.visible).toBe(true);
    expect(cola.visible).toBe(true);
    expect(lettuce.visible).toBe(true);
  });

  it('executes parlor chandelier shatter puzzle with high-frequency audio tape', () => {
    engine.roomManager.setCurrentRoom('AREA_PARLOR');
    const actor = engine.actorManager.getActiveActor();
    const tapeDeck = engine.roomManager.getObject('OBJ_TAPE_DECK')!;
    const chandelier = engine.roomManager.getObject('OBJ_CHANDELIER')!;
    const rustyKey = engine.roomManager.getObject('OBJ_RUSTY_KEY')!;

    expect(chandelier.shattered).toBe(false);
    expect(rustyKey.attachedToChandelier).toBe(true);

    // Provide high frequency tape
    actor.addItem({ id: 'OBJ_AUDIO_TAPE_HIGH_FREQ', name: 'High-Pitch Audio Tape', description: 'desc' });

    engine.eventDispatcher.executeCommand({
      verb: 'TURN_ON',
      directObj: tapeDeck,
    });

    // Advance VM cutscene thread (1.5 seconds)
    for (let i = 0; i < 30; i++) engine.update(0.1);

    expect(chandelier.shattered).toBe(true);
    expect(rustyKey.attachedToChandelier).toBe(false);
    expect(rustyKey.y).toBe(120);

    // Now actor can pick up the rusty key
    engine.eventDispatcher.executeCommand({
      verb: 'PICK_UP',
      directObj: rustyKey,
    });
    for (let i = 0; i < 20; i++) engine.update(0.1);

    expect(actor.hasItem('OBJ_RUSTY_KEY')).toBe(true);
  });
});
