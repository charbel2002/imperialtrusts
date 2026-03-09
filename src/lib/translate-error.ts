/**
 * Translate server action error messages on the client side.
 * The dict.errors section contains translated versions of common error strings.
 * Falls back to the original English error if no translation found.
 */
const errorMap: Record<string, string> = {
  "Unauthorized": "unauthorized",
  "Unauthorized or session expired. Please sign in again.": "sessionExpired",
  "Session expired. Please sign in again.": "sessionExpired",
  "Transaction not found": "transactionNotFound",
  "Beneficiary not found": "beneficiaryNotFound",
  "Already resolved": "alreadyResolved",
  "Invalid security code": "invalidSecurityCode",
  "Insufficient balance": "insufficientBalance",
  "Account is not active": "accountInactive",
  "Not found": "notFound",
};

export function translateError(error: string, errorsDict?: Record<string, string>): string {
  if (!errorsDict) return error;
  const key = errorMap[error];
  if (key && errorsDict[key]) return errorsDict[key];
  // Also try direct key match (for validation.xxx codes from Zod)
  if (error.startsWith("validation.") && errorsDict[error.replace("validation.", "")]) {
    // handled by translateValidation
  }
  return error;
}

/**
 * Translate Zod validation error codes (format: "validation.keyName")
 */
export function translateValidation(error: string, validationDict?: Record<string, string>): string {
  if (!validationDict) return error;
  if (error.startsWith("validation.")) {
    const key = error.replace("validation.", "");
    return validationDict[key] || error;
  }
  return error;
}
