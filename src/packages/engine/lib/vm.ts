export type ScriptGenerator = Generator<string | number | Promise<void> | void, void, unknown>;

export interface ScriptThread {
  id: string;
  name: string;
  type: 'global' | 'local';
  generator: ScriptGenerator;
  waitTimerMs: number;
  blockedOnActor?: string;
  isPaused: boolean;
  completed: boolean;
}

export class VirtualMachine {
  private threads: Map<string, ScriptThread> = new Map();
  public cutsceneActive: boolean = false;

  public startThread(id: string, name: string, type: 'global' | 'local', gen: ScriptGenerator): void {
    this.threads.set(id, {
      id,
      name,
      type,
      generator: gen,
      waitTimerMs: 0,
      isPaused: false,
      completed: false,
    });
  }

  public freeze(enableCutscene: boolean): void {
    this.cutsceneActive = enableCutscene;
  }

  public clearLocalThreads(): void {
    for (const [id, thread] of this.threads.entries()) {
      if (thread.type === 'local') {
        this.threads.delete(id);
      }
    }
  }

  public update(dtSeconds: number): void {
    const dtMs = dtSeconds * 1000;

    for (const thread of this.threads.values()) {
      if (thread.completed) continue;
      if (thread.isPaused) continue;

      if (this.cutsceneActive && thread.type === 'local') {
        continue;
      }

      if (thread.waitTimerMs > 0) {
        thread.waitTimerMs -= dtMs;
        if (thread.waitTimerMs > 0) continue;
      }

      try {
        const res = thread.generator.next();
        if (res.done) {
          thread.completed = true;
        } else if (typeof res.value === 'number') {
          thread.waitTimerMs = res.value;
        }
      } catch (err) {
        console.error(`Script thread error in [${thread.name}]:`, err);
        thread.completed = true;
      }
    }

    // Clean up finished threads
    for (const [id, thread] of this.threads.entries()) {
      if (thread.completed) {
        this.threads.delete(id);
      }
    }
  }

  public getActiveThreadCount(): number {
    return this.threads.size;
  }
}
