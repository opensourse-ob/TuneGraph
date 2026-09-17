import { randomBytes } from 'node:crypto'

// Length is the number of random bytes (hex encoding doubles the string length).
export function generateRandomString(length: number): string {
  return randomBytes(length).toString('hex')
}
