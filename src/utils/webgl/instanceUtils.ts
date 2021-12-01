// InstancedMesh helpers
//
import {
  BufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  Matrix4,
  Vector3,
  Vector4,
} from "three"

// Geometry type has no attributes for some reason
type InstancedGeometryWithAttributes = InstancedBufferGeometry & {
  attributes: { [name: string]: BufferAttribute }
}

export type TransformationData = {
  matrix: Matrix4
  instancePosition: Vector3
  instanceScale: Vector3
}

// UV Offsets
//
export const getUvOffsets = (ranges: Object) => {
  const entries = Object.entries(ranges)
  const uvOffsetVectors: { offset: Vector4; key: string }[] = []

  for (let index = 0; index < entries.length; index++) {
    const uvOffsetRangesObject = entries[index][1]
    const key = entries[index][0]
    const uvOffsetRange = Object.values(uvOffsetRangesObject) as [number]
    uvOffsetVectors.push({ offset: new Vector4().fromArray(uvOffsetRange), key })
  }

  return uvOffsetVectors
}

export const setInstanceVector4 = (mesh: InstancedMesh, index: number, vector: Vector4) => {
  if (!mesh) return
  const instancedGeometry = mesh.geometry as InstancedGeometryWithAttributes
  const attributes = instancedGeometry.attributes
  attributes.aUvOffset.setXYZW(index, vector.x, vector.y, vector.z, vector.w)
  attributes.aUvOffset.needsUpdate = true
}

export const getInstanceData = (
  mesh: InstancedMesh,
  index: number,
  transformation: TransformationData,
) => {
  if (!mesh) return
  mesh.getMatrixAt(index, transformation.matrix)
}

// Scale && position
//
export const setInstanceScale = (
  mesh: InstancedMesh,
  index: number,
  transformation: TransformationData,
  scale: Vector3,
) => {
  if (!mesh) return
  const arrayed = transformation.matrix.toArray()
  arrayed[0] = scale.x
  arrayed[5] = scale.y
  arrayed[10] = scale.z
  transformation.matrix.fromArray(arrayed)
  mesh.setMatrixAt(index, transformation.matrix)
}

export const addInstancePosition = (
  mesh: InstancedMesh,
  index: number,
  transformation: TransformationData,
  position: Vector3,
) => {
  if (!mesh) return
  transformation.instancePosition.add(position)
  transformation.matrix.setPosition(transformation.instancePosition)
  mesh.setMatrixAt(index, transformation.matrix)
}

export const setInstancePosition = (
  mesh: InstancedMesh,
  index: number,
  transformation: TransformationData,
  position: Vector3,
) => {
  if (!mesh) return
  transformation.matrix.identity()
  transformation.matrix.setPosition(position)
  mesh.setMatrixAt(index, transformation.matrix)
}

export const setInstanceFloat = (
  mesh: InstancedMesh,
  index: number,
  name: string,
  float: number,
) => {
  if (!mesh) return
  const instancedGeometry = mesh.geometry as InstancedGeometryWithAttributes
  const attributes = instancedGeometry.attributes
  attributes[name].setX(index, float)
  attributes[name].needsUpdate = true
}
