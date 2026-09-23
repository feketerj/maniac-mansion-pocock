import { CharacterId, ItemDefinition, VerbType } from './types';

export interface VerbLayoutItem {
  verb: VerbType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class SentenceConstructor {
  public activeVerb: VerbType = 'WALK_TO';
  public directObject: { id: string; name: string; isInventory?: boolean } | null = null;
  public indirectObject: { id: string; name: string } | null = null;
  public hoverObject: { id: string; name: string } | null = null;

  public reset(): void {
    this.activeVerb = 'WALK_TO';
    this.directObject = null;
    this.indirectObject = null;
    this.hoverObject = null;
  }

  public setVerb(verb: VerbType): void {
    this.activeVerb = verb;
    this.directObject = null;
    this.indirectObject = null;
  }

  public setDirectObject(obj: { id: string; name: string; isInventory?: boolean }): void {
    this.directObject = obj;
  }

  public setIndirectObject(obj: { id: string; name: string }): void {
    this.indirectObject = obj;
  }

  public setHoverObject(obj: { id: string; name: string } | null): void {
    this.hoverObject = obj;
  }

  public getVerbLabel(verb: VerbType): string {
    switch (verb) {
      case 'WALK_TO': return 'Walk to';
      case 'PUSH': return 'Push';
      case 'PULL': return 'Pull';
      case 'GIVE': return 'Give';
      case 'OPEN': return 'Open';
      case 'CLOSE': return 'Close';
      case 'LOOK_AT': return 'Look at';
      case 'PICK_UP': return 'Pick up';
      case 'WHAT_IS': return 'What is';
      case 'UNLOCK': return 'Unlock';
      case 'TURN_ON': return 'Turn on';
      case 'TURN_OFF': return 'Turn off';
      case 'USE': return 'Use';
      case 'READ': return 'Read';
      case 'TALK_TO': return 'Talk to';
      case 'NEW_KID': return 'New kid';
    }
  }

  public constructSentence(): string {
    const verbStr = this.getVerbLabel(this.activeVerb);

    if (this.indirectObject && this.directObject) {
      if (this.activeVerb === 'UNLOCK' && this.directObject.isInventory) {
        return `${verbStr} ${this.indirectObject.name} with ${this.directObject.name}`;
      }
      const prep = this.activeVerb === 'GIVE' ? 'to' : 'with';
      return `${verbStr} ${this.directObject.name} ${prep} ${this.indirectObject.name}`;
    }

    if (this.directObject) {
      if (this.activeVerb === 'USE') {
        const target = this.hoverObject ? this.hoverObject.name : '...';
        return `${verbStr} ${this.directObject.name} with ${target}`;
      }
      if (this.activeVerb === 'GIVE') {
        const target = this.hoverObject ? this.hoverObject.name : '...';
        return `${verbStr} ${this.directObject.name} to ${target}`;
      }
      if (this.activeVerb === 'UNLOCK') {
        const target = this.hoverObject ? this.hoverObject.name : '...';
        if (this.directObject.isInventory) {
          return `${verbStr} ${target} with ${this.directObject.name}`;
        }
        return `${verbStr} ${this.directObject.name} with ${target}`;
      }
      return `${verbStr} ${this.directObject.name}`;
    }

    if (this.hoverObject) {
      return `${verbStr} ${this.hoverObject.name}`;
    }

    return verbStr;
  }
}

export class ControlPanelUI {
  public inventoryOffset: number = 0;
  public readonly visibleInventoryCount: number = 4;
  public verbs: VerbLayoutItem[] = [];

  constructor() {
    this.initVerbLayout();
  }

  private initVerbLayout(): void {
    // 3 columns x 5 rows in Control Panel (X: 0..195, Y: 152..198)
    // Left: 0..65, Mid: 66..130, Right: 131..195
    const matrix: { verb: VerbType; label: string; col: number; row: number }[] = [
      { verb: 'PUSH', label: 'Push', col: 0, row: 0 },
      { verb: 'OPEN', label: 'Open', col: 1, row: 0 },
      { verb: 'WALK_TO', label: 'Walk to', col: 2, row: 0 },
      { verb: 'PULL', label: 'Pull', col: 0, row: 1 },
      { verb: 'CLOSE', label: 'Close', col: 1, row: 1 },
      { verb: 'PICK_UP', label: 'Pick up', col: 2, row: 1 },
      { verb: 'GIVE', label: 'Give', col: 0, row: 2 },
      { verb: 'READ', label: 'Read', col: 1, row: 2 },
      { verb: 'WHAT_IS', label: 'What is', col: 2, row: 2 },
      { verb: 'UNLOCK', label: 'Unlock', col: 0, row: 3 },
      { verb: 'TURN_ON', label: 'Turn on', col: 1, row: 3 },
      { verb: 'NEW_KID', label: 'New kid', col: 2, row: 3 },
      { verb: 'USE', label: 'Use', col: 0, row: 4 },
      { verb: 'TURN_OFF', label: 'Turn off', col: 1, row: 4 },
      { verb: 'TALK_TO', label: 'Talk to', col: 2, row: 4 },
    ];

    const colWidth = 64;
    const rowHeight = 9;
    const startY = 153;

    for (const item of matrix) {
      this.verbs.push({
        verb: item.verb,
        label: item.label,
        x: item.col * colWidth + 4,
        y: startY + item.row * rowHeight,
        width: colWidth - 6,
        height: rowHeight,
      });
    }
  }

  public getVerbAt(x: number, y: number): VerbType | null {
    for (const v of this.verbs) {
      if (x >= v.x && x <= v.x + v.width && y >= v.y && y <= v.y + v.height) {
        return v.verb;
      }
    }
    return null;
  }

  public scrollInventory(direction: 'UP' | 'DOWN', totalItems: number): void {
    if (direction === 'UP') {
      if (this.inventoryOffset > 0) this.inventoryOffset--;
    } else {
      if (this.inventoryOffset + this.visibleInventoryCount < totalItems) {
        this.inventoryOffset++;
      }
    }
  }

  public getInventoryItemAt(x: number, y: number, items: ItemDefinition[]): ItemDefinition | null {
    // Inventory zone: X: 200..305, Y: 153..198
    // 4 items vertically stacked
    if (x < 200 || x > 305 || y < 153 || y > 198) {
      return null;
    }
    const itemIdx = Math.floor((y - 153) / 11) + this.inventoryOffset;
    if (itemIdx >= 0 && itemIdx < items.length) {
      return items[itemIdx];
    }
    return null;
  }

  public isScrollArrowClicked(x: number, y: number): 'UP' | 'DOWN' | null {
    // Arrows at X: 308..318. Up at Y: 154..165, Down at Y: 185..196
    if (x >= 306 && x <= 319) {
      if (y >= 153 && y <= 168) return 'UP';
      if (y >= 183 && y <= 198) return 'DOWN';
    }
    return null;
  }

  public isCharacterTabClicked(x: number, y: number): CharacterId | null {
    // Top banner character switcher: X: 195..320, Y: 2..12
    // Dave: 200..235, Bernard: 240..280, Syd: 285..315
    if (y >= 2 && y <= 14) {
      if (x >= 195 && x <= 235) return 'dave';
      if (x >= 238 && x <= 282) return 'bernard';
      if (x >= 285 && x <= 318) return 'syd';
    }
    return null;
  }
}
