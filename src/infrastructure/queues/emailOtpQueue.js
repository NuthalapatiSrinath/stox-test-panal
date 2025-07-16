import Bull from 'bull';

const otpQueue = new Bull('otpQueue', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  }
});

export default otpQueue;