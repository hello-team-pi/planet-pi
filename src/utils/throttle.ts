/**
 * @param {Function} func
 * @param {Number} limit
 */
export function throttle(func: Function, limit: number) {
  let inThrottle: any
  return function () {
    const args = arguments
    /* @ts-ignore */
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
