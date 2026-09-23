import { describe, it, expect } from 'vitest';
import { VirtualMachine } from '../index';

describe('Virtual Machine Cooperative Multitasking', () => {
  it('advances script generator across tick frames with delay yields', () => {
    const vm = new VirtualMachine();
    let step = 0;

    function* testScript() {
      step = 1;
      yield 100; // wait 100ms
      step = 2;
      yield 200; // wait 200ms
      step = 3;
    }

    vm.startThread('thread1', 'Test Script', 'global', testScript());

    // Frame 1: starts thread
    vm.update(0.016);
    expect(step).toBe(1);

    // Advance 50ms (not yet 100ms)
    vm.update(0.05);
    expect(step).toBe(1);

    // Advance past 100ms
    vm.update(0.06);
    expect(step).toBe(2);

    // Advance past 200ms
    vm.update(0.25);
    expect(step).toBe(3);
  });

  it('suspends local threads during cutscene lock while global threads run', () => {
    const vm = new VirtualMachine();
    let localRan = false;
    let globalRan = false;

    function* localScript() {
      localRan = true;
    }
    function* globalScript() {
      globalRan = true;
    }

    vm.freeze(true);
    vm.startThread('local1', 'Local', 'local', localScript());
    vm.startThread('global1', 'Global', 'global', globalScript());

    vm.update(0.016);

    expect(localRan).toBe(false);
    expect(globalRan).toBe(true);

    vm.freeze(false);
    vm.update(0.016);
    expect(localRan).toBe(true);
  });
});
