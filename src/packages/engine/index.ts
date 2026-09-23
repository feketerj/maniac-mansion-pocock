// Public entry point for @engine deep module
export { GameEngine } from './lib/game';
export { NavMesh, pointInPolygon, polygonCentroid, distance } from './lib/navmesh';
export { Actor, ActorManager } from './lib/actor';
export { RoomManager } from './lib/rooms';
export { VirtualMachine } from './lib/vm';
export type { ScriptThread, ScriptGenerator } from './lib/vm';
export { ControlPanelUI, SentenceConstructor } from './lib/ui';
export type { VerbLayoutItem } from './lib/ui';
export { AudioSystem } from './lib/audio';
export { BitmapFont8x8 } from './lib/font';
export { EventDispatcher } from './lib/events';
export type { CommandContext } from './lib/events';

export type {
  Point2D,
  Polygon,
  BoundingBox,
  FacingDirection,
  VerbType,
  CharacterId,
  ItemDefinition,
  RoomObject,
  Walkbox,
  ZPlaneMask,
  RoomDefinition,
} from './lib/types';
