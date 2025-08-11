import { sendOtpEmail } from '../../../interfaces/services/otpService.js';
import otpQueue from '../emailOtpQueue.js';

export const otpProcessor = otpQueue.process(async (job) => {
  const { emailId, otp } = job.data;

  try {
    console.log(`📨 Sending OTP to ${emailId}: ${otp}`);
    await sendOtpEmail(emailId, otp);
    console.log(`✅ OTP sent to ${emailId}`);
  } catch (error) {
    console.error(`❌ Failed to send OTP to ${emailId}:`, error.message);
    throw error; // Let Bull handle retries if configured
  }
});

// Optional: Log job status
otpQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed for ${job.data.emailId}`);
});

otpQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed for ${job.data.emailId}: ${err.message}`);
});
