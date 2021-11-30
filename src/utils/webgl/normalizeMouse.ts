const normalizeMouse = (
  { x, y }: { x: number; y: number },
  size: { width: number; height: number },
) => ({
  x: (x - size.width / 2) / (size.width / 2), //-1, 1,
  y: -((y - size.height / 2) / (size.height / 2)), //-1, 1
})
export default normalizeMouse
