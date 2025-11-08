import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import config from '../../config/env';
import { Role } from '@prisma/client';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  department?: string;
  designation?: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  phone?: string;
  department?: string;
  designation?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  accountHolderName?: string;
}

/**
 * Get all users (with pagination)
 */
export const getAllUsers = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        designation: true,
        bankAccountNumber: true,
        bankName: true,
        ifscCode: true,
        accountHolderName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      department: true,
      designation: true,
      bankAccountNumber: true,
      bankName: true,
      ifscCode: true,
      accountHolderName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Create a new user (Admin only)
 */
export const createUser = async (input: CreateUserInput) => {
  const { name, email, password, role, phone, department, designation } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      department,
      designation,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      department: true,
      designation: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Update user (Admin only or self)
 */
export const updateUser = async (userId: string, input: UpdateUserInput) => {
  const { name, email, password, role, phone, department, designation, bankAccountNumber, bankName, ifscCode, accountHolderName } = input;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email },
    });

    if (emailTaken) {
      throw new Error('Email already in use');
    }
  }

  // Prepare update data
  const updateData: any = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (phone !== undefined) updateData.phone = phone;
  if (department !== undefined) updateData.department = department;
  if (designation !== undefined) updateData.designation = designation;
  if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
  if (bankName !== undefined) updateData.bankName = bankName;
  if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
  if (accountHolderName !== undefined) updateData.accountHolderName = accountHolderName;

  // Hash password if provided
  if (password) {
    updateData.password = await bcrypt.hash(password, config.bcrypt.saltRounds);
  }

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        designation: true,
        bankAccountNumber: true,
        bankName: true,
        ifscCode: true,
        accountHolderName: true,
        updatedAt: true,
      },
  });

  return user;
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: 'User deleted successfully' };
};

