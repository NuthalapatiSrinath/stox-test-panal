import { sendOtpEmail } from '../../../interfaces/services/otpService.js';
import otpQueue from '../emailOtpQueue.js';
export const otpProcessor= otpQueue.process(async (job)=>{
    const {emailId,otp} = job.data;
     await sendOtpEmail(emailId,otp);
     console.log('Otp sent to mail')
})