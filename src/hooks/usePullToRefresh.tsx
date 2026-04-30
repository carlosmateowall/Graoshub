import { useState, useRef, useCallback } from "react";

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const threshold = 80;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, [pulling, refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold);
      await onRefresh();
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh]);

  const pullIndicator = pullDistance > 0 ? (
    <div
      className="flex items-center justify-center transition-all overflow-hidden"
      style={{ height: pullDistance }}
    >
      <div className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${refreshing ? "animate-spin" : ""}`}
        style={{ opacity: Math.min(pullDistance / threshold, 1), transform: `rotate(${pullDistance * 3}deg)` }}
      />
    </div>
  ) : null;

  return { scrollRef, onTouchStart, onTouchMove, onTouchEnd, pullIndicator, refreshing };
};
