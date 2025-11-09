export default class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "failure" : "error";

    // Prevent this class from appearing in the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
