import Phaser from 'phaser';
import { ITERATION } from '../iteration';
export class CompletionGate {
    private readonly scene: Phaser.Scene;
    private readonly closePlayable: () => void;
    private placements = 0;
    private moves = 0;
    private closed = false;
    private timer?: Phaser.Time.TimerEvent;
    constructor(scene: Phaser.Scene, closePlayable: () => void) {
        this.scene = scene;
        this.closePlayable = closePlayable;
    }
    start(): void {
        if (ITERATION.mode !== 'time' || !ITERATION.limit || this.timer || this.closed)
            return;
        this.timer = this.scene.time.delayedCall(ITERATION.limit * 1000, () => this.gate());
    }
    recordMove(): boolean {
        if (this.closed)
            return true;
        this.moves += 1;
        return ITERATION.mode === 'clicks' && !!ITERATION.limit && this.moves >= ITERATION.limit;
    }
    recordPlacement(): void {
        this.placements += 1;
    }
    finishNow(): void {
        this.close();
    }
    private gate(): void {
        this.close();
    }
    private close(): void {
        if (this.closed)
            return;
        this.closed = true;
        this.timer?.remove();
        this.closePlayable();
    }
    get isClosed(): boolean {
        return this.closed;
    }
    secondsLeft(): number {
        if (this.timer)
            return this.timer.getRemainingSeconds();
        return ITERATION.mode === 'time' && ITERATION.limit && !this.closed ? ITERATION.limit : 0;
    }
}
