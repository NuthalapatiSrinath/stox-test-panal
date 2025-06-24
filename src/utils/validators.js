import validator from 'validator';

export const validateUtils = {
  isEmail: (email) => validator.isEmail(email),
  isStrongPassword: (password) =>
    validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }),
  isAlpha: (str) => validator.isAlpha(str, 'en-US'),
  isNumeric: (str) => validator.isNumeric(str),
  isEmpty: (str) => validator.isEmpty(str),
  isUUID: (str) => validator.isUUID(str),
  isURL: (url) => validator.isURL(url),
  sanitizeEmail: (email) => validator.normalizeEmail(email),
  trim: (str) => validator.trim(str)
};
