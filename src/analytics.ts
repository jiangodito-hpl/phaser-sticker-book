export type AnalyticsEvent = 'DISPLAYED' | 'CTA_CLICKED' | 'ENDCARD_SHOWN' | 'CHALLENGE_STARTED' | 'CHALLENGE_SOLVED';
export function trackEvent(event: AnalyticsEvent): void {
    const w = window as unknown as Record<string, any>;
    try {
        if (typeof w.ALPlayableAnalytics?.trackEvent === 'function') {
            w.ALPlayableAnalytics.trackEvent(event);
            return;
        }
    }
    catch {
    }
    try {
        if (typeof w.playableSDK?.reportEvent === 'function') {
            w.playableSDK.reportEvent(event);
            return;
        }
    }
    catch {
    }
    console.log('[Analytics]', event);
}
