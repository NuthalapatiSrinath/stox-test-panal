import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export const registerUserUseCase = async ({ username, emailId, password, mobileNumber }, userRepository) => {
  const existingUser = await userRepository.findUser({ emailId, username, mobileNumber });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    username,
    emailId,
    mobileNumber,
    password: hashedPassword,
    createdAt: new Date()
  };

  return await userRepository.createUser(newUser);
};
