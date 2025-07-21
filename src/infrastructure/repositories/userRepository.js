import User from '../db/models/userModel.js';

export const userRepository = {
  findUser: async ({ emailId, username, mobileNumber }) => {
    return await User.findOne({
      $or: [{ emailId }, { username }, { mobileNumber }]
    });
  },

  createUser: async (userData) => {
    return await User.create(userData);
  }
};