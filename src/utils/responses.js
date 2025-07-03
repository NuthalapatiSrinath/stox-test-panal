export const HttpResponse = {
  OK: { code: 200, message: 'OK',message_2:"OTP verified successfully" },
  CREATED: { code: 201, message: 'Created' },
  UPDATED: { code: 202, message: 'Updated' },
  ALL_FIELDS_REQUIRED:{code:204,message:'All fields are required'},

  BAD_REQUEST: { code: 400, message: 'Bad Request',message_2:"OTP has expired",meesage_3:"No OTP request found. Please request a new OTP." },
  INVALID_MAIL_ADDRESS:{code:405,message:"Invalid Email Address"},
  INVALID_KYC_STATUS:{code:407,message:'Invalid KYC status'},
  REJECTION_REASON_REQUIRED:{code:408,message:'Rejection Reason is Required'},
  WEAK_PASSWORD:{code:406,message:"Weak Password Please Choose Strong Password"},
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' ,message_2: "User ID mismatch with token",message_3:'Your account is blocked',message_4:"Invalid OTP"},
  WRONG_PASSWORD:{code:402,message:'Please Enter Correct Password'},
  FORBIDDEN: { code: 403, message: 'Forbidden',message_2:"Too many failed attempts. Please request a new OTP." },
  NOT_FOUND: { code: 404, message: 'User Not Found' },
  ALREADY_EXISTS: { code: 409, message: 'User Already Exists' },
  UNPROCESSABLE_ENTITY: { code: 422, message: 'Unprocessable Entity' },
  
  INTERNAL_SERVER_ERROR: { code: 500, message: 'Internal Server Error' },
  NOT_IMPLEMENTED: { code: 501, message: 'Not Implemented' },
  BAD_GATEWAY: { code: 502, message: 'Bad Gateway' },
  SERVICE_UNAVAILABLE: { code: 503, message: 'Service Unavailable' },
};
