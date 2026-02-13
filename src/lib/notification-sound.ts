let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  // Create a fresh context if none exists or if the previous one is closed
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  return audioContext;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.25, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export async function playNotificationSound() {
  try {
    const ctx = getAudioContext();

    // Resume context if suspended — browsers suspend AudioContext in
    // background/minimized tabs. Awaiting ensures it's active before scheduling.
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    // Two-tone chime: pleasant ascending notes
    playTone(ctx, 830, now, 0.15);
    playTone(ctx, 1100, now + 0.15, 0.25);
  } catch {
    // Silently fail — audio is a nice-to-have, not critical
  }
}
