import { CharacterId, FacingDirection, ItemDefinition, Point2D } from './types';

export class Actor {
  public readonly id: CharacterId;
  public readonly name: string;
  public readonly dialogColor: string;
  public roomId: string;
  public x: number;
  public y: number;
  public facing: FacingDirection = 'DOWN';
  public inventory: ItemDefinition[] = [];
  public isWalking: boolean = false;
  public waypoints: Point2D[] = [];
  public walkSpeed: number = 75; // pixels per second
  public animFrame: number = 0;
  private animTimer: number = 0;

  public speechText: string | null = null;
  public speechTimer: number = 0;

  constructor(id: CharacterId, name: string, dialogColor: string, initialRoom: string, x: number, y: number) {
    this.id = id;
    this.name = name;
    this.dialogColor = dialogColor;
    this.roomId = initialRoom;
    this.x = x;
    this.y = y;
  }

  public say(text: string): void {
    this.speechText = text;
    this.speechTimer = (text.length * 50) + 1000;
  }

  public clearSpeech(): void {
    this.speechText = null;
    this.speechTimer = 0;
  }

  public setPath(points: Point2D[]): void {
    if (points.length <= 1) {
      this.waypoints = [];
      this.isWalking = false;
      return;
    }
    this.waypoints = points.slice(1);
    this.isWalking = true;
  }

  public stopWalking(): void {
    this.waypoints = [];
    this.isWalking = false;
    this.animFrame = 0;
  }

  public update(dtSeconds: number): void {
    if (this.speechTimer > 0) {
      this.speechTimer -= dtSeconds * 1000;
      if (this.speechTimer <= 0) {
        this.speechText = null;
        this.speechTimer = 0;
      }
    }

    if (!this.isWalking || this.waypoints.length === 0) {
      this.isWalking = false;
      this.animFrame = 0;
      return;
    }

    this.animTimer += dtSeconds;
    if (this.animTimer >= 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    const target = this.waypoints[0];
    const dx = target[0] - this.x;
    const dy = target[1] - this.y;
    const dist = Math.hypot(dx, dy);

    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      this.facing = dy > 0 ? 'DOWN' : 'UP';
    }

    const step = this.walkSpeed * dtSeconds;
    if (dist <= step) {
      this.x = target[0];
      this.y = target[1];
      this.waypoints.shift();
      if (this.waypoints.length === 0) {
        this.isWalking = false;
        this.animFrame = 0;
      }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  public hasItem(itemId: string): boolean {
    return this.inventory.some((i) => i.id === itemId);
  }

  public addItem(item: ItemDefinition): void {
    if (!this.hasItem(item.id)) {
      this.inventory.push(item);
    }
  }

  public removeItem(itemId: string): ItemDefinition | null {
    const idx = this.inventory.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      return this.inventory.splice(idx, 1)[0];
    }
    return null;
  }
}

export class ActorManager {
  private actors: Map<CharacterId, Actor> = new Map();
  private activeActorId: CharacterId = 'dave';

  constructor() {
    // Dave: Approach (front porch driveway)
    const dave = new Actor('dave', 'Dave', '#55FFFF', 'AREA_APPROACH', 420, 130);
    // Bernard: Foyer (entry hallway)
    const bernard = new Actor('bernard', 'Bernard', '#55FF55', 'AREA_FOYER', 160, 130);
    // Syd: Cookery (kitchen)
    const syd = new Actor('syd', 'Syd', '#FF55FF', 'AREA_COOKERY', 260, 130);

    this.actors.set('dave', dave);
    this.actors.set('bernard', bernard);
    this.actors.set('syd', syd);
  }

  public getActor(id: CharacterId): Actor {
    const actor = this.actors.get(id);
    if (!actor) throw new Error(`Unknown actor: ${id}`);
    return actor;
  }

  public getActiveActor(): Actor {
    return this.getActor(this.activeActorId);
  }

  public setActiveActor(id: CharacterId): Actor {
    const actor = this.getActor(id);
    this.activeActorId = id;
    return actor;
  }

  public getAllActors(): Actor[] {
    return Array.from(this.actors.values());
  }

  public getActorsInRoom(roomId: string): Actor[] {
    return this.getAllActors().filter((a) => a.roomId === roomId);
  }

  public transferItem(fromId: CharacterId, toId: CharacterId, itemId: string): boolean {
    const fromActor = this.getActor(fromId);
    const toActor = this.getActor(toId);

    if (fromActor.roomId !== toActor.roomId) {
      fromActor.say("I am not in the same room!");
      return false;
    }

    const item = fromActor.removeItem(itemId);
    if (item) {
      toActor.addItem(item);
      fromActor.say(`Here you go, ${toActor.name}.`);
      return true;
    }
    return false;
  }

  public updateAll(dtSeconds: number): void {
    for (const actor of this.actors.values()) {
      actor.update(dtSeconds);
    }
  }
}
