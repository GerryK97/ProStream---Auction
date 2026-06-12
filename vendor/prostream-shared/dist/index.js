"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./phone/index"), exports);
__exportStar(require("./sms/index"), exports);
__exportStar(require("./otp/index"), exports);
//# sourceMappingURL=index.js.map