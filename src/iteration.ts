export type IterationMode = "clicks" | "time" | "complete";
export interface IterationConfig {
    length: string;
    mode: IterationMode;
    limit: number | null;
}
const RAW = (import.meta.env.VITE_ITERATION as string | undefined) || "full";
const MAP: Record<string, IterationConfig> = {
    "10clk": { length: "10clk", mode: "clicks", limit: 10 },
    "60sec": { length: "60sec", mode: "time", limit: 60 },
    full: { length: "full", mode: "complete", limit: null },
};
export const ITERATION: IterationConfig = MAP[RAW] ?? MAP.full;
