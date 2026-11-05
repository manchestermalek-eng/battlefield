/**
 * Procedural Battlefield Sound Synthesizer
 * Generates continuous low rumble, wind, and periodic distant artillery explosions
 * using the Web Audio API without any external audio file dependencies.
 */

export interface BattlefieldAudioController {
  start: () => void;
  stop: () => void;
  toggle: () => boolean;
  isPlaying: () => boolean;
}

export function createBattlefieldAudio(): BattlefieldAudioController | null {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let explosionTimer: ReturnType<typeof setTimeout> | null = null;
  let active = false;

  function initContext() {
    if (ctx) return;
    ctx = new AudioContextClass();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(ctx.destination);

    // 1. Procedural Wind / Atmosphere Noise
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.2;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 380;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.32;

    noiseSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    noiseSource.start();

    // 2. Sub-bass Ground Rumble (41Hz)
    const rumbleOsc = ctx.createOscillator();
    rumbleOsc.type = 'sine';
    rumbleOsc.frequency.value = 41;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.07;

    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(masterGain);
    rumbleOsc.start();
  }

  function triggerExplosion() {
    if (!ctx || !masterGain || !active) return;
    const now = ctx.currentTime;

    // Deep boom pitch dive 88Hz -> 30Hz
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(88, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.1);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.85, now + 0.06);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);

    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 1.8);

    // Burst noise with swept lowpass filter
    const burstBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const bData = burstBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bData.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.03 * white) / 1.03;
      bData[i] = last * 2.8;
    }

    const burstSource = ctx.createBufferSource();
    burstSource.buffer = burstBuffer;

    const burstFilter = ctx.createBiquadFilter();
    burstFilter.type = 'lowpass';
    burstFilter.frequency.setValueAtTime(900, now);
    burstFilter.frequency.exponentialRampToValueAtTime(140, now + 1.2);

    const burstGain = ctx.createGain();
    burstGain.gain.setValueAtTime(0.0001, now);
    burstGain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
    burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    burstSource.connect(burstFilter);
    burstFilter.connect(burstGain);
    burstGain.connect(masterGain);

    burstSource.start(now);
    burstSource.stop(now + 1.6);
  }

  function scheduleNextExplosion() {
    if (!active) return;
    explosionTimer = setTimeout(() => {
      triggerExplosion();
      scheduleNextExplosion();
    }, 4000 + Math.random() * 6500);
  }

  return {
    start() {
      initContext();
      if (!ctx || !masterGain) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      active = true;
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.exponentialRampToValueAtTime(0.7, now + 1.2);
      scheduleNextExplosion();
    },
    stop() {
      if (!ctx || !masterGain) return;
      active = false;
      if (explosionTimer) {
        clearTimeout(explosionTimer);
        explosionTimer = null;
      }
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    },
    toggle() {
      if (active) {
        this.stop();
        return false;
      } else {
        this.start();
        return true;
      }
    },
    isPlaying() {
      return active;
    },
  };
}
