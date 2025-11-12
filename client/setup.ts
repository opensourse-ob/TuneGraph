import '@testing-library/jest-dom'
// setup.ts
import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)
