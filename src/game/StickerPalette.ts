import Phaser from 'phaser';
import { DEPTH, TRAY_H, DESIGN_W, DESIGN_H } from '../constants';
import { texKey } from '../assets';
import { sx, sy, sd, viewW } from '../utils/responsive';
const ITEM_SIZE = 250;
interface StickerPaletteItem {
    id: number;
    img: Phaser.GameObjects.Image;
    badge: Phaser.GameObjects.Container;
    homeX: number;
    homeY: number;
}
interface PaletteItemSize {
    w: number;
    h: number;
}
export class StickerPalette {
    private readonly scene: Phaser.Scene;
    private readonly bg: Phaser.GameObjects.Image;
    private items = new Map<number, StickerPaletteItem>();
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.bg = scene.add.image(0, 0, 'trayBg').setOrigin(0.5, 1).setDepth(DEPTH.TRAY_BG);
        this.relayout();
    }
    private itemDisplay(): PaletteItemSize {
        return { w: sd(ITEM_SIZE), h: sd(ITEM_SIZE * (343 / 339)) };
    }
    private homeFor(index: number, count: number): {
        x: number;
        y: number;
    } {
        const cell = DESIGN_W / count;
        return { x: sx(cell * (index + 0.5)), y: sy(DESIGN_H - TRAY_H / 2) };
    }
    private makeBadge(id: number): Phaser.GameObjects.Container {
        const circle = this.scene.add.circle(0, 0, 40, 0xffffff).setStrokeStyle(5, 0x000000);
        const text = this.scene.add
            .text(0, 0, String(id), { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#000000' })
            .setResolution(3)
            .setOrigin(0.5);
        text.setFontSize(46);
        return this.scene.add.container(0, 0, [circle, text]).setDepth(DEPTH.TRAY_BADGE);
    }
    stockForRound(ids: number[]): void {
        this.clear();
        const display = this.itemDisplay();
        for (let index = 0; index < ids.length; index++) {
            const stickerId = ids[index];
            const item = this.createItem(stickerId, index, ids.length, display);
            this.items.set(stickerId, item);
            this.syncBadge(item);
            this.playEntrance(item.img, index, display);
        }
    }
    private createItem(id: number, index: number, count: number, display: PaletteItemSize): StickerPaletteItem {
        const { w, h } = display;
        const home = this.homeFor(index, count);
        const img = this.scene.add.image(home.x, home.y, texKey.draggable(id)).setOrigin(0.5).setDepth(DEPTH.TRAY_ITEM);
        img.setDisplaySize(w, h);
        img.setData('stickerId', id);
        img.setInteractive({ useHandCursor: true });
        return {
            id,
            img,
            badge: this.makeBadge(id),
            homeX: home.x,
            homeY: home.y,
        };
    }
    private playEntrance(img: Phaser.GameObjects.Image, index: number, display: PaletteItemSize): void {
        const { w, h } = display;
        const restX = w / img.width;
        const restY = h / img.height;
        img.setData('restScale', restX);
        img.setScale(restX * 0.6, restY * 0.6);
        this.scene.tweens.add({
            targets: img,
            scaleX: restX,
            scaleY: restY,
            duration: 280,
            delay: index * 70,
            ease: 'Back.easeOut',
        });
    }
    private syncBadge(it: StickerPaletteItem): void {
        const dw = it.img.displayWidth;
        const dh = it.img.displayHeight;
        it.badge.setScale(dw / ITEM_SIZE);
        it.badge.setPosition(it.img.x + dw * 0.3, it.img.y - dh * 0.32);
        it.badge.setDepth(it.img.depth - 1);
        it.badge.setVisible(it.img.visible);
    }
    syncBadges(): void {
        for (const it of this.items.values())
            this.syncBadge(it);
    }
    draggableItems(): Phaser.GameObjects.Image[] {
        return [...this.items.values()].map((it) => it.img);
    }
    imageFor(id: number): Phaser.GameObjects.Image | null {
        return this.items.get(id)?.img ?? null;
    }
    remainingIds(): number[] {
        return [...this.items.keys()];
    }
    restoreItem(id: number): void {
        const it = this.items.get(id);
        if (!it)
            return;
        it.img.setDepth(DEPTH.TRAY_ITEM);
        const { w, h } = this.itemDisplay();
        this.scene.tweens.add({
            targets: it.img,
            x: it.homeX,
            y: it.homeY,
            scaleX: w / it.img.width,
            scaleY: h / it.img.height,
            duration: 260,
            ease: 'Back.easeOut',
        });
    }
    consumeItem(id: number): void {
        const it = this.items.get(id);
        if (!it)
            return;
        it.img.destroy();
        it.badge.destroy();
        this.items.delete(id);
    }
    clear(): void {
        for (const it of this.items.values()) {
            it.img.destroy();
            it.badge.destroy();
        }
        this.items.clear();
    }
    setVisible(v: boolean): void {
        this.bg.setVisible(v);
        for (const it of this.items.values()) {
            it.img.setVisible(v);
            it.badge.setVisible(v);
        }
    }
    relayout(): void {
        this.bg.setPosition(viewW() / 2, sy(DESIGN_H)).setDisplaySize(viewW(), sd(TRAY_H));
        const { w, h } = this.itemDisplay();
        const ids = [...this.items.keys()];
        for (let index = 0; index < ids.length; index++) {
            const it = this.items.get(ids[index]);
            if (!it)
                continue;
            const home = this.homeFor(index, ids.length);
            it.homeX = home.x;
            it.homeY = home.y;
            it.img.setData('restScale', w / it.img.width);
            if (!it.img.getData('dragging')) {
                it.img.setDisplaySize(w, h);
                it.img.setPosition(home.x, home.y);
            }
            this.syncBadge(it);
        }
    }
}
