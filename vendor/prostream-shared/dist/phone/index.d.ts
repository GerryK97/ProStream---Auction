/**
 * @prostream/shared — phone normalisation utilities
 *
 * Handles Sri Lankan and international mobile number formats.
 * Used by SMS sending, OTP storage and profile validation.
 */
/**
 * Normalise a mobile number to E.164 international format.
 *
 * Accepts:
 *   077...       → +9477...
 *   0094 77...   → +9477...
 *   94 77...     → +9477...
 *   +94 77...    → +9477...   (strips spaces/dashes/parens)
 *
 * Non-Sri-Lankan numbers with a leading + are passed through unchanged
 * (spaces/dashes stripped).
 */
export declare function normalizeMobile(raw: string): string;
/**
 * Returns true if the value looks like a valid E.164 number.
 */
export declare function isValidE164(phone: string): boolean;
/**
 * Returns a masked version of a phone number for display.
 * e.g. +94771234567 → +9477****567
 */
export declare function maskPhone(phone: string): string;
//# sourceMappingURL=index.d.ts.map