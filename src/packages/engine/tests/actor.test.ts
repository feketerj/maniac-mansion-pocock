import { describe, it, expect } from 'vitest';
import { ActorManager } from '../index';

describe('Actor & Multi-Character System Behavior', () => {
  it('initializes Dave, Bernard, and Syd with independent inventories', () => {
    const mgr = new ActorManager();
    const dave = mgr.getActor('dave');
    const bernard = mgr.getActor('bernard');
    const syd = mgr.getActor('syd');

    expect(dave.name).toBe('Dave');
    expect(bernard.name).toBe('Bernard');
    expect(syd.name).toBe('Syd');

    dave.addItem({ id: 'item1', name: 'Item 1', description: 'desc' });
    expect(dave.hasItem('item1')).toBe(true);
    expect(bernard.hasItem('item1')).toBe(false);
    expect(syd.hasItem('item1')).toBe(false);
  });

  it('switches active character correctly', () => {
    const mgr = new ActorManager();
    expect(mgr.getActiveActor().id).toBe('dave');

    mgr.setActiveActor('bernard');
    expect(mgr.getActiveActor().id).toBe('bernard');

    mgr.setActiveActor('syd');
    expect(mgr.getActiveActor().id).toBe('syd');
  });

  it('transfers items between characters in the same room', () => {
    const mgr = new ActorManager();
    const dave = mgr.getActor('dave');
    const bernard = mgr.getActor('bernard');

    // Put both in same room
    bernard.roomId = 'AREA_APPROACH';
    dave.roomId = 'AREA_APPROACH';
    dave.addItem({ id: 'brass_key', name: 'Brass Key', description: 'A key' });
    expect(dave.hasItem('brass_key')).toBe(true);

    const success = mgr.transferItem('dave', 'bernard', 'brass_key');
    expect(success).toBe(true);
    expect(dave.hasItem('brass_key')).toBe(false);
    expect(bernard.hasItem('brass_key')).toBe(true);
  });

  it('refuses item transfer when characters are in different rooms', () => {
    const mgr = new ActorManager();
    const dave = mgr.getActor('dave');
    const bernard = mgr.getActor('bernard');

    bernard.roomId = 'AREA_FOYER';
    dave.roomId = 'AREA_APPROACH';

    dave.addItem({ id: 'flashlight', name: 'Flashlight', description: 'desc' });
    const success = mgr.transferItem('dave', 'bernard', 'flashlight');
    expect(success).toBe(false);
    expect(dave.hasItem('flashlight')).toBe(true);
    expect(bernard.hasItem('flashlight')).toBe(false);
  });
});
