import Phaser from 'phaser';
import { IMAGES, AUDIO, COLORED, OUTLINE, DRAGGABLE, texKey } from '../assets';
import { STICKER_CATALOG } from '../game/layout';
export class AssetBootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }
    preload(): void {
        this.setupLoadingScreen();
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
    private setupLoadingScreen(): void {
        if (typeof document === 'undefined')
            return;
        const logo = document.getElementById('loading-logo') as HTMLImageElement | null;
        const cta = document.getElementById('loading-cta') as HTMLImageElement | null;
        const bar = document.getElementById('loading-progress-bar') as HTMLDivElement | null;
        const text = document.getElementById('loading-progress-text') as HTMLDivElement | null;
        if (logo && !logo.src)
            logo.src = IMAGES.logo;
        if (cta && !cta.src)
            cta.src = IMAGES.ctaButton;
        const setProgress = (value: number): void => {
            const pct = Math.round(Phaser.Math.Clamp(value, 0, 1) * 100);
            if (bar)
                bar.style.width = `${pct}%`;
            if (text)
                text.textContent = `${pct}%`;
        };
        setProgress(0);
        this.load.on(Phaser.Loader.Events.PROGRESS, setProgress);
        this.load.once(Phaser.Loader.Events.COMPLETE, () => setProgress(100));
    }
    create(): void {
        document.getElementById('loading-screen')?.remove();
        this.scene.start('Game');
    }
}
