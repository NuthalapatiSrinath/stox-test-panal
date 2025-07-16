export const LoginMethodEnum = Object.freeze({
  EMAIL: 'email',
  PHONE: 'phone',
  GOOGLE: 'google',
  APPLE: 'apple',
});

export const DocumentTypeEnum = Object.freeze({
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  PASSPORT: 'passport',
});

export const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};
export const genderOptions = {
  MALE:'male',
  FEMALE: 'female',
  OTHER: 'other',
};
export const CONTESTCATEGORYTYPE ={
  DAILY: 'Daily',
  HOURLY: 'Hourly',
  WEEKLY: 'Weekly',
  MONTHLY:'Monthly',
}
export const CONTESTYPE = {
  HEAD_TO_HEAD:'Head to Head',
  MULTIPLE_MEMBER:'Multiple Member'
}

export const LEADERBOARDSTATUS = {
  PENDING:'pending',
  CALCULATED:'calculated',
  PAID:'paid'
}

export const tpeOfTransaction ={
  TOP_UP:'top-up',
  WITHDRAW:'withdraw',
  CONTEST_ENTRY:'contest-entry'
}

export const transactionResult={
  PENDING:'pending',
  SUCCESS:'success',
  FAILED:'failed'
}