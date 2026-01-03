import { useState, useEffect, useRef } from "react";

/**
 * A hook that ensures a loading state persists for at least a minimum duration.
 * This prevents "flickering" where a loading screen shows and hides too quickly.
 * 
 * @param isLoading The actual loading state from your data source
 * @param minDuration The minimum time in milliseconds to keep the state true (default: 1000)
 * @returns A boolean that stays true until both isLoading is false AND minDuration has passed
 */
export function useMinimumLoadingTime(isLoading: boolean, minDuration: number = 1000): boolean {
    const [shouldShow, setShouldShow] = useState(isLoading);
    const startTime = useRef<number | null>(isLoading ? Date.now() : null);

    useEffect(() => {
        if (isLoading) {
            if (!shouldShow) {
                setShouldShow(true);
                startTime.current = Date.now();
            }
        } else if (shouldShow) {
            // If we were showing the loading screen and loading finished
            const now = Date.now();
            const start = startTime.current ?? now;
            const elapsed = now - start;
            const remaining = Math.max(0, minDuration - elapsed);

            if (remaining > 0) {
                const timer = setTimeout(() => {
                    setShouldShow(false);
                    startTime.current = null;
                }, remaining);
                return () => clearTimeout(timer);
            } else {
                setShouldShow(false);
                startTime.current = null;
            }
        }
    }, [isLoading, minDuration, shouldShow]);

    return shouldShow;
}
