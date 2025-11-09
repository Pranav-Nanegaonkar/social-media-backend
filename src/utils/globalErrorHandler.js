function getErrorLocation(stack) {
  if (!stack) return null;

  // Split the stack by lines
  const lines = stack.split("\n");

  // Find the first line that looks like a file path (starts with "at ")
  const relevantLine = lines.find((line) => line.includes(".js:"));

  if (!relevantLine) return null;

  // Extract path between parentheses or after "at "
  const match =
    relevantLine.match(/\((.*):(\d+):(\d+)\)/) ||
    relevantLine.match(/at (.*):(\d+):(\d+)/);

  if (!match) return null;

  return {
    file: match[1],
    line: match[2],
    column: match[3],
  };
}

const globalErrorHandler = (error, req, res, next) => {
  const statusCode = error?.statusCode || 500;
  const status = error?.status ? error.status : "Failure";
  const message = error?.message;
  const stack = getErrorLocation(error?.stack);
  return res.status(statusCode).json({ status, message, stack });
};

export default globalErrorHandler;
