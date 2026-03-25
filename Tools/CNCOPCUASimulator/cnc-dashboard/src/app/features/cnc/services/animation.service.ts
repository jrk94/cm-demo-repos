import { Injectable, signal, computed } from '@angular/core';
import anime from 'animejs';

export interface AnimatedPosition {
  x: number;
  y: number;
  z: number;
}

export interface AnimationState {
  currentPosition: AnimatedPosition;
  targetPosition: AnimatedPosition;
  spindleRotation: number;
  isAnimating: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  // Animation state as signals
  private readonly _currentPosition = signal<AnimatedPosition>({ x: 0, y: 0, z: 0 });
  private readonly _spindleRotation = signal<number>(0);
  private readonly _isAnimating = signal<boolean>(false);

  // Public readonly signals
  readonly currentPosition = this._currentPosition.asReadonly();
  readonly spindleRotation = this._spindleRotation.asReadonly();
  readonly isAnimating = this._isAnimating.asReadonly();

  // Active animations
  private positionAnimation: anime.AnimeInstance | null = null;
  private spindleAnimation: anime.AnimeInstance | null = null;

  // Machine dimensions (for position mapping)
  private readonly machineConfig = {
    xRange: { min: 0, max: 300 }, // mm
    yRange: { min: 0, max: 200 }, // mm
    zRange: { min: -80, max: 0 }, // mm (negative is down into workpiece)
    svgXRange: { min: 50, max: 350 }, // SVG coordinates
    svgYRange: { min: 50, max: 200 }, // SVG coordinates
    svgZRange: { min: 0, max: 80 }, // SVG vertical offset
  };

  /**
   * Animate axis movement to new position
   */
  animateToPosition(targetX: number, targetY: number, targetZ: number, duration = 300): void {
    // Stop any existing animation
    if (this.positionAnimation) {
      this.positionAnimation.pause();
    }

    const current = this._currentPosition();
    const animationTarget = { x: current.x, y: current.y, z: current.z };

    this._isAnimating.set(true);

    this.positionAnimation = anime({
      targets: animationTarget,
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: duration,
      easing: 'easeOutQuad',
      update: () => {
        this._currentPosition.set({
          x: animationTarget.x,
          y: animationTarget.y,
          z: animationTarget.z,
        });
      },
      complete: () => {
        this._isAnimating.set(false);
      },
    });
  }

  /**
   * Start spindle rotation animation
   */
  startSpindleRotation(rpm: number): void {
    // Stop any existing spindle animation
    if (this.spindleAnimation) {
      this.spindleAnimation.pause();
    }

    if (rpm <= 0) {
      return;
    }

    // Calculate rotation duration based on RPM
    // 60000ms / rpm = ms per revolution
    const msPerRevolution = 60000 / rpm;
    // Clamp to reasonable animation speed (min 50ms per revolution for visual effect)
    const duration = Math.max(50, Math.min(2000, msPerRevolution));

    const rotationTarget = { rotation: this._spindleRotation() };

    this.spindleAnimation = anime({
      targets: rotationTarget,
      rotation: '+=360',
      duration: duration,
      easing: 'linear',
      loop: true,
      update: () => {
        this._spindleRotation.set(rotationTarget.rotation % 360);
      },
    });
  }

  /**
   * Stop spindle rotation animation
   */
  stopSpindleRotation(): void {
    if (this.spindleAnimation) {
      this.spindleAnimation.pause();
      this.spindleAnimation = null;
    }
  }

  /**
   * Update spindle speed (adjusts rotation speed)
   */
  updateSpindleSpeed(rpm: number): void {
    if (rpm <= 0) {
      this.stopSpindleRotation();
    } else if (!this.spindleAnimation || this.spindleAnimation.paused) {
      this.startSpindleRotation(rpm);
    }
    // Note: anime.js doesn't easily support dynamic duration changes,
    // so we restart the animation when speed changes significantly
  }

  /**
   * Map machine coordinates to SVG coordinates
   */
  mapToSvgCoordinates(machinePos: AnimatedPosition): { x: number; y: number; z: number } {
    const config = this.machineConfig;

    // Map X position
    const xPercent =
      (machinePos.x - config.xRange.min) / (config.xRange.max - config.xRange.min);
    const svgX =
      config.svgXRange.min + xPercent * (config.svgXRange.max - config.svgXRange.min);

    // Map Y position (front/back becomes visual depth)
    const yPercent =
      (machinePos.y - config.yRange.min) / (config.yRange.max - config.yRange.min);
    const svgY =
      config.svgYRange.min + yPercent * (config.svgYRange.max - config.svgYRange.min);

    // Map Z position (vertical movement of spindle head)
    const zPercent =
      (machinePos.z - config.zRange.min) / (config.zRange.max - config.zRange.min);
    const svgZ =
      config.svgZRange.max - zPercent * (config.svgZRange.max - config.svgZRange.min);

    return { x: svgX, y: svgY, z: svgZ };
  }

  // Computed signal for SVG coordinates
  readonly svgPosition = computed(() => {
    return this.mapToSvgCoordinates(this._currentPosition());
  });

  /**
   * Reset all animations to initial state
   */
  reset(): void {
    this.stopSpindleRotation();
    if (this.positionAnimation) {
      this.positionAnimation.pause();
      this.positionAnimation = null;
    }

    this._currentPosition.set({ x: 0, y: 0, z: 0 });
    this._spindleRotation.set(0);
    this._isAnimating.set(false);
  }

  /**
   * Animate a quick move (rapid positioning)
   */
  rapidMove(targetX: number, targetY: number, targetZ: number): void {
    this.animateToPosition(targetX, targetY, targetZ, 150);
  }

  /**
   * Animate a cutting move (slower, more controlled)
   */
  cuttingMove(targetX: number, targetY: number, targetZ: number, feedrate: number): void {
    // Calculate duration based on feedrate and distance
    const current = this._currentPosition();
    const distance = Math.sqrt(
      Math.pow(targetX - current.x, 2) +
        Math.pow(targetY - current.y, 2) +
        Math.pow(targetZ - current.z, 2)
    );

    // feedrate is in mm/min, convert to duration in ms
    const duration = feedrate > 0 ? (distance / feedrate) * 60000 : 500;
    // Clamp duration for smooth animation
    const clampedDuration = Math.max(100, Math.min(2000, duration));

    this.animateToPosition(targetX, targetY, targetZ, clampedDuration);
  }
}
