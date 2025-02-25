import { MaybeElementRef, unrefElement, tryOnUnmounted, Fn } from '@vueuse/core'
import { watch, ref, Ref } from 'vue-demi'
import { ActivateOptions, createFocusTrap, DeactivateOptions, FocusTrap, Options } from 'focus-trap'

export interface UseFocusTrapOptions extends Options {
  /**
   * Immediately activate the trap
   */
  immediate?: boolean
}

export interface UseFocusTrapReturn {
  /**
   * Indicates if the focus trap is currently active
   */
  hasFocus: Ref<boolean>

  /**
   * Indicates if the focus trap is currently paused
   */
  isPaused: Ref<boolean>

  /**
   * Activate the focus trap
   *
   * @link https://github.com/focus-trap/focus-trap#trapactivateactivateoptions
   * @param opts Activate focus trap options
   */
  activate: (opts?: ActivateOptions) => void

  /**
   * Deactivate the focus trap
   *
   * @link https://github.com/focus-trap/focus-trap#trapdeactivatedeactivateoptions
   * @param opts Deactivate focus trap options
   */
  deactivate: (opts?: DeactivateOptions) => void

  /**
   * Pause the focus trap
   *
   * @link https://github.com/focus-trap/focus-trap#trappause
   */
  pause: Fn

  /**
   * Unpauses the focus trap
   *
   * @link https://github.com/focus-trap/focus-trap#trapunpause
   */
  unpause: Fn
}

/**
 * Reactive focus-trap
 *
 * @link https://vueuse.org/useFocusTrap
 * @param target The target element to trap focus within
 * @param options Focus trap options
 * @param autoFocus Focus trap automatically when mounted
 */
export function useFocusTrap(target: MaybeElementRef, options: UseFocusTrapOptions = {}): UseFocusTrapReturn {
  let trap: undefined | FocusTrap

  const { immediate, ...focusTrapOptions } = options
  const hasFocus = ref(false)
  const isPaused = ref(false)

  const activate = (opts?: ActivateOptions) => trap && trap.activate(opts)
  const deactivate = (opts?: DeactivateOptions) => trap && trap.deactivate(opts)

  const pause = () => {
    if (trap) {
      trap.pause()
      isPaused.value = true
    }
  }

  const unpause = () => {
    if (trap) {
      trap.unpause()
      isPaused.value = false
    }
  }

  watch(
    () => unrefElement(target),
    (el: HTMLElement) => {
      trap = createFocusTrap(el, {
        ...focusTrapOptions,
        onActivate() {
          hasFocus.value = true

          // Apply if user provided onActivate option
          if (options.onActivate)
            options.onActivate()
        },
        onDeactivate() {
          hasFocus.value = false

          // Apply if user provided onDeactivate option
          if (options.onDeactivate)
            options.onDeactivate()
        },
      })

      // Focus if immediate is set to true
      if (immediate)
        activate()
    }, { flush: 'post' })

  // Cleanup on unmount
  tryOnUnmounted(() => deactivate())

  return {
    hasFocus,
    isPaused,
    activate,
    deactivate,
    pause,
    unpause,
  }
}
