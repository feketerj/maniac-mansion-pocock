import { ActorManager, Actor } from './actor';
import { AudioSystem } from './audio';
import { RoomManager } from './rooms';
import { RoomObject, VerbType } from './types';
import { VirtualMachine } from './vm';

export interface CommandContext {
  verb: VerbType;
  directObj: { id: string; name: string; isInventory?: boolean };
  indirectObj?: { id: string; name: string; isInventory?: boolean } | null;
}

export class EventDispatcher {
  constructor(
    private roomManager: RoomManager,
    private vm: VirtualMachine,
    private actorManager: ActorManager,
    private audio: AudioSystem
  ) {}

  public executeCommand(ctx: CommandContext): boolean {
    const actor = this.actorManager.getActiveActor();

    // 0. Character Switch: NEW_KID
    if (ctx.verb === 'NEW_KID') {
      this.cycleNextKid();
      return true;
    }

    // 1. Give Item to Actor
    if (ctx.verb === 'GIVE' && ctx.directObj.isInventory && ctx.indirectObj) {
      const targetActor = this.actorManager.getAllActors().find(
        (a) => a.id === ctx.indirectObj?.id || a.name.toLowerCase() === ctx.indirectObj?.name.toLowerCase()
      );
      if (targetActor) {
        if (targetActor.roomId === actor.roomId) {
          const success = this.actorManager.transferItem(actor.id, targetActor.id, ctx.directObj.id);
          if (success) {
            this.audio.playPickup();
            return true;
          }
        } else {
          actor.say(`${targetActor.name} is in another room.`);
          return false;
        }
      }
    }

    // 2. Combine Inventory Items
    if (ctx.verb === 'USE' && ctx.directObj.isInventory && ctx.indirectObj?.isInventory) {
      return this.handleItemCombination(actor, ctx.directObj.id, ctx.indirectObj.id);
    }

    // 3. Environmental Object Interaction
    const obj = this.roomManager.getObject(ctx.directObj.id);
    if (!obj) {
      if (ctx.directObj.isInventory) {
        actor.say("I can't use that that way.");
      } else {
        actor.say("I don't see that here.");
      }
      return false;
    }

    // Move actor to interact position
    this.navigateActorToObject(actor, obj, () => {
      this.dispatchObjectEvent(actor, obj, ctx);
    });

    return true;
  }

  public cycleNextKid(): void {
    const actors = this.actorManager.getAllActors();
    const currentId = this.actorManager.getActiveActor().id;
    const idx = actors.findIndex((a) => a.id === currentId);
    const nextActor = actors[(idx + 1) % actors.length];
    this.switchToKid(nextActor.id);
  }

  public switchToKid(id: string): void {
    const targetActor = this.actorManager.getAllActors().find((a) => a.id === id);
    if (!targetActor) return;

    this.actorManager.setActiveActor(targetActor.id);
    this.roomManager.setCurrentRoom(targetActor.roomId);
    this.roomManager.updateCamera(targetActor.x, this.roomManager.getCurrentRoom().width);
    this.audio.playSwitchKid();
    targetActor.say(`Ready! I'm in ${this.roomManager.getCurrentRoom().name}.`);
  }

  private navigateActorToObject(actor: Actor, obj: RoomObject, onArrive: () => void): void {
    const currentRoom = this.roomManager.getCurrentRoom();
    const navMesh = this.roomManager.getNavMesh(currentRoom.id);
    const path = navMesh.findPath([actor.x, actor.y], [obj.interactX, obj.interactY]);
    actor.setPath(path);

    // Cooperative check in VM
    this.vm.startThread(`nav_${actor.id}_${Date.now()}`, 'Navigate to Object', 'local', this.createNavGen(actor, obj, onArrive));
  }

  private *createNavGen(actor: Actor, obj: RoomObject, onArrive: () => void) {
    while (actor.isWalking) {
      yield 50;
    }
    actor.facing = obj.interactFacing;
    onArrive();
  }

  private dispatchObjectEvent(actor: Actor, obj: RoomObject, ctx: CommandContext): void {
    const verb = ctx.verb;

    // DOOR NAVIGATION (Clicking an open doorway or exit)
    if (obj.doorTargetRoom && (verb === 'WALK_TO' || (verb === 'OPEN' && obj.open))) {
      this.transitionRoom(actor, obj.doorTargetRoom, obj.doorTargetX || 160, obj.doorTargetY || 130, obj.doorTargetFacing || 'DOWN');
      return;
    }

    switch (obj.id) {
      // 1. DOORMAT
      case 'OBJ_DOORMAT':
        if (verb === 'PULL' || verb === 'PUSH') {
          obj.pushed = true;
          obj.x = 440; // slides left on porch step
          const key = this.roomManager.getObject('OBJ_BRASS_KEY');
          if (key && !actor.hasItem('OBJ_BRASS_KEY')) {
            key.visible = true;
          }
          this.audio.playDoorOpen();
          actor.say("I moved the doormat. Look, a brass key!");
        } else if (verb === 'LOOK_AT') {
          actor.say("It's a heavy welcome mat.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 2. BRASS KEY
      case 'OBJ_BRASS_KEY':
        if (verb === 'PICK_UP') {
          obj.visible = false;
          actor.addItem({
            id: 'OBJ_BRASS_KEY',
            name: 'Brass Key',
            description: 'An ornate brass key found under the doormat.',
          });
          this.audio.playPickup();
          actor.say('Got the brass key!');
        } else if (verb === 'LOOK_AT') {
          actor.say('A shiny brass key.');
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 3. FRONT DOOR
      case 'OBJ_FRONT_DOOR':
        if (verb === 'UNLOCK') {
          if (ctx.indirectObj?.id === 'OBJ_BRASS_KEY' || actor.hasItem('OBJ_BRASS_KEY')) {
            obj.locked = false;
            this.audio.playUnlock();
            actor.say("Click! The front door is unlocked.");
          } else {
            actor.say("It's locked. I need a key.");
          }
        } else if (verb === 'OPEN') {
          if (obj.locked) {
            actor.say("It's locked tight.");
          } else {
            obj.open = true;
            this.audio.playDoorOpen();
            actor.say("The door creaks open. I can enter now!");
          }
        } else if (verb === 'CLOSE') {
          obj.open = false;
          actor.say("I closed the front door.");
        } else if (verb === 'LOOK_AT') {
          actor.say(obj.open ? "The grand doors are wide open." : obj.locked ? "Heavy carved doors, firmly locked." : "Unlocked doors.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 4. SUSPICIOUS PACKAGE
      case 'OBJ_PACKAGE':
        if (verb === 'PICK_UP') {
          obj.visible = false;
          actor.addItem({
            id: 'OBJ_PACKAGE',
            name: 'Suspicious Package',
            description: 'A brown postal package addressed to Dr. Fred.',
          });
          this.audio.playPickup();
          actor.say('Picked up the suspicious package.');
        } else if (verb === 'LOOK_AT') {
          actor.say("It's a heavy brown package addressed to the mansion.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 5. WARNING SIGN
      case 'OBJ_SIGN':
        if (verb === 'READ' || verb === 'LOOK_AT') {
          actor.say('"BEWARE OF OCCUPANTS! Trespassers will be dissected."');
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 6. GARGOYLE FINIAL
      case 'OBJ_GARGOYLE':
        if (verb === 'PUSH') {
          obj.pushed = true;
          const baseDoor = this.roomManager.getObject('OBJ_DOOR_BASE');
          if (baseDoor) {
            baseDoor.locked = false;
            baseDoor.open = true;
          }
          this.audio.playStoneGrind();
          actor.say("The gargoyle horn depresses with a grind! A heavy door unlocked!");
        } else if (verb === 'PULL') {
          obj.pushed = false;
          const baseDoor = this.roomManager.getObject('OBJ_DOOR_BASE');
          if (baseDoor) {
            baseDoor.open = false;
            baseDoor.locked = true;
          }
          this.audio.playStoneGrind();
          actor.say("Pulled the gargoyle back. The door snapped shut.");
        } else if (verb === 'LOOK_AT') {
          actor.say("A stone gargoyle finial next to the stairs.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 7. HEAVY STEEL DOOR (Basement)
      case 'OBJ_DOOR_BASE':
        if (verb === 'OPEN') {
          if (obj.locked) {
            actor.say("It's a heavy security door. It won't budge.");
          } else {
            actor.say("The basement stairs lead down into darkness.");
          }
        } else if (verb === 'LOOK_AT') {
          actor.say(obj.open ? "An open reinforced door leading down." : "A reinforced steel door.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 8. GRANDFATHER CLOCK
      case 'OBJ_CLOCK':
        if (verb === 'LOOK_AT') {
          actor.say("A tall antique grandfather clock. The pendulum swings steadily.");
        } else if (verb === 'OPEN') {
          actor.say("The glass face is sealed shut.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 9. INDUSTRIAL FRIDGE
      case 'OBJ_FRIDGE':
        if (verb === 'OPEN') {
          obj.open = true;
          const cheese = this.roomManager.getObject('OBJ_CHEESE');
          const cola = this.roomManager.getObject('OBJ_COLA');
          const lettuce = this.roomManager.getObject('OBJ_LETTUCE');
          if (cheese && !actor.hasItem('OBJ_CHEESE')) cheese.visible = true;
          if (cola && !actor.hasItem('OBJ_COLA')) cola.visible = true;
          if (lettuce && !actor.hasItem('OBJ_LETTUCE')) lettuce.visible = true;
          this.audio.playDoorOpen();
          actor.say("Opened the fridge! Inside is cheese, cola, and lettuce.");
        } else if (verb === 'CLOSE') {
          obj.open = false;
          actor.say("Closed the fridge.");
        } else if (verb === 'LOOK_AT') {
          actor.say(obj.open ? "Cold air billows out over shelves of food." : "A stainless steel refrigerator.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 10. FRIDGE ITEMS: CHEESE, COLA, LETTUCE
      case 'OBJ_CHEESE':
        if (verb === 'PICK_UP') {
          obj.visible = false;
          actor.addItem({ id: 'OBJ_CHEESE', name: 'Pungent Cheese', description: 'A smelly wedge of Swiss cheese.' });
          this.audio.playPickup();
          actor.say('Got the cheese. Pungent!');
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      case 'OBJ_COLA':
        if (verb === 'PICK_UP') {
          obj.visible = false;
          actor.addItem({ id: 'OBJ_COLA', name: 'Fizzy Cola Can', description: 'A carbonated soda can.' });
          this.audio.playPickup();
          actor.say('Got a cold fizzy cola.');
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      case 'OBJ_LETTUCE':
        if (verb === 'PICK_UP') {
          obj.visible = false;
          actor.addItem({ id: 'OBJ_LETTUCE', name: 'Wilted Lettuce', description: 'A head of limp green lettuce.' });
          this.audio.playPickup();
          actor.say('Got the wilted lettuce.');
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 11. FLASHLIGHT & BATTERIES
      case 'OBJ_FLASHLIGHT':
        if (verb === 'PICK_UP') {
          obj.visible = false;
          actor.addItem({ id: 'OBJ_FLASHLIGHT', name: 'Heavy Flashlight', description: 'A heavy yellow flashlight. Needs batteries.' });
          this.audio.playPickup();
          actor.say('Picked up the flashlight.');
        } else if (verb === 'LOOK_AT') {
          actor.say("A yellow heavy-duty flashlight resting on the counter.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      case 'OBJ_OLD_BATT':
        if (verb === 'PICK_UP') {
          obj.visible = false;
          actor.addItem({ id: 'OBJ_OLD_BATT', name: 'Old Batteries', description: 'Two heavy cylinder batteries.' });
          this.audio.playPickup();
          actor.say('Got the batteries!');
        } else if (verb === 'LOOK_AT') {
          actor.say("Two heavy batteries sitting on the kitchen counter.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 12. MICROWAVE & FAUCET
      case 'OBJ_MICROWAVE':
        if (verb === 'OPEN') {
          obj.open = !obj.open;
          actor.say(obj.open ? "Opened the microwave door." : "Closed the microwave.");
        } else if (verb === 'LOOK_AT') {
          actor.say("A vintage microwave oven.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      case 'OBJ_FAUCET':
        if (verb === 'TURN_ON') {
          obj.flowing = true;
          this.audio.playPickup();
          actor.say("Water starts pouring into the sink.");
        } else if (verb === 'TURN_OFF') {
          obj.flowing = false;
          actor.say("Turned off the faucet.");
        } else if (verb === 'LOOK_AT') {
          actor.say(obj.flowing ? "Water is running freely." : "A chrome sink faucet.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 13. MEDIA CABINET & TAPE DECK
      case 'OBJ_CABINET':
        if (verb === 'OPEN') {
          obj.open = true;
          const deck = this.roomManager.getObject('OBJ_TAPE_DECK');
          if (deck) deck.visible = true;
          this.audio.playDoorOpen();
          actor.say("Opened the cabinet. There's a tape deck inside!");
        } else if (verb === 'CLOSE') {
          obj.open = false;
          actor.say("Closed the media cabinet.");
        } else if (verb === 'LOOK_AT') {
          actor.say("An ornate wooden media cabinet.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      case 'OBJ_TAPE_DECK':
        if (verb === 'USE' && (ctx.indirectObj?.id === 'OBJ_AUDIO_TAPE' || actor.hasItem('OBJ_AUDIO_TAPE'))) {
          actor.removeItem('OBJ_AUDIO_TAPE');
          actor.addItem({
            id: 'OBJ_AUDIO_TAPE_HIGH_FREQ',
            name: 'High-Pitch Audio Tape',
            description: 'A cassette tape recorded with extreme high frequencies.',
          });
          this.audio.playPickup();
          actor.say("Inserted blank tape. The tape recorded a high-pitch frequency!");
        } else if (verb === 'TURN_ON') {
          if (actor.hasItem('OBJ_AUDIO_TAPE_HIGH_FREQ')) {
            this.triggerChandelierShatter(actor);
          } else {
            actor.say("The tape deck hums, but it's empty.");
          }
        } else if (verb === 'LOOK_AT') {
          actor.say("A high-fidelity cassette player connected to the parlor speakers.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 14. ANTIQUE RADIO & VACUUM TUBE
      case 'OBJ_ANT_RADIO':
        if (verb === 'OPEN') {
          obj.open = true;
          const tube = this.roomManager.getObject('OBJ_VACUUM_TUBE');
          if (tube && !actor.hasItem('OBJ_VACUUM_TUBE')) tube.visible = true;
          this.audio.playDoorOpen();
          actor.say("Popped open the radio back panel. A vacuum tube is inside!");
        } else if (verb === 'LOOK_AT') {
          actor.say("An antique cathedral radio.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      case 'OBJ_VACUUM_TUBE':
        if (verb === 'PICK_UP') {
          obj.visible = false;
          actor.addItem({ id: 'OBJ_VACUUM_TUBE', name: 'Vacuum Tube', description: 'A delicate glass amplifier vacuum tube.' });
          this.audio.playPickup();
          actor.say('Carefully picked up the vacuum tube.');
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 15. LOOSE PANEL & BLANK TAPE
      case 'OBJ_PANEL':
        if (verb === 'OPEN' || verb === 'PULL') {
          obj.open = true;
          const tape = this.roomManager.getObject('OBJ_AUDIO_TAPE');
          if (tape && !actor.hasItem('OBJ_AUDIO_TAPE')) tape.visible = true;
          this.audio.playDoorOpen();
          actor.say("Pried open the loose wood panel! Found a cassette tape!");
        } else if (verb === 'LOOK_AT') {
          actor.say("A loose wood panel in the wainscoting.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      case 'OBJ_AUDIO_TAPE':
        if (verb === 'PICK_UP') {
          obj.visible = false;
          actor.addItem({ id: 'OBJ_AUDIO_TAPE', name: 'Blank Audio Tape', description: 'A blank compact audio cassette.' });
          this.audio.playPickup();
          actor.say('Got the blank audio tape.');
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      // 16. CHANDELIER & RUSTY KEY
      case 'OBJ_CHANDELIER':
        if (verb === 'LOOK_AT') {
          actor.say(obj.shattered ? "Broken crystals litter the floor." : "A gleaming crystal chandelier. A rusty key hangs caught in the prisms!");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      case 'OBJ_RUSTY_KEY':
        if (verb === 'PICK_UP') {
          if (obj.attachedToChandelier) {
            actor.say("It's too high up to reach!");
          } else {
            obj.visible = false;
            actor.addItem({ id: 'OBJ_RUSTY_KEY', name: 'Rusty Key', description: 'A weathered iron key found from the chandelier.' });
            this.audio.playPickup();
            actor.say('Picked up the rusty key from the floor!');
          }
        } else if (verb === 'LOOK_AT') {
          actor.say(obj.attachedToChandelier ? "A rusty key entangled high in the chandelier." : "A rusty iron key lying on the floor.");
        } else {
          this.defaultNegative(actor, verb);
        }
        break;

      default:
        if (verb === 'LOOK_AT') {
          actor.say(`It's ${obj.name}.`);
        } else {
          this.defaultNegative(actor, verb);
        }
        break;
    }
  }

  private triggerChandelierShatter(actor: Actor): void {
    this.vm.freeze(true);
    actor.say("Playing the high-frequency tape at maximum volume!");
    this.audio.playTapePulse();

    this.vm.startThread('cutscene_shatter', 'Shatter Chandelier', 'global', this.createShatterGen(actor));
  }

  private *createShatterGen(actor: Actor) {
    yield 800;
    this.audio.playGlassShatter();
    const chandelier = this.roomManager.getObject('OBJ_CHANDELIER');
    const rustyKey = this.roomManager.getObject('OBJ_RUSTY_KEY');

    if (chandelier) {
      chandelier.shattered = true;
    }

    if (rustyKey) {
      rustyKey.attachedToChandelier = false;
      // Key falls to floor
      rustyKey.y = 120;
      rustyKey.interactY = 125;
    }

    yield 500;
    actor.say("CRASH! The vibration shattered the glass! The rusty key fell to the floor!");
    this.vm.freeze(false);
  }

  private handleItemCombination(actor: Actor, itemAId: string, itemBId: string): boolean {
    const ids = [itemAId, itemBId];
    if (ids.includes('OBJ_OLD_BATT') && ids.includes('OBJ_FLASHLIGHT')) {
      actor.removeItem('OBJ_OLD_BATT');
      actor.removeItem('OBJ_FLASHLIGHT');
      actor.addItem({
        id: 'OBJ_FLASHLIGHT_POWERED',
        name: 'Powered Flashlight',
        description: 'A heavy flashlight with fresh batteries installed. Ready to illuminate the dark!',
      });
      this.audio.playPickup();
      actor.say('Put the batteries into the flashlight. It works!');
      return true;
    }

    actor.say("Those two items don't work together.");
    return false;
  }

  private transitionRoom(actor: Actor, roomId: string, targetX: number, targetY: number, targetFacing: any): void {
    this.audio.playDoorOpen();
    actor.roomId = roomId;
    actor.x = targetX;
    actor.y = targetY;
    actor.facing = targetFacing;
    actor.stopWalking();

    this.roomManager.setCurrentRoom(roomId);
    this.roomManager.updateCamera(actor.x, this.roomManager.getCurrentRoom().width);
    actor.say(`Entered ${this.roomManager.getCurrentRoom().name}.`);
  }

  private defaultNegative(actor: Actor, verb: VerbType): void {
    switch (verb) {
      case 'PUSH': actor.say("It won't budge."); break;
      case 'PULL': actor.say("I can't pull that."); break;
      case 'OPEN': actor.say("It doesn't open."); break;
      case 'CLOSE': actor.say("It's not open."); break;
      case 'PICK_UP': actor.say("I can't pick that up."); break;
      case 'UNLOCK': actor.say("That doesn't have a lock."); break;
      case 'TURN_ON': actor.say("I can't turn that on."); break;
      case 'TURN_OFF': actor.say("It's not running."); break;
      case 'USE': actor.say("I can't use that."); break;
      case 'READ': actor.say("There is nothing to read on it."); break;
      case 'TALK_TO': actor.say("It has nothing to say."); break;
      default: actor.say("I can't do that."); break;
    }
  }
}
