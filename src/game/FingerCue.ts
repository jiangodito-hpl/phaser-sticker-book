import Phaser from 'phaser';
import { DEPTH, TUTORIAL_DIM_ALPHA } from '../constants';
import { sd, viewW, viewH } from '../utils/responsive';
const FULLSCREEN_BLEED = 96;
const setPageOverlay = (active: boolean): void => {
    if (typeof document === 'undefined')
        return;
    document.documentElement?.classList.toggle('tutorial-overlay-active', active);
    document.body?.classList.toggle('tutorial-overlay-active', active);
};
export class FingerCue {
    private scene: Phaser.Scene;
    private hand: Phaser.GameObjects.Image;
    private dim?: Phaser.GameObjects.Rectangle;
    private tween?: Phaser.Tweens.Tween;
    private raised?: Phaser.GameObjects.Image;
    private target?: Phaser.GameObjects.Image;
    private destination?: { x: number; y: number };
    private active = false;
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.hand = scene.add
            .image(0, 0, 'handIcon')
            .setOrigin(0.32, 0.08)
            .setDepth(DEPTH.HAND)
            .setVisible(false);
    }
    get isActive(): boolean {
        return this.active;
    }
    get stickerId(): number | undefined {
        return this.target?.getData('stickerId') as number | undefined;
    }
    private animate(fromX: number, fromY: number, toX: number, toY: number): void {
        this.hand.setVisible(true).setPosition(fromX, fromY).setAlpha(1);
        this.hand.setDisplaySize(sd(150), sd((150 * 180) / 198));
        this.tween?.remove();
        this.tween = this.scene.tweens.add({
            targets: this.hand,
            x: toX,
            y: toY,
            duration: 950,
            ease: 'Sine.easeInOut',
            repeat: -1,
            repeatDelay: 350,
            onRepeat: () => this.hand.setPosition(fromX, fromY),
        });
    }
    private begin(target: Phaser.GameObjects.Image, slotX: number, slotY: number): void {
        this.target = target;
        this.destination = { x: slotX, y: slotY };
        this.animate(target.x, target.y, slotX, slotY);
    }
    playGuidedDrag(target: Phaser.GameObjects.Image, slotX: number, slotY: number): void {
        if (this.active)
            return;
        this.active = true;
        this.dim = this.scene.add
            .rectangle(-FULLSCREEN_BLEED, -FULLSCREEN_BLEED, viewW() + FULLSCREEN_BLEED * 2, viewH() + FULLSCREEN_BLEED * 2, 0x000000, TUTORIAL_DIM_ALPHA)
            .setOrigin(0, 0)
            .setDepth(DEPTH.DIM)
            .setInteractive();
        setPageOverlay(true);
        this.raised = target;
        target.setDepth(DEPTH.DIM + 1);
        this.begin(target, slotX, slotY);
    }
    playIdleCue(target: Phaser.GameObjects.Image, slotX: number, slotY: number): void {
        if (this.active)
            return;
        this.active = true;
        this.begin(target, slotX, slotY);
    }
    retarget(slotX: number, slotY: number): void {
        if (!this.active || !this.target?.active)
            return;
        this.destination = { x: slotX, y: slotY };
        this.animate(this.target.x, this.target.y, slotX, slotY);
    }
    cancel(): void {
        if (!this.active)
            return;
        this.active = false;
        this.tween?.remove();
        this.tween = undefined;
        this.hand.setVisible(false);
        this.raised?.setDepth(DEPTH.TRAY_ITEM);
        this.raised = undefined;
        this.target = undefined;
        this.destination = undefined;
        this.dim?.destroy();
        this.dim = undefined;
        setPageOverlay(false);
    }
    relayout(): void {
        if (this.dim)
            this.dim.setPosition(-FULLSCREEN_BLEED, -FULLSCREEN_BLEED).setSize(viewW() + FULLSCREEN_BLEED * 2, viewH() + FULLSCREEN_BLEED * 2);
    }
}
