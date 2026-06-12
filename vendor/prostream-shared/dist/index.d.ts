/**
 * @prostream/shared — barrel export
 *
 * Import from sub-paths for tree-shaking:
 *   import { normalizeMobile } from '@prostream/shared/phone'
 *   import { sendSMS, generateOTP } from '@prostream/shared/sms'
 *   import { createOtpRecord, ... } from '@prostream/shared/otp'
 *
 * Or import everything from root:
 *   import { normalizeMobile, sendSMS, ... } from '@prostream/shared'
 */
export * from './phone/index';
export * from './sms/index';
export * from './otp/index';
//# sourceMappingURL=index.d.ts.map