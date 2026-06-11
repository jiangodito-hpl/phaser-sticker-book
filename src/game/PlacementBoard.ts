import Phaser from 'phaser';
import { STICKER_CATALOG, getStickerSpec } from './layout';
import { StickerSlot } from './StickerSlot';
export class PlacementBoard {
    private readonly slots = new Map<number, StickerSlot>();
    constructor(scene: Phaser.Scene) {
        for (const def of STICKER_CATALOG) {
            this.slots.set(def.id, new StickerSlot(scene, getStickerSpec(def.id)));
        }
    }
    slotFor(id: number): StickerSlot {
        const s = this.slots.get(id);
        if (!s)
            throw new Error(`No slot ${id}`);
        return s;
    }
    revealTargets(ids: number[]): void {
        for (const id of ids)
            this.slotFor(id).reveal();
    }
    fill(id: number): void {
        this.slotFor(id).fill();
    }
    pendingSlots(): StickerSlot[] {
        const out: StickerSlot[] = [];
        for (const slot of this.slots.values())
            if (slot.active && !slot.placed)
                out.push(slot);
        return out;
    }
    relayout(): void {
        for (const slot of this.slots.values())
            slot.relayout();
    }
}
