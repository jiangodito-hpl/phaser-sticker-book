import { DESIGN_W, DESIGN_H } from '../constants';
let _s = 1;
let _offX = 0;
let _offY = 0;
let _vw = DESIGN_W;
let _vh = DESIGN_H;
let _inset = { top: 0, right: 0, bottom: 0, left: 0 };
export function computeMetrics(vw: number, vh: number): void {
    _vw = vw;
    _vh = vh;
    _s = Math.min(vw / DESIGN_W, vh / DESIGN_H);
    _offX = (vw - DESIGN_W * _s) / 2;
    _offY = (vh - DESIGN_H * _s) / 2;
}
export function setSafeInsets(top: number, right: number, bottom: number, left: number): void {
    _inset = { top, right, bottom, left };
}
export const sx = (x: number): number => _offX + x * _s;
export const sy = (y: number): number => _offY + y * _s;
export const sd = (d: number): number => d * _s;
export const scale = (): number => _s;
export const viewW = (): number => _vw;
export const viewH = (): number => _vh;
export const insets = () => _inset;
export const isLandscape = (): boolean => _vw > _vh;
