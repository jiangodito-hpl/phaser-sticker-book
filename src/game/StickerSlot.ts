import Phaser from 'phaser';
import { DEPTH, STICKER_SCALE } from '../constants';
import { texKey } from '../assets';
import { sx, sy, sd } from '../utils/responsive';
import type { AlbumStickerSpec } from './layout';
export class StickerSlot {
    readonly def: AlbumStickerSpec;
    private readonly scene: Phaser.Scene;
    private outline?: Phaser.GameObjects.Image;
    private badge?: Phaser.GameObjects.Text;
    private colored?: Phaser.GameObjects.Image;
    private pulse?: Phaser.Tweens.Tween;
    placed = false;
    active = false;
    constructor(scene: Phaser.Scene, def: AlbumStickerSpec) {
        this.scene = scene;
        this.def = def;
    }
    private get sc(): number {
        return STICKER_SCALE * (this.def.scale ?? 1);
    }
    private get dispW(): number {
        return this.def.w * this.sc;
    }
    private get dispH(): number {
        return this.def.h * this.sc;
    }
    private depthFor(): number {
        const feet = this.def.cy + this.dispH / 2;
        return (this.def.zIndex ?? 0) * DEPTH.ROOM_Z + feet;
    }
    get center(): {
        x: number;
        y: number;
    } {
        return { x: sx(this.def.cx), y: sy(this.def.cy) };
    }
    get displaySize(): {
        w: number;
        h: number;
    } {
        return { w: sd(this.dispW), h: sd(this.dispH) };
    }
    get hitRadius(): number {
        return sd(Math.max(this.dispW, this.dispH) * 0.55 + 60);
    }
    reveal(): void {
        if (this.placed)
            return;
        this.active = true;
        const d = this.depthFor();
        if (!this.outline) {
            this.outline = this.scene.add.image(0, 0, texKey.outline(this.def.id)).setOrigin(0.5).setDepth(d);
        }
        if (!this.badge)
            this.badge = this.makeBadge();
        this.layoutImage(this.outline);
        this.layoutBadge();
        this.outline.setVisible(true).setAlpha(0);
        this.badge.setVisible(true).setAlpha(0);
        this.scene.tweens.add({ targets: [this.outline, this.badge], alpha: 1, duration: 280, ease: 'Sine.easeOut' });
        this.pulse = this.makePulse();
    }
    fill(animate = true): void {
        if (this.placed)
            return;
        this.active = false;
        this.placed = true;
        this.pulse?.remove();
        this.pulse = undefined;
        this.outline?.destroy();
        this.outline = undefined;
        this.badge?.destroy();
        this.badge = undefined;
        this.colored = this.scene.add
            .image(0, 0, texKey.colored(this.def.id))
            .setOrigin(0.5)
            .setDepth(this.depthFor());
        this.layoutImage(this.colored);
        if (!animate)
            return;
        const t = this.colored.scaleX;
        this.colored.setScale(t * 0.2);
        this.scene.tweens.add({
            targets: this.colored,
            scaleX: t * 1.18,
            scaleY: t * 1.18,
            duration: 190,
            ease: 'Quad.easeOut',
            onComplete: () => {
                if (!this.colored)
                    return;
                this.scene.tweens.add({
                    targets: this.colored,
                    scaleX: t,
                    scaleY: t,
                    duration: 180,
                    ease: 'Quad.easeInOut',
                });
            },
        });
    }
    private makePulse(): Phaser.Tweens.Tween | undefined {
        if (!this.outline)
            return undefined;
        return this.scene.tweens.add({
            targets: this.outline,
            scale: { from: this.outline.scaleX, to: this.outline.scaleX * 1.06 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }
    private makeBadge(): Phaser.GameObjects.Text {
        return this.scene.add
            .text(0, 0, String(this.def.id), { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#444444' })
            .setResolution(3)
            .setOrigin(0.5)
            .setDepth(DEPTH.OUTLINE_BADGE);
    }
    private layoutImage(img: Phaser.GameObjects.Image): void {
        img.setPosition(sx(this.def.cx), sy(this.def.cy));
        img.setDisplaySize(sd(this.dispW), sd(this.dispH));
    }
    private layoutBadge(): void {
        if (!this.badge)
            return;
        this.badge.setPosition(sx(this.def.labelX ?? this.def.cx), sy(this.def.labelY ?? this.def.cy));
        this.badge.setFontSize(Math.max(11, sd(30)));
    }
    relayout(): void {
        if (this.outline) {
            this.layoutImage(this.outline);
            if (this.active && this.pulse) {
                this.pulse.remove();
                this.pulse = this.makePulse();
            }
        }
        if (this.badge)
            this.layoutBadge();
        if (this.colored) {
            this.layoutImage(this.colored);
            this.colored.setDepth(this.depthFor());
        }
    }
}
