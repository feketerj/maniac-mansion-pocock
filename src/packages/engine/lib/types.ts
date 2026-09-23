export type Point2D = [number, number];
export type Polygon = Point2D[];

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type FacingDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type VerbType =
  | 'WALK_TO'
  | 'PUSH'
  | 'PULL'
  | 'GIVE'
  | 'OPEN'
  | 'CLOSE'
  | 'LOOK_AT'
  | 'PICK_UP'
  | 'WHAT_IS'
  | 'UNLOCK'
  | 'TURN_ON'
  | 'TURN_OFF'
  | 'USE'
  | 'READ'
  | 'TALK_TO'
  | 'NEW_KID';

export type CharacterId = 'dave' | 'bernard' | 'syd';

export interface ItemDefinition {
  id: string;
  name: string;
  spriteName?: string;
  description: string;
}

export interface RoomObject {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  interactX: number;
  interactY: number;
  interactFacing: FacingDirection;
  visible: boolean;
  locked?: boolean;
  open?: boolean;
  pushed?: boolean;
  flowing?: boolean;
  shattered?: boolean;
  attachedToChandelier?: boolean;
  spriteName?: string;
  hoverHighlight?: boolean;
  doorTargetRoom?: string;
  doorTargetX?: number;
  doorTargetY?: number;
  doorTargetFacing?: FacingDirection;
}

export interface Walkbox {
  id: string;
  polygon: Polygon;
  scaleMin: number;
  scaleMax: number;
}

export interface ZPlaneMask {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baselineY: number;
}

export interface RoomDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  bgImage: string;
  walkboxes: Walkbox[];
  zPlanes: ZPlaneMask[];
  objects: RoomObject[];
}
