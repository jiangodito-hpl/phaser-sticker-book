import Phaser from 'phaser';
export class AudioDirector {
    private scene: Phaser.Scene;
    private bgm: Phaser.Sound.BaseSound;
    private correct: Phaser.Sound.BaseSound;
    private wrong: Phaser.Sound.BaseSound;
    private finished: Phaser.Sound.BaseSound;
    private unlocked = false;
    private adMuted = false;
    private hostVolume = 1;
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.bgm = scene.sound.add('bgm', { loop: true, volume: 0.35 });
        this.correct = scene.sound.add('sfxCorrect', { volume: 0.85 });
        this.wrong = scene.sound.add('sfxWrong', { volume: 0.7 });
        this.finished = scene.sound.add('sfxFinished', { volume: 0.9 });
        scene.sound.mute = true;
        document.addEventListener('visibilitychange', this.onVisibility);
    }
    unlock(): void {
        if (this.unlocked)
            return;
        this.unlocked = true;
        this.resumeContext();
        this.applyState();
        if (!this.bgm.isPlaying)
            this.bgm.play();
    }
    private applyState(): void {
        const muted = !this.unlocked || this.adMuted || this.hostVolume <= 0;
        this.scene.sound.mute = muted;
        this.scene.sound.volume = this.hostVolume;
    }
    playSnap(): void {
        if (this.unlocked)
            this.correct.play();
    }
    playMiss(): void {
        if (this.unlocked)
            this.wrong.play();
    }
    playComplete(): void {
        if (this.unlocked)
            this.finished.play();
    }
    setContainerMute(muted: boolean): void {
        this.adMuted = muted;
        this.applyState();
    }
    setContainerVolume(vol: number): void {
        this.hostVolume = Phaser.Math.Clamp(vol, 0, 1);
        this.applyState();
    }
    pause(): void {
        this.scene.sound.pauseAll();
        this.suspendContext();
    }
    resume(): void {
        if (!this.unlocked)
            return;
        this.resumeContext();
        this.scene.sound.resumeAll();
    }
    private onVisibility = (): void => {
        if (document.hidden)
            this.pause();
        else
            this.resume();
    };
    private ctx(): AudioContext | undefined {
        return (this.scene.sound as unknown as {
            context?: AudioContext;
        }).context;
    }
    private resumeContext(): void {
        const c = this.ctx();
        if (c && c.state === 'suspended')
            void c.resume();
    }
    private suspendContext(): void {
        const c = this.ctx();
        if (c && c.state === 'running')
            void c.suspend();
    }
}
