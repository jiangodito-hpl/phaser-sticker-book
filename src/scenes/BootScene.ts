import Phaser from 'phaser';
import { IMAGES, AUDIO, COLORED, OUTLINE, DRAGGABLE, texKey } from '../assets';
import { STICKER_CATALOG } from '../game/layout';
export class AssetBootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }
    preload(): void {
        this.load.image('bgWhite', IMAGES.bgWhite);
        this.load.image('bgColored', IMAGES.bgColored);
        this.load.image('trayBg', IMAGES.trayBg);
        this.load.image('handIcon', IMAGES.handIcon);
        this.load.image('starBurst', IMAGES.starBurst);
        this.load.image('ctaButton', IMAGES.ctaButton);
        this.load.image('logo', IMAGES.logo);
        for (const s of STICKER_CATALOG) {
            this.load.image(texKey.outline(s.id), OUTLINE[s.id]);
            this.load.image(texKey.colored(s.id), COLORED[s.id]);
            this.load.image(texKey.draggable(s.id), DRAGGABLE[s.id]);
        }
        this.load.audio('bgm', AUDIO.bgm);
        this.load.audio('sfxCorrect', AUDIO.sfxCorrect);
        this.load.audio('sfxWrong', AUDIO.sfxWrong);
        this.load.audio('sfxFinished', AUDIO.sfxFinished);
    }
    create(): void {
        this.scene.start('Game');
    }
}
