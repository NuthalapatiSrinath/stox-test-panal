import { body } from 'express-validator';

export const userSignupValidator = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isAlpha('en-US', { ignore: ' ' }).withMessage('Username must contain only letters')
    .trim(),

  body('emailId')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('mobileNumber')
    .notEmpty().withMessage('Mobile number is required')
    .isMobilePhone('any').withMessage('Invalid mobile number'),

  body('password')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })
    .withMessage('Password must be strong (min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol)')
];

export const userLoginValidator = [
  body('emailId')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];
const DocumentTypeEnum = {
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  PASSPORT: 'passport',
  // Add more if needed
};

export const validateKyc = [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isString().withMessage('Full name must be a string'),

  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Date of birth must be a valid date'),

  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female or other'),

  body('documentType')
    .notEmpty().withMessage('Document type is required')
    .isIn(Object.values(DocumentTypeEnum)).withMessage('Invalid document type'),

  body('documentNumber')
    .notEmpty().withMessage('Document number is required')
    .isString().withMessage('Document number must be a string'),

  body('documentImageUrl')
    .notEmpty().withMessage('Document image URL is required')
    .isURL().withMessage('Document image URL must be valid'),
];