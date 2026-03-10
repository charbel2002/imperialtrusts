/**
 * Unified error translation for server action responses.
 *
 * Errors arrive in one of three forms:
 *   1. Zod validation keys:  "validation.invalidEmail"  → look up in dict.validation
 *   2. Mapped hardcoded strings: "Card not found"        → errorMap → dict.errors
 *   3. Dynamic strings with params: "Insufficient balance. Available: $123.45"
 *
 * Call  translateActionError(error, dict)  in every component that displays
 * result.error from a server action.
 */

// Static action error strings → errors dict key
const errorMap: Record<string, string> = {
  // Auth / generic
  "Unauthorized": "unauthorized",
  "Unauthorized or session expired. Please sign in again.": "sessionExpired",
  "Session expired. Please sign in again.": "sessionExpired",
  "An account with this email already exists": "emailExists",
  "User not found": "userNotFound",
  // Transactions
  "Transaction not found": "transactionNotFound",
  "Only pending transactions can be cancelled": "onlyPendingCancel",
  "Lock not found": "lockNotFound",
  "Already resolved": "alreadyResolved",
  "Invalid security code": "invalidSecurityCode",
  "Transaction is not processing": "txnNotProcessing",
  "All security locks must be resolved first": "locksNotResolved",
  "Insufficient balance": "insufficientBalance",
  "Your account must be active to send transfers": "accountMustBeActive",
  "KYC verification required to send funds": "kycRequiredTransfers",
  // Beneficiaries
  "Beneficiary not found": "beneficiaryNotFound",
  "KYC verification required to manage beneficiaries": "kycRequiredBeneficiaries",
  "A beneficiary with this account number and bank already exists": "beneficiaryDuplicate",
  "Another beneficiary with this account number and bank already exists": "beneficiaryDuplicate",
  "Cannot delete beneficiary with pending transactions": "beneficiaryPendingTxns",
  // Cards
  "Card not found": "cardNotFound",
  "Card is not active": "cardNotActive",
  "Card is not frozen": "cardNotFrozen",
  "Card must be active to fund": "cardMustBeActive",
  "Card must be active": "cardMustBeActive",
  "Your bank account must be active": "bankAccountMustBeActive",
  "No bank account found": "noBankAccount",
  "KYC verification required to create cards": "kycRequiredCards",
  "Your account must be active to create cards": "accountMustBeActiveCards",
  // KYC
  "Both ID document and selfie are required": "kycDocsRequired",
  "Your KYC is already approved": "kycAlreadyApproved",
  "Your KYC submission is already under review": "kycAlreadyPending",
  "Not found": "notFound",
  "Account is not active": "accountInactive",
};

/**
 * Translate a server action error string using the full dictionary.
 *
 * @param error   - raw error string from action `{ error: "..." }`
 * @param dict    - the full locale dictionary (must have `validation` and `errors` sections)
 * @returns translated string, or the original error as fallback
 */
export function translateActionError(
  error: string,
  dict: Record<string, any>
): string {
  if (!error) return error;
  const v = dict?.validation || {};
  const e = dict?.errors || {};

  // 1. Zod validation key  →  "validation.someKey"
  if (error.startsWith("validation.")) {
    const key = error.replace("validation.", "");
    return v[key] || error;
  }

  // 2. Exact match in errorMap
  if (errorMap[error] && e[errorMap[error]]) {
    return e[errorMap[error]];
  }

  // 3. Dynamic strings that start with a known prefix
  //    e.g. "Insufficient balance. Available: $1,234.56"
  if (error.startsWith("Insufficient balance.") && e.insufficientBalanceDynamic) {
    const amountMatch = error.match(/Available:\s*(.+)/);
    return e.insufficientBalanceDynamic.replace("{{amount}}", amountMatch?.[1] ?? "");
  }
  if (error.startsWith("Insufficient card balance.") && e.insufficientCardBalanceDynamic) {
    const amountMatch = error.match(/Available:\s*(.+)/);
    return e.insufficientCardBalanceDynamic.replace("{{amount}}", amountMatch?.[1] ?? "");
  }

  return error;
}

/**
 * @deprecated  Use translateActionError instead
 */
export function translateError(error: string, errorsDict?: Record<string, string>): string {
  if (!errorsDict) return error;
  const key = errorMap[error];
  if (key && errorsDict[key]) return errorsDict[key];
  return error;
}

/**
 * @deprecated  Use translateActionError instead
 */
export function translateValidation(error: string, validationDict?: Record<string, string>): string {
  if (!validationDict) return error;
  if (error.startsWith("validation.")) {
    const key = error.replace("validation.", "");
    return validationDict[key] || error;
  }
  return error;
}
