import { ActorManager } from './actor';
import { AudioSystem } from './audio';
import { EventDispatcher } from './events';
import { BitmapFont8x8 } from './font';
import { RoomManager } from './rooms';
import { ControlPanelUI, SentenceConstructor } from './ui';
import { VirtualMachine } from './vm';

export class GameEngine {
  public roomManager: RoomManager;
  public vm: VirtualMachine;
  public actorManager: ActorManager;
  public ui: ControlPanelUI;
  public sentenceConstructor: SentenceConstructor;
  public eventDispatcher: EventDispatcher;
  public audio: AudioSystem;
  public font: BitmapFont8x8;

  private imageCache: Map<string, HTMLImageElement> = new Map();
  public mouseX: number = 0;
  public mouseY: number = 0;
  public targetMarker: { x: number; y: number; timer: number } | null = null;

  constructor() {
    this.roomManager = new RoomManager();
    this.vm = new VirtualMachine();
    this.actorManager = new ActorManager();
    this.ui = new ControlPanelUI();
    this.sentenceConstructor = new SentenceConstructor();
    this.audio = new AudioSystem();
    this.font = new BitmapFont8x8();
    this.eventDispatcher = new EventDispatcher(
      this.roomManager,
      this.vm,
      this.actorManager,
      this.audio
    );

    this.preloadAssets();
  }

  private preloadAssets(): void {
    const assets = [
      '/assets/bg_approach.png',
      '/assets/bg_foyer.png',
      '/assets/bg_cookery.png',
      '/assets/bg_parlor.png',
      '/assets/obj_front_door_open.png',
      '/assets/obj_base_door_open.png',
      ...(['dave', 'bernard', 'syd'].flatMap((id) => [
        `/assets/char_${id}_front.png`,
        `/assets/char_${id}_back.png`,
        `/assets/char_${id}_left.png`,
        `/assets/char_${id}_right.png`,
        `/assets/char_${id}_walk1.png`,
        `/assets/char_${id}_walk2.png`,
        `/assets/char_${id}_walk_down_1.png`,
        `/assets/char_${id}_walk_down_2.png`,
        `/assets/char_${id}_walk_up_1.png`,
        `/assets/char_${id}_walk_up_2.png`,
        `/assets/char_${id}_walk_left_1.png`,
        `/assets/char_${id}_walk_left_2.png`,
        `/assets/char_${id}_walk_right_1.png`,
        `/assets/char_${id}_walk_right_2.png`,
      ])),
      '/assets/item_brass_key.png',
      '/assets/item_rusty_key.png',
      '/assets/item_flashlight.png',
      '/assets/item_batteries.png',
      '/assets/item_package.png',
      '/assets/item_tape.png',
      '/assets/item_vacuum_tube.png',
      '/assets/item_doormat.png',
      '/assets/item_cheese.png',
      '/assets/item_cola.png',
      '/assets/item_lettuce.png',
    ];

    if (typeof window !== 'undefined') {
      for (const src of assets) {
        const img = new Image();
        img.src = src;
        this.imageCache.set(src, img);
      }
    }
  }

  private getImage(src: string): HTMLImageElement | null {
    const img = this.imageCache.get(src);
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    return null;
  }

  public update(dtSeconds: number): void {
    this.actorManager.updateAll(dtSeconds);
    this.vm.update(dtSeconds);

    const activeActor = this.actorManager.getActiveActor();
    const currentRoom = this.roomManager.getCurrentRoom();

    if (activeActor.roomId === currentRoom.id) {
      this.roomManager.updateCamera(activeActor.x, currentRoom.width);
    }

    if (this.targetMarker) {
      this.targetMarker.timer -= dtSeconds;
      if (this.targetMarker.timer <= 0) {
        this.targetMarker = null;
      }
    }
  }

  public handleMouseMove(screenX: number, screenY: number): void {
    this.mouseX = screenX;
    this.mouseY = screenY;

    // Check Action Area hover (Y: 0..144)
    if (screenY < 144) {
      const room = this.roomManager.getCurrentRoom();
      const worldX = screenX + this.roomManager.cameraX;
      const worldY = screenY;

      // 1. Check actors in room
      const actors = this.actorManager.getActorsInRoom(room.id);
      for (const a of actors) {
        if (worldX >= a.x - 10 && worldX <= a.x + 10 && worldY >= a.y - 54 && worldY <= a.y) {
          this.sentenceConstructor.setHoverObject({ id: a.id, name: a.name });
          return;
        }
      }

      // 2. Check objects in room
      for (const obj of room.objects) {
        if (!obj.visible) continue;
        if (
          worldX >= obj.x &&
          worldX <= obj.x + obj.width &&
          worldY >= obj.y &&
          worldY <= obj.y + obj.height
        ) {
          this.sentenceConstructor.setHoverObject({ id: obj.id, name: obj.name });
          return;
        }
      }
      this.sentenceConstructor.setHoverObject(null);
      return;
    }

    // Check Inventory hover (Y: 153..198, X: 200..305)
    if (screenY >= 153 && screenY <= 198 && screenX >= 200 && screenX <= 305) {
      const activeActor = this.actorManager.getActiveActor();
      const item = this.ui.getInventoryItemAt(screenX, screenY, activeActor.inventory);
      if (item) {
        this.sentenceConstructor.setHoverObject({ id: item.id, name: item.name });
        return;
      }
    }

    this.sentenceConstructor.setHoverObject(null);
  }

  public handleClick(screenX: number, screenY: number): void {
    // 0. Character Selector Banner Click (Y: 2..14)
    const kidTab = this.ui.isCharacterTabClicked(screenX, screenY);
    if (kidTab) {
      this.eventDispatcher.switchToKid(kidTab);
      return;
    }

    // 1. Control Panel Click (Y >= 144)
    if (screenY >= 144) {
      this.handleControlPanelClick(screenX, screenY);
      return;
    }

    // 2. Action Area Click (Y < 144)
    this.handleActionAreaClick(screenX, screenY);
  }

  private handleControlPanelClick(x: number, y: number): void {
    // 1. Check Verb Matrix Click
    const verb = this.ui.getVerbAt(x, y);
    if (verb) {
      if (verb === 'NEW_KID') {
        this.eventDispatcher.cycleNextKid();
      } else {
        this.sentenceConstructor.setVerb(verb);
      }
      return;
    }

    // 2. Check Inventory Item Click
    const activeActor = this.actorManager.getActiveActor();
    const item = this.ui.getInventoryItemAt(x, y, activeActor.inventory);
    if (item) {
      if (!this.sentenceConstructor.directObject) {
        this.sentenceConstructor.setDirectObject({ id: item.id, name: item.name, isInventory: true });
        if (['LOOK_AT', 'READ', 'WHAT_IS'].includes(this.sentenceConstructor.activeVerb)) {
          this.eventDispatcher.executeCommand({
            verb: this.sentenceConstructor.activeVerb,
            directObj: { id: item.id, name: item.name, isInventory: true },
          });
          this.sentenceConstructor.reset();
        }
      } else {
        // Second inventory item (e.g. Use Batteries with Flashlight)
        this.eventDispatcher.executeCommand({
          verb: this.sentenceConstructor.activeVerb,
          directObj: this.sentenceConstructor.directObject,
          indirectObj: { id: item.id, name: item.name, isInventory: true },
        });
        this.sentenceConstructor.reset();
      }
      return;
    }

    // 3. Check Scroll Arrows
    const scrollDir = this.ui.isScrollArrowClicked(x, y);
    if (scrollDir) {
      this.ui.scrollInventory(scrollDir, activeActor.inventory.length);
    }
  }

  private handleActionAreaClick(screenX: number, screenY: number): void {
    const room = this.roomManager.getCurrentRoom();
    const worldX = screenX + this.roomManager.cameraX;
    const worldY = screenY;
    const actor = this.actorManager.getActiveActor();

    // 1. Check clicked actor
    const actorsInRoom = this.actorManager.getActorsInRoom(room.id);
    for (const a of actorsInRoom) {
      if (worldX >= a.x - 10 && worldX <= a.x + 10 && worldY >= a.y - 54 && worldY <= a.y) {
        if (this.sentenceConstructor.directObject) {
          // e.g. Give Brass Key to Bernard
          this.eventDispatcher.executeCommand({
            verb: this.sentenceConstructor.activeVerb,
            directObj: this.sentenceConstructor.directObject,
            indirectObj: { id: a.id, name: a.name },
          });
          this.sentenceConstructor.reset();
        } else {
          // Switch to this actor or talk
          if (this.sentenceConstructor.activeVerb === 'TALK_TO') {
            actor.say(`Hey ${a.name}!`);
          } else {
            this.eventDispatcher.switchToKid(a.id);
          }
        }
        return;
      }
    }

    // 2. Check clicked object
    for (const obj of room.objects) {
      if (!obj.visible) continue;
      if (
        worldX >= obj.x &&
        worldX <= obj.x + obj.width &&
        worldY >= obj.y &&
        worldY <= obj.y + obj.height
      ) {
        if (this.sentenceConstructor.directObject) {
          // Two-object command (e.g. Unlock Front Door with Brass Key)
          this.eventDispatcher.executeCommand({
            verb: this.sentenceConstructor.activeVerb,
            directObj: obj,
            indirectObj: this.sentenceConstructor.directObject,
          });
          this.sentenceConstructor.reset();
        } else {
          // Single-object command
          this.eventDispatcher.executeCommand({
            verb: this.sentenceConstructor.activeVerb,
            directObj: obj,
          });
          if (this.sentenceConstructor.activeVerb !== 'WALK_TO') {
            this.sentenceConstructor.reset();
          }
        }
        return;
      }
    }

    // 3. Ground Click: Default Walk to
    this.targetMarker = { x: screenX, y: screenY, timer: 0.6 };
    const navMesh = this.roomManager.getNavMesh(room.id);
    const path = navMesh.findPath([actor.x, actor.y], [worldX, worldY]);
    actor.setPath(path);
    this.sentenceConstructor.reset();
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = false;

    const room = this.roomManager.getCurrentRoom();
    const camX = Math.round(this.roomManager.cameraX);

    // ==========================================
    // 1. RENDER ACTION AREA (Y: 0..144)
    // ==========================================
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 320, 144);

    // 1.1 Room Background
    const bgImg = this.getImage(room.bgImage);
    if (bgImg) {
      ctx.drawImage(bgImg, camX, 0, 320, 144, 0, 0, 320, 144);
    } else {
      ctx.fillStyle = '#102040';
      ctx.fillRect(0, 0, 320, 144);
    }

    // 1.2 Draw Objects
    for (const obj of room.objects) {
      if (!obj.visible) continue;
      const screenObjX = obj.x - camX;
      if (screenObjX + obj.width < 0 || screenObjX > 320) continue;

      let sprite = obj.spriteName ? this.getImage(`/assets/${obj.spriteName}.png`) : null;
      if (obj.id === 'OBJ_FRONT_DOOR' && obj.open) {
        sprite = this.getImage('/assets/obj_front_door_open.png') || sprite;
      } else if (obj.id === 'OBJ_DOOR_BASE' && obj.open) {
        sprite = this.getImage('/assets/obj_base_door_open.png') || sprite;
      }

      if (sprite) {
        ctx.drawImage(sprite, screenObjX, obj.y, obj.width, obj.height);
      }

      // Hover Outline and Label
      const isHovered =
        this.sentenceConstructor.hoverObject?.id === obj.id ||
        (this.mouseX >= screenObjX &&
          this.mouseX <= screenObjX + obj.width &&
          this.mouseY >= obj.y &&
          this.mouseY <= obj.y + obj.height);

      if (isHovered) {
        ctx.strokeStyle = '#FFFF55';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenObjX - 1, obj.y - 1, obj.width + 2, obj.height + 2);
      }
    }

    // 1.3 Draw Actors with Perspective Scaling & Depth Sorting
    const actorsInRoom = this.actorManager.getActorsInRoom(room.id);
    const sortedActors = [...actorsInRoom].sort((a, b) => a.y - b.y);

    const navMesh = this.roomManager.getNavMesh(room.id);

    for (const a of sortedActors) {
      const scale = navMesh.getScaleForPoint([a.x, a.y]);
      const spriteW = Math.round(20 * scale);
      const spriteH = Math.round(54 * scale);
      const screenActorX = Math.round(a.x - camX - spriteW / 2);
      const screenActorY = Math.round(a.y - spriteH);

      let frameName = 'front';
      const dir = a.facing.toLowerCase();
      if (!a.isWalking) {
        if (a.facing === 'UP') frameName = 'back';
        else if (a.facing === 'DOWN') frameName = 'front';
        else if (a.facing === 'LEFT') frameName = 'left';
        else if (a.facing === 'RIGHT') frameName = 'right';
      } else {
        if (a.animFrame === 1) {
          frameName = `walk_${dir}_1`;
        } else if (a.animFrame === 3) {
          frameName = `walk_${dir}_2`;
        } else {
          // Standing phase between steps
          if (a.facing === 'UP') frameName = 'back';
          else if (a.facing === 'DOWN') frameName = 'front';
          else if (a.facing === 'LEFT') frameName = 'left';
          else if (a.facing === 'RIGHT') frameName = 'right';
        }
      }

      const spriteImg = this.getImage(`/assets/char_${a.id}_${frameName}.png`) ||
        this.getImage(`/assets/char_${a.id}_front.png`);

      if (spriteImg) {
        ctx.drawImage(spriteImg, screenActorX, screenActorY, spriteW, spriteH);
      } else {
        // Fallback pixel rect
        ctx.fillStyle = a.dialogColor;
        ctx.fillRect(screenActorX, screenActorY, spriteW, spriteH);
      }

      // Selected character indicator
      if (a.id === this.actorManager.getActiveActor().id) {
        ctx.fillStyle = '#FFFF55';
        ctx.fillRect(screenActorX + spriteW / 2 - 2, screenActorY - 4, 4, 2);
      }

      // Speech bubble / dialog
      if (a.speechText) {
        this.font.drawCenteredText(ctx, a.speechText, screenActorX + spriteW / 2, screenActorY - 14, a.dialogColor, true);
      }
    }

    // 1.4 Click Target Marker
    if (this.targetMarker) {
      ctx.strokeStyle = '#55FFFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.targetMarker.x - 3, this.targetMarker.y - 3, 6, 6);
    }

    // 1.5 Top Banner Character Switcher (Y: 2..13)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(190, 1, 128, 12);
    ctx.strokeStyle = '#555555';
    ctx.strokeRect(190, 1, 128, 12);

    const activeId = this.actorManager.getActiveActor().id;
    this.font.drawText(ctx, '1:Dave', 195, 3, activeId === 'dave' ? '#FFFF55' : '#888888', true);
    this.font.drawText(ctx, '2:Bernard', 238, 3, activeId === 'bernard' ? '#FFFF55' : '#888888', true);
    this.font.drawText(ctx, '3:Syd', 288, 3, activeId === 'syd' ? '#FFFF55' : '#888888', true);

    // ==========================================
    // 2. RENDER SENTENCE LINE (Y: 144..152)
    // ==========================================
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 144, 320, 8);
    const sentence = this.sentenceConstructor.constructSentence();
    this.font.drawText(ctx, sentence, 4, 144, '#FFFFFF', false);

    // ==========================================
    // 3. RENDER CONTROL PANEL (Y: 152..200)
    // ==========================================
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 152, 320, 48);

    // Divider Line
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, 152, 320, 1);
    ctx.fillRect(198, 153, 1, 47); // separates verbs & inventory

    // 3.1 Verbs
    for (const v of this.ui.verbs) {
      const isActive = this.sentenceConstructor.activeVerb === v.verb;
      const isHover =
        this.mouseX >= v.x &&
        this.mouseX <= v.x + v.width &&
        this.mouseY >= v.y &&
        this.mouseY <= v.y + v.height;

      const color = isActive ? '#FFFF55' : isHover ? '#FFFFFF' : '#00FF66';
      this.font.drawText(ctx, v.label, v.x, v.y, color, false);
    }

    // 3.2 Inventory
    const activeActor = this.actorManager.getActiveActor();
    const inv = activeActor.inventory;
    const offset = this.ui.inventoryOffset;
    const colors = ['#FF55FF', '#FFFF55', '#55FFFF', '#FFFFFF'];

    for (let i = 0; i < this.ui.visibleInventoryCount; i++) {
      const itemIdx = offset + i;
      if (itemIdx < inv.length) {
        const item = inv[itemIdx];
        const isHover =
          this.mouseX >= 200 &&
          this.mouseX <= 305 &&
          this.mouseY >= 153 + i * 11 &&
          this.mouseY < 153 + (i + 1) * 11;

        const color = isHover ? '#FFFFFF' : colors[i % colors.length];
        this.font.drawText(ctx, item.name, 202, 154 + i * 11, color, false);
      }
    }

    // 3.3 Inventory Scroll Arrows
    const hasMoreUp = offset > 0;
    const hasMoreDown = offset + this.ui.visibleInventoryCount < inv.length;

    this.font.drawText(ctx, '▲', 310, 154, hasMoreUp ? '#00FF66' : '#333333', false);
    this.font.drawText(ctx, '▼', 310, 186, hasMoreDown ? '#00FF66' : '#333333', false);
  }
}
