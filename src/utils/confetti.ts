import confetti from 'canvas-confetti'

/**
 * Celebration confetti effect for level-ups
 * Uses purple/violet theme to match app colors
 */
export function celebrateLevelUp(): void {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
    colors: ['#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#8b5cf6', '#c084fc'], // purple/violet shades
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  // Multiple bursts with different spreads and speeds
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })

  fire(0.2, {
    spread: 60,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

/**
 * Simple confetti burst
 */
export function confettiBurst(): void {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    zIndex: 9999,
    colors: ['#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#8b5cf6', '#c084fc'],
  })
}

/**
 * Continuous confetti rain effect
 */
export function confettiRain(duration: number = 3000): void {
  const end = Date.now() + duration
  const colors = ['#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#8b5cf6', '#c084fc']

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0 },
      zIndex: 9999,
      colors,
    })

    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0 },
      zIndex: 9999,
      colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

/**
 * Stop all confetti animations
 */
export function stopConfetti(): void {
  confetti.reset()
}
