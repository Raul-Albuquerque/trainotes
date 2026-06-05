import type { WeightUnit } from '../domain/types'

const KG_TO_LB = 2.20462
const LB_TO_KG = 1 / KG_TO_LB

export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB)
}

export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG)
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value
  return from === 'kg' ? kgToLb(value) : lbToKg(value)
}
