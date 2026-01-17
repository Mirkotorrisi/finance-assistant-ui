import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
  moveThreshold?: number;
}

interface Position {
  x: number;
  y: number;
}

export function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
  moveThreshold = 10,
}: UseLongPressOptions) {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startPosRef = useRef<Position>({ x: 0, y: 0 });
  const isLongPressRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (clientX: number, clientY: number) => {
      isLongPressRef.current = false;
      startPosRef.current = { x: clientX, y: clientY };
      setIsPressed(true);

      clearTimer();
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setIsPressed(false);
        onLongPress();
      }, delay);
    },
    [delay, onLongPress, clearTimer]
  );

  const cancel = useCallback(
    (clientX?: number, clientY?: number) => {
      clearTimer();
      setIsPressed(false);

      // If position is provided, check if we moved too much
      if (clientX !== undefined && clientY !== undefined) {
        const dx = Math.abs(clientX - startPosRef.current.x);
        const dy = Math.abs(clientY - startPosRef.current.y);
        
        // If moved beyond threshold, don't trigger click
        if (dx > moveThreshold || dy > moveThreshold) {
          return;
        }
      }

      // Only trigger click if it wasn't a long press
      if (!isLongPressRef.current && onClick) {
        onClick();
      }
    },
    [clearTimer, onClick, moveThreshold]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Prevent text selection during long press
      e.preventDefault();
      start(e.clientX, e.clientY);
    },
    [start]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      cancel(e.clientX, e.clientY);
    },
    [cancel]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Cancel if moved too far
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      
      if (dx > moveThreshold || dy > moveThreshold) {
        clearTimer();
        setIsPressed(false);
      }
    },
    [clearTimer, moveThreshold]
  );

  const onMouseLeave = useCallback(() => {
    clearTimer();
    setIsPressed(false);
  }, [clearTimer]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        start(touch.clientX, touch.clientY);
      }
    },
    [start]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        cancel(touch.clientX, touch.clientY);
      }
    },
    [cancel]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - startPosRef.current.x);
        const dy = Math.abs(touch.clientY - startPosRef.current.y);
        
        if (dx > moveThreshold || dy > moveThreshold) {
          clearTimer();
          setIsPressed(false);
        }
      }
    },
    [clearTimer, moveThreshold]
  );

  return {
    isPressed,
    handlers: {
      onMouseDown,
      onMouseUp,
      onMouseMove,
      onMouseLeave,
      onTouchStart,
      onTouchEnd,
      onTouchMove,
    },
  };
}
