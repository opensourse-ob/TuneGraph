// Carries a safe HTTP status without storing upstream bodies or credentials.
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}
