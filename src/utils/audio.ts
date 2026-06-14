// Synthesizer utility for Satisfaction Coin Chimes and Tactics Audio
// Honors the global sound effects settings in localStorage

export function getSoundEffectsEnabled(): boolean {
  return localStorage.getItem('taskx_v1_sound_effects') !== 'false';
}

export function setSoundEffectsEnabled(enabled: boolean) {
  localStorage.setItem('taskx_v1_sound_effects', enabled ? 'true' : 'false');
  // Dispatch active storage event to notify other mounted game windows in real-time
  window.dispatchEvent(new Event('storage'));
}

export function playCoinClaimSound() {
  if (!getSoundEffectsEnabled()) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playNote = (pitch: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, startTime);

      gain.gain.setValueAtTime(0.06, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Satisfying high-pitch double coin ping (B5 then E6)
    playNote(987.77, now, 0.1); 
    playNote(1318.51, now + 0.08, 0.25); 
  } catch (err) {
    console.warn('Audio synthesis failed (Web Audio API blocked or not supported)', err);
  }
}

export function playInteractSound() {
  if (!getSoundEffectsEnabled()) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    console.warn(err);
  }
}

export function playSuccessChime() {
  if (!getSoundEffectsEnabled()) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (pitch: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, start);
      gain.gain.setValueAtTime(0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.12); // C5
    playTone(659.25, now + 0.08, 0.12); // E5
    playTone(783.99, now + 0.16, 0.12); // G5
    playTone(1046.50, now + 0.24, 0.25); // C6
  } catch (err) {
    console.warn(err);
  }
}
