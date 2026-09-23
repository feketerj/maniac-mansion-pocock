import { RoomDefinition, RoomObject } from './types';
import { NavMesh } from './navmesh';

export class RoomManager {
  private rooms: Map<string, RoomDefinition> = new Map();
  private currentRoomId: string = 'AREA_APPROACH';
  private navMeshes: Map<string, NavMesh> = new Map();
  public cameraX: number = 0;

  constructor() {
    this.initRooms();
  }

  private initRooms(): void {
    // 1. AREA_APPROACH
    const approach: RoomDefinition = {
      id: 'AREA_APPROACH',
      name: 'The Approach',
      width: 640,
      height: 200,
      bgImage: '/assets/bg_approach.png',
      walkboxes: [
        {
          id: 'WB_DRIVEWAY',
          polygon: [[0, 144], [640, 144], [640, 100], [0, 100]],
          scaleMin: 0.9,
          scaleMax: 1.0,
        },
        {
          id: 'WB_PATH',
          polygon: [[380, 144], [580, 144], [530, 115], [430, 115]],
          scaleMin: 0.8,
          scaleMax: 1.0,
        },
        {
          id: 'WB_PORCH',
          polygon: [[430, 115], [530, 115], [520, 75], [440, 75]],
          scaleMin: 0.7,
          scaleMax: 0.8,
        },
      ],
      zPlanes: [
        { id: 'ZP_BUSHES_LEFT', x: 0, y: 144, width: 150, height: 56, baselineY: 160 },
        { id: 'ZP_PORCH_RAIL', x: 400, y: 75, width: 160, height: 20, baselineY: 85 },
      ],
      objects: [
        {
          id: 'OBJ_DOORMAT',
          name: 'Heavy Doormat',
          x: 465,
          y: 72,
          width: 40,
          height: 10,
          interactX: 485,
          interactY: 78,
          interactFacing: 'DOWN',
          visible: true,
          pushed: false, // used as moved: false
          spriteName: 'item_doormat',
        },
        {
          id: 'OBJ_BRASS_KEY',
          name: 'Brass Key',
          x: 485,
          y: 74,
          width: 16,
          height: 10,
          interactX: 485,
          interactY: 78,
          interactFacing: 'DOWN',
          visible: false,
          spriteName: 'item_brass_key',
        },
        {
          id: 'OBJ_FRONT_DOOR',
          name: 'Grand Doors',
          x: 460,
          y: 28,
          width: 50,
          height: 46,
          interactX: 485,
          interactY: 76,
          interactFacing: 'UP',
          visible: true,
          locked: true,
          open: false,
          doorTargetRoom: 'AREA_FOYER',
          doorTargetX: 60,
          doorTargetY: 120,
          doorTargetFacing: 'RIGHT',
        },
        {
          id: 'OBJ_SIGN',
          name: 'Warning Sign',
          x: 50,
          y: 90,
          width: 40,
          height: 40,
          interactX: 70,
          interactY: 145,
          interactFacing: 'UP',
          visible: true,
        },
        {
          id: 'OBJ_PACKAGE',
          name: 'Suspicious Package',
          x: 100,
          y: 150,
          width: 24,
          height: 16,
          interactX: 110,
          interactY: 160,
          interactFacing: 'DOWN',
          visible: true,
          spriteName: 'item_package',
        },
      ],
    };

    // 2. AREA_FOYER
    const foyer: RoomDefinition = {
      id: 'AREA_FOYER',
      name: 'Entry Hallway',
      width: 480,
      height: 200,
      bgImage: '/assets/bg_foyer.png',
      walkboxes: [
        {
          id: 'WB_FOYER_MAIN',
          polygon: [[30, 144], [450, 144], [450, 110], [30, 110]],
          scaleMin: 0.85,
          scaleMax: 1.0,
        },
        {
          id: 'WB_STAIRS',
          polygon: [[200, 110], [280, 110], [260, 40], [220, 40]],
          scaleMin: 0.50,
          scaleMax: 0.85,
        },
      ],
      zPlanes: [
        { id: 'ZP_STAIR_BANISTER', x: 200, y: 40, width: 80, height: 70, baselineY: 95 },
      ],
      objects: [
        {
          id: 'OBJ_CLOCK',
          name: 'Grandfather Clock',
          x: 60,
          y: 40,
          width: 40,
          height: 90,
          interactX: 80,
          interactY: 125,
          interactFacing: 'UP',
          visible: true,
        },
        {
          id: 'OBJ_DOOR_KITCHEN',
          name: 'Kitchen Door',
          x: 10,
          y: 60,
          width: 30,
          height: 70,
          interactX: 45,
          interactY: 120,
          interactFacing: 'LEFT',
          visible: true,
          open: true,
          doorTargetRoom: 'AREA_COOKERY',
          doorTargetX: 590,
          doorTargetY: 120,
          doorTargetFacing: 'LEFT',
        },
        {
          id: 'OBJ_DOOR_PARLOR',
          name: 'Parlor Door',
          x: 440,
          y: 60,
          width: 30,
          height: 70,
          interactX: 435,
          interactY: 120,
          interactFacing: 'RIGHT',
          visible: true,
          open: true,
          doorTargetRoom: 'AREA_PARLOR',
          doorTargetX: 45,
          doorTargetY: 120,
          doorTargetFacing: 'RIGHT',
        },
        {
          id: 'OBJ_GARGOYLE',
          name: 'Gargoyle Finial',
          x: 290,
          y: 80,
          width: 20,
          height: 30,
          interactX: 300,
          interactY: 115,
          interactFacing: 'UP',
          visible: true,
          pushed: false,
        },
        {
          id: 'OBJ_DOOR_BASE',
          name: 'Heavy Steel Door',
          x: 330,
          y: 60,
          width: 50,
          height: 50,
          interactX: 355,
          interactY: 115,
          interactFacing: 'UP',
          visible: true,
          locked: true,
          open: false,
        },
        {
          id: 'OBJ_DOOR_EXIT_PORCH',
          name: 'Front Door Exit',
          x: 20,
          y: 135,
          width: 40,
          height: 10,
          interactX: 45,
          interactY: 130,
          interactFacing: 'DOWN',
          visible: true,
          open: true,
          doorTargetRoom: 'AREA_APPROACH',
          doorTargetX: 320,
          doorTargetY: 95,
          doorTargetFacing: 'DOWN',
        },
      ],
    };

    // 3. AREA_COOKERY
    const cookery: RoomDefinition = {
      id: 'AREA_COOKERY',
      name: 'The Cookery',
      width: 640,
      height: 200,
      bgImage: '/assets/bg_cookery.png',
      walkboxes: [
        {
          id: 'WB_COOKERY_FLOOR',
          polygon: [[0, 144], [640, 144], [640, 110], [0, 110]],
          scaleMin: 0.85,
          scaleMax: 1.0,
        },
      ],
      zPlanes: [
        { id: 'ZP_ISLAND_COUNTER', x: 150, y: 90, width: 340, height: 35, baselineY: 125 },
      ],
      objects: [
        {
          id: 'OBJ_DOOR_COOKERY',
          name: 'Cookery Door',
          x: 600,
          y: 60,
          width: 30,
          height: 70,
          interactX: 595,
          interactY: 120,
          interactFacing: 'RIGHT',
          visible: true,
          open: true,
          doorTargetRoom: 'AREA_FOYER',
          doorTargetX: 50,
          doorTargetY: 120,
          doorTargetFacing: 'RIGHT',
        },
        {
          id: 'OBJ_FRIDGE',
          name: 'Industrial Fridge',
          x: 50,
          y: 50,
          width: 80,
          height: 70,
          interactX: 90,
          interactY: 125,
          interactFacing: 'UP',
          visible: true,
          open: false,
        },
        {
          id: 'OBJ_CHEESE',
          name: 'Pungent Cheese',
          x: 65,
          y: 65,
          width: 16,
          height: 12,
          interactX: 90,
          interactY: 125,
          interactFacing: 'UP',
          visible: false,
          spriteName: 'item_cheese',
        },
        {
          id: 'OBJ_COLA',
          name: 'Fizzy Cola Can',
          x: 90,
          y: 65,
          width: 10,
          height: 14,
          interactX: 90,
          interactY: 125,
          interactFacing: 'UP',
          visible: false,
          spriteName: 'item_cola',
        },
        {
          id: 'OBJ_LETTUCE',
          name: 'Wilted Lettuce',
          x: 65,
          y: 90,
          width: 14,
          height: 14,
          interactX: 90,
          interactY: 125,
          interactFacing: 'UP',
          visible: false,
          spriteName: 'item_lettuce',
        },
        {
          id: 'OBJ_FLASHLIGHT',
          name: 'Heavy Flashlight',
          x: 200,
          y: 90,
          width: 24,
          height: 12,
          interactX: 210,
          interactY: 115,
          interactFacing: 'UP',
          visible: true,
          spriteName: 'item_flashlight',
        },
        {
          id: 'OBJ_OLD_BATT',
          name: 'Old Batteries',
          x: 230,
          y: 92,
          width: 16,
          height: 12,
          interactX: 235,
          interactY: 115,
          interactFacing: 'UP',
          visible: true,
          spriteName: 'item_batteries',
        },
        {
          id: 'OBJ_MICROWAVE',
          name: 'Microwave Oven',
          x: 300,
          y: 70,
          width: 50,
          height: 25,
          interactX: 325,
          interactY: 115,
          interactFacing: 'UP',
          visible: true,
          open: false,
        },
        {
          id: 'OBJ_FAUCET',
          name: 'Faucet',
          x: 400,
          y: 80,
          width: 20,
          height: 15,
          interactX: 410,
          interactY: 115,
          interactFacing: 'UP',
          visible: true,
          flowing: false,
        },
      ],
    };

    // 4. AREA_PARLOR
    const parlor: RoomDefinition = {
      id: 'AREA_PARLOR',
      name: 'The Parlor',
      width: 320,
      height: 200,
      bgImage: '/assets/bg_parlor.png',
      walkboxes: [
        {
          id: 'WB_PARLOR_MAIN',
          polygon: [[0, 144], [320, 144], [320, 110], [0, 110]],
          scaleMin: 0.85,
          scaleMax: 1.0,
        },
      ],
      zPlanes: [
        { id: 'ZP_COUCH', x: 180, y: 110, width: 130, height: 25, baselineY: 135 },
      ],
      objects: [
        {
          id: 'OBJ_DOOR_FOYER_R',
          name: 'Parlor Door',
          x: 10,
          y: 60,
          width: 30,
          height: 70,
          interactX: 45,
          interactY: 120,
          interactFacing: 'LEFT',
          visible: true,
          open: true,
          doorTargetRoom: 'AREA_FOYER',
          doorTargetX: 430,
          doorTargetY: 120,
          doorTargetFacing: 'LEFT',
        },
        {
          id: 'OBJ_CABINET',
          name: 'Media Cabinet',
          x: 200,
          y: 80,
          width: 60,
          height: 40,
          interactX: 230,
          interactY: 125,
          interactFacing: 'UP',
          visible: true,
          open: false,
        },
        {
          id: 'OBJ_TAPE_DECK',
          name: 'Tape Deck',
          x: 210,
          y: 90,
          width: 40,
          height: 20,
          interactX: 230,
          interactY: 125,
          interactFacing: 'UP',
          visible: false,
        },
        {
          id: 'OBJ_ANT_RADIO',
          name: 'Antique Radio',
          x: 220,
          y: 50,
          width: 30,
          height: 30,
          interactX: 235,
          interactY: 125,
          interactFacing: 'UP',
          visible: true,
          open: false,
        },
        {
          id: 'OBJ_VACUUM_TUBE',
          name: 'Vacuum Tube',
          x: 230,
          y: 60,
          width: 12,
          height: 18,
          interactX: 235,
          interactY: 125,
          interactFacing: 'UP',
          visible: false,
          spriteName: 'item_vacuum_tube',
        },
        {
          id: 'OBJ_CHANDELIER',
          name: 'Glass Chandelier',
          x: 130,
          y: 10,
          width: 60,
          height: 40,
          interactX: 160,
          interactY: 115,
          interactFacing: 'UP',
          visible: true,
          shattered: false,
        },
        {
          id: 'OBJ_RUSTY_KEY',
          name: 'Rusty Key',
          x: 155,
          y: 30,
          width: 16,
          height: 10,
          interactX: 160,
          interactY: 115,
          interactFacing: 'UP',
          visible: true,
          attachedToChandelier: true,
          spriteName: 'item_rusty_key',
        },
        {
          id: 'OBJ_PANEL',
          name: 'Loose Wood Panel',
          x: 280,
          y: 70,
          width: 20,
          height: 40,
          interactX: 290,
          interactY: 115,
          interactFacing: 'UP',
          visible: true,
          open: false,
        },
        {
          id: 'OBJ_AUDIO_TAPE',
          name: 'Blank Audio Tape',
          x: 285,
          y: 80,
          width: 18,
          height: 12,
          interactX: 290,
          interactY: 115,
          interactFacing: 'UP',
          visible: false,
          spriteName: 'item_tape',
        },
      ],
    };

    this.rooms.set('AREA_APPROACH', approach);
    this.rooms.set('AREA_FOYER', foyer);
    this.rooms.set('AREA_COOKERY', cookery);
    this.rooms.set('AREA_PARLOR', parlor);

    for (const r of this.rooms.values()) {
      this.navMeshes.set(r.id, new NavMesh(r.walkboxes));
    }
  }

  public getRoom(id: string): RoomDefinition {
    const room = this.rooms.get(id);
    if (!room) throw new Error(`Unknown room: ${id}`);
    return room;
  }

  public getCurrentRoom(): RoomDefinition {
    return this.getRoom(this.currentRoomId);
  }

  public setCurrentRoom(id: string): RoomDefinition {
    const room = this.getRoom(id);
    this.currentRoomId = id;
    this.cameraX = 0;
    return room;
  }

  public getNavMesh(roomId: string): NavMesh {
    const mesh = this.navMeshes.get(roomId);
    if (!mesh) throw new Error(`No NavMesh for room: ${roomId}`);
    return mesh;
  }

  public getObject(objectId: string): RoomObject | null {
    for (const room of this.rooms.values()) {
      const obj = room.objects.find((o) => o.id === objectId);
      if (obj) return obj;
    }
    return null;
  }

  public updateCamera(actorX: number, roomWidth: number): void {
    if (roomWidth <= 320) {
      this.cameraX = 0;
      return;
    }
    const desired = actorX - 160;
    this.cameraX = Math.max(0, Math.min(roomWidth - 320, desired));
  }
}
