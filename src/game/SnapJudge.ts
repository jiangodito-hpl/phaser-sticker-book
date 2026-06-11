import Phaser from 'phaser';
import type { PlacementBoard } from './PlacementBoard';
export class SnapJudge {
    constructor(private slots: PlacementBoard) { }
    canSnap(id: number, x: number, y: number): boolean {
        const slot = this.slots.slotFor(id);
        if (!slot.active || slot.placed)
            return false;
        const c = slot.center;
        return Phaser.Math.Distance.Between(x, y, c.x, c.y) <= slot.hitRadius;
    }
}
