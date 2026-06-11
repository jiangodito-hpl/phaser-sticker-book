import type Phaser from 'phaser';
import { STORE_URL } from './constants';
type Win = Record<string, any>;
const W = window as unknown as Win;
function storeUrl(): string {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
    return isIOS ? STORE_URL.ios : STORE_URL.android;
}
function callStub(name: string): void {
    try {
        if (typeof W[name] === 'function')
            W[name]();
    }
    catch {
    }
}
export const notifyGameStart = (): void => callStub('gameStart');
export const notifyGameEnd = (): void => callStub('gameEnd');
export const notifyGameClose = (): void => callStub('gameClose');
export function triggerCTA(): void {
    const url = storeUrl();
    try {
        if (typeof W.ExitApi?.exit === 'function')
            return void W.ExitApi.exit();
    }
    catch { }
    try {
        if (typeof W.FbPlayableAd?.onCTAClick === 'function')
            return void W.FbPlayableAd.onCTAClick();
    }
    catch { }
    try {
        const p = W.Luna?.Unity?.Playable;
        if (p) {
            if (typeof p.openStoreUrl === 'function')
                return void p.openStoreUrl(url);
            if (typeof p.install === 'function')
                return void p.install();
            if (typeof p.InstallFullGame === 'function')
                return void p.InstallFullGame();
        }
    }
    catch { }
    try {
        if (typeof W.playableSDK?.openAppStore === 'function')
            return void W.playableSDK.openAppStore();
    }
    catch { }
    try {
        if (typeof W.install === 'function')
            return void W.install();
    }
    catch { }
    try {
        if (typeof W.openAppStore === 'function')
            return void W.openAppStore();
    }
    catch { }
    try {
        if (typeof W.clickTag === 'string' && W.clickTag)
            return void window.open(W.clickTag, '_blank');
    }
    catch { }
    try {
        if (W.__VUNGLE__ && window.parent)
            return void window.parent.postMessage('download', '*');
    }
    catch { }
    try {
        if (W.__TIKTOK__) {
            if (typeof W.openAppStore === 'function')
                return void W.openAppStore();
            return void window.open(url, '_blank');
        }
    }
    catch { }
    try {
        if (typeof W.mraid?.open === 'function') {
            const state = typeof W.mraid.getState === 'function' ? W.mraid.getState() : 'ready';
            if (state !== 'loading')
                return void W.mraid.open(url);
        }
    }
    catch { }
    try {
        window.open(url, '_blank');
    }
    catch { }
}
let _mraidViewable = true;
let _mraidExposed = true;
let _mraidVolume = 1;
let _scene: Phaser.Scene | null = null;
function emitVisibility(): void {
    if (!_scene)
        return;
    const visible = _mraidViewable && _mraidExposed;
    _scene.game.events.emit(visible ? 'ad-resume' : 'ad-pause');
}
function setVolume(vol: number): void {
    _mraidVolume = vol;
    _scene?.game.events.emit('ad-volume', vol);
}
function registerMraid(): void {
    const mraid = W.mraid;
    if (!mraid || typeof mraid.addEventListener !== 'function')
        return;
    try {
        if (typeof mraid.isViewable === 'function')
            _mraidViewable = !!mraid.isViewable();
    }
    catch { }
    try {
        mraid.addEventListener('error', (message: string, action: string) => console.warn('[MRAID error]', { message, action }));
        mraid.addEventListener('stateChange', (state: string) => console.log('[MRAID stateChange]', state));
        mraid.addEventListener('exposureChange', (exposed: number) => {
            _mraidExposed = typeof exposed === 'number' ? exposed > 0 : true;
            emitVisibility();
        });
        mraid.addEventListener('viewableChange', (v: boolean) => {
            _mraidViewable = !!v;
            emitVisibility();
        });
        mraid.addEventListener('audioVolumeChange', (pct: number | null) => {
            if (typeof pct === 'number')
                setVolume(pct / 100);
        });
    }
    catch { }
}
export function initMraid(timeoutMs = 2000, detectTimeoutMs = 500): Promise<void> {
    return new Promise((resolve) => {
        let done = false;
        const finish = (): void => {
            if (done)
                return;
            done = true;
            resolve();
        };
        const onReady = (): void => {
            registerMraid();
            finish();
        };
        const waitForReady = (): void => {
            const mraid = W.mraid;
            if (!mraid)
                return finish();
            try {
                const state = typeof mraid.getState === 'function' ? mraid.getState() : 'ready';
                if (state === 'loading' && typeof mraid.addEventListener === 'function') {
                    mraid.addEventListener('ready', onReady);
                    window.setTimeout(onReady, timeoutMs);
                }
                else {
                    onReady();
                }
            }
            catch {
                finish();
            }
        };
        if (W.mraid) {
            waitForReady();
            return;
        }
        const startedAt = performance.now();
        const iv = window.setInterval(() => {
            if (W.mraid) {
                window.clearInterval(iv);
                waitForReady();
            }
            else if (performance.now() - startedAt >= detectTimeoutMs) {
                window.clearInterval(iv);
                finish();
            }
        }, 50);
        window.setTimeout(finish, timeoutMs + detectTimeoutMs + 250);
    });
}
export function bindLifecycle(scene: Phaser.Scene): void {
    _scene = scene;
    const ev = scene.game.events;
    const pause = (): void => void ev.emit('ad-pause');
    const resume = (): void => void ev.emit('ad-resume');
    const mute = (m: boolean): void => void ev.emit('ad-mute', m);
    emitVisibility();
    if (_mraidVolume !== 1)
        setVolume(_mraidVolume);
    window.addEventListener('luna:pause', pause);
    window.addEventListener('luna:resume', resume);
    window.addEventListener('luna:mute', () => mute(true));
    window.addEventListener('luna:unmute', () => mute(false));
    window.addEventListener('ad-event-pause', pause);
    window.addEventListener('ad-event-resume', resume);
    window.addEventListener('message', (e: MessageEvent) => {
        const d: any = e.data;
        const t = typeof d === 'string' ? d : d?.type;
        if (t === 'onPause')
            pause();
        else if (t === 'onResume')
            resume();
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
}
