/** Error with an HTTP status code; picked up by the central error handler. */
export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly code?: string) {
    super(message);
    this.name = "HttpError";
  }
}
