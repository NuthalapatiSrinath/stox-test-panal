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