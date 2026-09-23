import { describe, it, expect } from 'vitest';
import { NavMesh, pointInPolygon, Walkbox } from '../src/packages/engine';

describe('NavMesh & Pathfinding Behavior', () => {
  const testBoxes: Walkbox[] = [
    {
      id: 'BOX_A',
      polygon: [[0, 0], [100, 0], [100, 100], [0, 100]],
      scaleMin: 0.5,
      scaleMax: 1.0,
    },
    {
      id: 'BOX_B',
      polygon: [[100, 0], [200, 0], [200, 100], [100, 100]],
      scaleMin: 0.8,
      scaleMax: 1.0,
    },
  ];

  it('accurately identifies point inside polygon', () => {
    expect(pointInPolygon([50, 50], testBoxes[0].polygon)).toBe(true);
    expect(pointInPolygon([150, 50], testBoxes[0].polygon)).toBe(false);
  });

  it('interpolates perspective scaling along the Y-axis within a walkbox', () => {
    const mesh = new NavMesh(testBoxes);
    // At y=0 (top), scale should be scaleMin (0.5)
    expect(mesh.getScaleForPoint([50, 0])).toBeCloseTo(0.5);
    // At y=100 (bottom), scale should be scaleMax (1.0)
    expect(mesh.getScaleForPoint([50, 100])).toBeCloseTo(1.0);
    // At y=50 (midpoint), scale should be 0.75
    expect(mesh.getScaleForPoint([50, 50])).toBeCloseTo(0.75);
  });

  it('computes traversal waypoints across connected walkboxes', () => {
    const mesh = new NavMesh(testBoxes);
    const path = mesh.findPath([20, 50], [180, 50]);
    expect(path.length).toBeGreaterThanOrEqual(2);
    expect(path[0]).toEqual([20, 50]);
    expect(path[path.length - 1]).toEqual([180, 50]);
  });

  it('clamps out-of-bounds coordinates to nearest polygon perimeter edge', () => {
    const mesh = new NavMesh(testBoxes);
    // Point at (-10, 50) is closest to edge segment [0, 0]..[0, 100], should clamp to [0, 50]
    const clamped = mesh.clampToNearestWalkbox([-10, 50]);
    expect(clamped[0]).toBeCloseTo(0);
    expect(clamped[1]).toBeCloseTo(50);
  });
});
