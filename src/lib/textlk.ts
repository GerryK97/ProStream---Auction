/**
 * text.lk SMS client — re-exported from @prostream/shared/sms
 *
 * This file exists for backward compatibility with any local imports
 * of `@/lib/textlk`. New code should import directly from the package:
 *
 *   import { sendSMS, generateOTP, normalizeMobile } from '@prostream/shared/sms'
 *   import { normalizeMobile } from '@prostream/shared/phone'
 */
export { sendSMS, generateOTP, type SmsSendResult } from '@prostream/shared/sms'
export { normalizeMobile, isValidE164, maskPhone } from '@prostream/shared/phone'
