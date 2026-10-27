/**
 * Web Audio API synthesizer for the Pomodoro completion chime.
 * Generates an elegant harmonic dual-tone bell chime with gentle decay.
 */
export function playPomodoroChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, time: now, duration: 1.2 },        // C5
      { freq: 659.25, time: now + 0.12, duration: 1.2 }, // E5
      { freq: 783.99, time: now + 0.24, duration: 1.6 }, // G5
      { freq: 1046.5, time: now + 0.36, duration: 2.0 }, // C6
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Attack and gentle exponential decay
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.22, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });

    // Close context after playback
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 2800);
  } catch (err) {
    console.warn('[Pomodoro] Audio playback failed:', err);
  }
}
