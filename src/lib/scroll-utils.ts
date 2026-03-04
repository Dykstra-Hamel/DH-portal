type ScheduledScrollOptions = {
  topOffset?: number;
  behavior?: ScrollBehavior;
  retryDelaysMs?: number[];
};

const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);

const isScrollable = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  return (
    SCROLLABLE_OVERFLOW_VALUES.has(overflowY) &&
    element.scrollHeight > element.clientHeight + 1
  );
};

const getScrollableAncestor = (element: HTMLElement): HTMLElement | Window => {
  let current = element.parentElement;

  while (current) {
    if (isScrollable(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return window;
};

const scrollElementIntoContainer = (
  element: HTMLElement,
  topOffset: number,
  behavior: ScrollBehavior
) => {
  const scrollTarget = getScrollableAncestor(element);

  if (scrollTarget === window) {
    const rect = element.getBoundingClientRect();
    const targetTop = window.scrollY + rect.top - topOffset;
    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior,
    });
    return;
  }

  const container = scrollTarget as HTMLElement;
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const targetTop =
    container.scrollTop + (elementRect.top - containerRect.top) - topOffset;

  container.scrollTo({
    top: Math.max(targetTop, 0),
    behavior,
  });
};

export const scheduleScrollToElementById = (
  elementId: string,
  {
    topOffset = 96,
    behavior = 'smooth',
    retryDelaysMs = [0, 140, 320, 520],
  }: ScheduledScrollOptions = {}
) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let cancelled = false;
  const timers: number[] = [];

  retryDelaysMs.forEach((delay, attemptIndex) => {
    const timer = window.setTimeout(() => {
      if (cancelled) return;

      const element = document.getElementById(elementId);
      if (!element) return;

      window.requestAnimationFrame(() => {
        if (cancelled) return;
        scrollElementIntoContainer(
          element,
          topOffset,
          attemptIndex === 0 ? 'auto' : behavior
        );
      });
    }, delay);

    timers.push(timer);
  });

  return () => {
    cancelled = true;
    timers.forEach((timer) => window.clearTimeout(timer));
  };
};
