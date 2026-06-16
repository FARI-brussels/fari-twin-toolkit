import type { ShallowRef } from 'vue'
import type {
  CameraControlOptions,
  CameraState,
  FlyOptions,
  RendererAdapter,
} from '@fari-brussels/viewer-core'

export interface UseCameraControlsReturn {
  /** Zoom in by a fraction of the current height (default 30%). */
  zoomIn: (factor?: number) => void
  /** Zoom out by a fraction of the current height (default 30%). */
  zoomOut: (factor?: number) => void
  /** Turn counter-clockwise by `degrees` (default 45). */
  rotateLeft: (degrees?: number) => void
  /** Turn clockwise by `degrees` (default 45). */
  rotateRight: (degrees?: number) => void
  /** Fly back to the camera the viewer was mounted with. */
  resetView: (opts?: FlyOptions) => void
  /** Enable/disable the user-driven camera interactions. */
  configureControls: (opts: CameraControlOptions) => void
  /** Read the current camera position, or null if the viewer isn't ready. */
  getCameraState: () => CameraState | null
}

/**
 * Ergonomic camera handlers for a mounted adapter — wire these straight to a
 * controls widget (`@zoom-in="zoomIn"`, `@reset="resetView"`, …). Every call is
 * null-safe, so it's fine to bind before the viewer has finished mounting.
 */
export function useCameraControls(
  viewer: ShallowRef<RendererAdapter | null>,
): UseCameraControlsReturn {
  return {
    zoomIn: (factor = 0.3) => viewer.value?.zoomBy(factor),
    zoomOut: (factor = 0.3) => viewer.value?.zoomBy(-factor),
    rotateLeft: (degrees = 45) => viewer.value?.rotateBy(-degrees),
    rotateRight: (degrees = 45) => viewer.value?.rotateBy(degrees),
    resetView: (opts?: FlyOptions) => void viewer.value?.resetCamera(opts),
    configureControls: (opts: CameraControlOptions) => viewer.value?.configureControls(opts),
    getCameraState: () => viewer.value?.getCameraState() ?? null,
  }
}
