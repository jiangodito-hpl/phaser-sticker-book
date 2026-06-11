import Phaser from 'phaser';
import { ITERATION } from '../iteration';
export class CompletionGate {
    private readonly scene: Phaser.Scene;
    private readonly closePlayable: () => void;
    private placements = 0;
    private closed = false;
    private timer?: Phaser.Time.TimerEvent;
    constructor(scene: Phaser.Scene, closePlayable: () => void) {
        this.scene = scene;
        this.closePlayable = closePlayable;
    }
    start(): void {
        if (ITERATION.mode === 'time' && ITERATION.limit) {
            this.timer = this.scene.time.delayedCall(ITERATION.limit * 1000, () => this.gate());
        }
    }
    recordPlacement(): void {
        this.placements += 1;
        if (ITERATION.mode === 'clicks' && ITERATION.limit && this.placements >= ITERATION.limit) {
            this.gate();
        }
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
        return this.timer ? this.timer.getRemainingSeconds() : 0;
    }
}
