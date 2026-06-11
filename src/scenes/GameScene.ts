import Phaser from 'phaser';
import { IDLE_HINT_MS } from '../constants';
import { ITERATION } from '../iteration';
import { createStickerBatches } from '../game/layout';
import { RoundClock } from '../game/RoundClock';
import { AlbumRoomBackdrop } from '../game/AlbumRoomBackdrop';
import { PlacementBoard } from '../game/PlacementBoard';
import { StickerPalette } from '../game/StickerPalette';
import { DragInputCoordinator } from '../game/DragInputCoordinator';
import { SnapJudge } from '../game/SnapJudge';
import { PlacementBurstPool } from '../game/PlacementBurstPool';
import { FingerCue } from '../game/FingerCue';
import { CompletionGate } from '../game/CompletionGate';
import { AudioDirector } from '../game/AudioDirector';
import { StorefrontEndCard } from './cta';
import { bindLifecycle, notifyGameStart, notifyGameEnd } from '../networks';
import { trackEvent } from '../analytics';
export class StickerPlayScene extends Phaser.Scene {
    private roomBackdrop!: AlbumRoomBackdrop;
    private placementBoard!: PlacementBoard;
    private palette!: StickerPalette;
    private dragInput!: DragInputCoordinator;
    private snapJudge!: SnapJudge;
    private burstPool!: PlacementBurstPool;
    private fingerCue!: FingerCue;
    private completionGate!: CompletionGate;
    private audio!: AudioDirector;
    private storefront!: StorefrontEndCard;
    private batchIndex = 0;
    private activeStickerIds: number[] = [];
    private placedInBatch = 0;
    private endingLocked = false;
    private playNotified = false;
    private firstSolveTracked = false;
    private gestureCueDismissed = false;
    private idleCueTimer?: Phaser.Time.TimerEvent;
    private stickerBatches: number[][] = [];
    private clock?: RoundClock;
    constructor() {
        super('Game');
    }
    create(): void {
        this.buildGameplaySystems();
        this.wireDragInput();
        this.wireAdLifecycle();
        this.wireFirstTap();
        this.startFirstBatch();
        this.startAutoSolveIfRequested();
    }
    private buildGameplaySystems(): void {
        this.roomBackdrop = new AlbumRoomBackdrop(this);
        this.placementBoard = new PlacementBoard(this);
        this.palette = new StickerPalette(this);
        this.snapJudge = new SnapJudge(this.placementBoard);
        this.burstPool = new PlacementBurstPool(this);
        this.fingerCue = new FingerCue(this);
        this.audio = new AudioDirector(this);
        this.storefront = new StorefrontEndCard(this);
        this.completionGate = new CompletionGate(this, () => this.finishPlayable());
        if (ITERATION.mode === 'time')
            this.clock = new RoundClock(this);
    }
    private wireDragInput(): void {
        this.dragInput = new DragInputCoordinator(this, {
            onStart: () => this.handleDragStart(),
            onMove: (id, x, y) => this.handleDragMove(id, x, y),
            onDrop: (id, x, y) => this.handleDrop(id, x, y),
        });
    }
    private wireAdLifecycle(): void {
        this.game.events.on('ad-pause', this.onAdPause, this);
        this.game.events.on('ad-resume', this.onAdResume, this);
        this.game.events.on('ad-mute', this.onAdMute, this);
        this.game.events.on('ad-volume', this.onAdVolume, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.disposeSceneHooks, this);
        bindLifecycle(this);
    }
    private wireFirstTap(): void {
        this.input.on('pointerdown', () => {
            this.audio.unlock();
            this.markGameplayStarted();
            this.scheduleIdleCue();
        });
    }
    private startFirstBatch(): void {
        this.stickerBatches = createStickerBatches();
        trackEvent('DISPLAYED');
        this.completionGate.start();
        this.clock?.show();
        this.startStickerBatch();
    }
    private startAutoSolveIfRequested(): void {
        if (typeof location !== 'undefined' && location.hash.toLowerCase().includes('auto')) {
            this.time.delayedCall(1200, () => this.autoPlaceNext());
        }
    }
    private autoPlaceNext(): void {
        if (this.endingLocked)
            return;
        const ids = this.palette.remainingIds();
        if (!ids.length) {
            this.time.delayedCall(250, () => this.autoPlaceNext());
            return;
        }
        this.markGameplayStarted();
        this.fingerCue.cancel();
        this.gestureCueDismissed = true;
        this.handleCorrectDrop(ids[0]);
        this.time.delayedCall(220, () => this.autoPlaceNext());
    }
    update(): void {
        this.palette?.syncBadges();
        if (this.clock)
            this.clock.set(this.completionGate.secondsLeft());
    }
    private onAdPause(): void {
        this.audio.pause();
        if (!this.endingLocked && !this.scene.isPaused())
            this.scene.pause();
    }
    private onAdResume(): void {
        if (this.scene.isPaused())
            this.scene.resume();
        this.audio.resume();
    }
    private onAdMute(muted: boolean): void {
        this.audio.setContainerMute(muted);
    }
    private onAdVolume(v: number): void {
        this.audio.setContainerVolume(v);
    }
    private markGameplayStarted(): void {
        if (this.playNotified)
            return;
        this.playNotified = true;
        notifyGameStart();
        trackEvent('CHALLENGE_STARTED');
    }
    private startStickerBatch(): void {
        const ids = this.stickerBatches[this.batchIndex];
        this.activeStickerIds = ids;
        this.placedInBatch = 0;
        this.palette.stockForRound(ids);
        this.placementBoard.revealTargets(ids);
        this.dragInput.enable(this.palette.draggableItems());
        this.scheduleIdleCue();
        if (this.batchIndex === 0 && !this.gestureCueDismissed) {
            this.time.delayedCall(550, () => this.showOpeningCue());
        }
    }
    private showOpeningCue(): void {
        if (this.gestureCueDismissed || this.endingLocked)
            return;
        const id = this.activeStickerIds[0];
        const img = this.palette.imageFor(id);
        const c = this.placementBoard.slotFor(id).center;
        if (img)
            this.fingerCue.playGuidedDrag(img, c.x, c.y);
    }
    private handleDragStart(): void {
        this.fingerCue.cancel();
        this.gestureCueDismissed = true;
        this.markGameplayStarted();
        this.scheduleIdleCue();
    }
    private handleDragMove(id: number, px: number, py: number): void {
        const img = this.palette.imageFor(id);
        if (!img)
            return;
        const slot = this.placementBoard.slotFor(id);
        if (!slot.active || slot.placed)
            return;
        const c = slot.center;
        const ds = slot.displaySize;
        const dist = Phaser.Math.Distance.Between(px, py, c.x, c.y);
        const zone = Math.max(ds.w, ds.h) * 0.7 + 60;
        const rest = (img.getData('restScale') as number) || img.scaleX;
        const t = Phaser.Math.Clamp(1 - dist / zone, 0, 1);
        img.setScale(Phaser.Math.Linear(img.scaleX, rest * (1.12 + t * 0.22), 0.3));
        if (t > 0) {
            img.x = Phaser.Math.Linear(img.x, c.x, t * 0.85);
            img.y = Phaser.Math.Linear(img.y, c.y, t * 0.85);
        }
    }
    private handleDrop(id: number, x: number, y: number): void {
        if (this.endingLocked)
            return;
        if (this.snapJudge.canSnap(id, x, y))
            this.handleCorrectDrop(id);
        else
            this.handleMissedDrop(id);
    }
    private handleCorrectDrop(id: number): void {
        const c = this.placementBoard.slotFor(id).center;
        const img = this.palette.imageFor(id);
        if (img) {
            this.tweens.add({
                targets: img,
                x: c.x,
                y: c.y,
                duration: 150,
                ease: 'Sine.easeIn',
                onComplete: () => this.completePlacement(id),
            });
        }
        else {
            this.completePlacement(id);
        }
    }
    private completePlacement(id: number): void {
        const c = this.placementBoard.slotFor(id).center;
        this.palette.consumeItem(id);
        this.placementBoard.fill(id);
        this.burstPool.play(c.x, c.y);
        this.audio.playSnap();
        if (!this.firstSolveTracked) {
            this.firstSolveTracked = true;
            trackEvent('CHALLENGE_SOLVED');
        }
        this.placedInBatch += 1;
        this.completionGate.recordPlacement();
        if (this.endingLocked)
            return;
        if (this.placedInBatch >= this.activeStickerIds.length)
            this.advanceBatch();
        else
            this.scheduleIdleCue();
    }
    private advanceBatch(): void {
        this.batchIndex += 1;
        if (this.batchIndex >= this.stickerBatches.length) {
            this.completionGate.finishNow();
            return;
        }
        this.time.delayedCall(450, () => this.startStickerBatch());
    }
    private handleMissedDrop(id: number): void {
        this.audio.playMiss();
        this.palette.restoreItem(id);
        this.scheduleIdleCue();
    }
    private scheduleIdleCue(): void {
        this.idleCueTimer?.remove();
        if (this.endingLocked)
            return;
        this.idleCueTimer = this.time.delayedCall(IDLE_HINT_MS, () => this.showIdleCue());
    }
    private showIdleCue(): void {
        if (this.endingLocked || this.fingerCue.isActive)
            return;
        const ids = this.palette.remainingIds();
        if (!ids.length)
            return;
        const id = ids[0];
        const img = this.palette.imageFor(id);
        const c = this.placementBoard.slotFor(id).center;
        if (img)
            this.fingerCue.playIdleCue(img, c.x, c.y);
    }
    private finishPlayable(): void {
        if (this.endingLocked)
            return;
        this.endingLocked = true;
        this.idleCueTimer?.remove();
        this.fingerCue.cancel();
        this.dragInput.setEnabled(false);
        this.clock?.hide();
        notifyGameEnd();
        this.palette.setVisible(false);
        this.roomBackdrop.showCompletedRoom();
        this.time.delayedCall(800, () => this.storefront.show());
    }
    relayout(): void {
        this.roomBackdrop.relayout();
        this.placementBoard.relayout();
        this.palette.relayout();
        this.fingerCue.relayout();
        this.storefront.relayout();
        this.clock?.relayout();
    }
    private disposeSceneHooks(): void {
        this.game.events.off('ad-pause', this.onAdPause, this);
        this.game.events.off('ad-resume', this.onAdResume, this);
        this.game.events.off('ad-mute', this.onAdMute, this);
        this.game.events.off('ad-volume', this.onAdVolume, this);
        this.idleCueTimer?.remove();
    }
}
