export function fromPolarX(radius: number, angle: number) {
  return radius * Math.sin(angle)
}

export function fromPolarY(radius: number, angle: number) {
  return radius * Math.cos(angle)
}