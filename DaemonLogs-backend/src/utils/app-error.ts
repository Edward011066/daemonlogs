export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly meta?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}
