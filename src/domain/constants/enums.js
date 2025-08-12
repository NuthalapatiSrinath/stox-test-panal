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
// export const CONTESTTYPE ={
//   BUY_TODAY_SELL_TOMORROW: 'Buy Today Sell Tomorrow',
//   INTRA_DAY: 'Intra Day',
//   SEVEN_DAY_CLASH: '7-Day clash',
//   ONE_SHOT_GLORY:'One Shot Glory', 
// }
export const CONTESTTYPE ={
  BUY_TODAY_SELL_TOMORROW: 'daily',
  INTRA_DAY: 'hourly',
  SEVEN_DAY_CLASH: 'weekly',
  ONE_SHOT_GLORY:'monthly',
}
export const HOURTYPE={
  ONE_HOUR:'1hr',
  TWO_HOURS:'2hrs',
  THREE_HOURS:'3hrs',
  SIX_HOURS:'6hrs'
} 

export const CONTESTFORMAT = {
  HEAD_TO_HEAD:'Head to Head Contest',
  MULTIPLE_MEMBER:'Multiple Member Contest'
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

export const LOGINTYPES={
  USER:'user',
  ADMIN:'admin',
  MODERATER:'moderator'
}


export const OTPTYPE = {
  EMAIL_VERIFICATION :'email_verification',
  LOGIN:'login',
  RESET:'reset'
}

export const ADMINROLES = {
  SUPER_ADMIN:'super_admin',
  ADMIN:'admin'
}

export const WITHDRAWREQUESTRESULT={
      PENDING:'pending',
      DENIED:'denied',
      ACCEPTED:'accepted'
}