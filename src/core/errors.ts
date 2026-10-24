// Thrown when a platform has a stored remote id but no API to edit that post.
// The publish loop catches it and skips, so a republish cannot create a duplicate.
export class UpdateUnsupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UpdateUnsupportedError'
  }
}
