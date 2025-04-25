import { NextResponse } from "next/server";

// Error type enum
export enum ErrorType {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  RATE_LIMIT = "rate_limit",
  SERVER_ERROR = "server_error",
}

// Error map for public error messages
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.AUTHENTICATION]: "Authentication failed. Please try again.",
  [ErrorType.AUTHORIZATION]:
    "You do not have permission to perform this action.",
  [ErrorType.VALIDATION]: "Invalid input provided. Please check your request.",
  [ErrorType.NOT_FOUND]: "The requested resource was not found.",
  [ErrorType.RATE_LIMIT]: "Too many requests. Please try again later.",
  [ErrorType.SERVER_ERROR]:
    "An unexpected error occurred. Please try again later.",
};

// Error status codes
const ERROR_STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.VALIDATION]: 400,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.SERVER_ERROR]: 500,
};

/**
 * Create a sanitized API error response
 * @param error The error object
 * @param type The type of error
 * @param requestId Optional request ID for tracking
 * @returns NextResponse with sanitized error
 */
export function createErrorResponse(
  error: unknown,
  type: ErrorType = ErrorType.SERVER_ERROR,
  requestId?: string
): NextResponse {
  // Log the full error details for debugging (server-side only)
  console.error(`API Error [${type}]:`, error);

  // For development environment, add more detailed error information
  const isDev = process.env.NODE_ENV === "development";

  const errorMessage = ERROR_MESSAGES[type];
  const statusCode = ERROR_STATUS_CODES[type];

  const errorResponse: Record<string, any> = {
    success: false,
    error: errorMessage,
  };

  // Include request ID if provided (for tracking in logs)
  if (requestId) {
    errorResponse.requestId = requestId;
  }

  // In development, include more details about the error
  if (isDev) {
    if (error instanceof Error) {
      errorResponse.devInfo = {
        message: error.message,
        stack: error.stack,
      };
    } else if (typeof error === "string") {
      errorResponse.devInfo = { message: error };
    }
  }

  return NextResponse.json(errorResponse, { status: statusCode });
}

// Helper function for validation errors
export function createValidationError(
  message: string,
  fields?: Record<string, string | undefined>,
  requestId?: string
): NextResponse {
  console.error(`Validation Error: ${message}`, fields);

  const errorResponse: Record<string, any> = {
    success: false,
    error: ERROR_MESSAGES[ErrorType.VALIDATION],
    message,
  };

  // Include field-specific errors if provided (remove undefined values)
  if (fields) {
    // Filter out undefined values
    const validFields = Object.entries(fields)
      .filter(([_, value]) => value !== undefined)
      .reduce((obj, [key, value]) => {
        // TypeScript now knows that value cannot be undefined due to the filter
        obj[key] = value as string;
        return obj;
      }, {} as Record<string, string>);

    if (Object.keys(validFields).length > 0) {
      errorResponse.fields = validFields;
    }
  }

  // Include request ID if provided
  if (requestId) {
    errorResponse.requestId = requestId;
  }

  return NextResponse.json(errorResponse, {
    status: ERROR_STATUS_CODES[ErrorType.VALIDATION],
  });
}

// Utility function for generating a request ID
export function generateRequestId(): string {
  return `req_${Math.random().toString(36).substring(2, 15)}`;
}
