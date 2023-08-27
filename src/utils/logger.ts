import { createLogger, format, transports } from "winston";

// Create a custom format for the log messages
const logFormat = format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Configure the logger
const logger = createLogger({
  level: "info", // Set the log level (e.g., 'info', 'warn', 'error')
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    // Define the transport for logging to a file
    new transports.File({ filename: "logs/app.log" }),
  ],
});

export default logger;
