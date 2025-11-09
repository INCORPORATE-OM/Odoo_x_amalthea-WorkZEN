export type UserRole = 'admin' | 'employee' | 'hr_officer' | 'payroll_officer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
  designation?: string;
  avatar?: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@workzen.com',
    role: 'admin',
    phone: '+1234567890',
    department: 'Management',
    designation: 'System Administrator',
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@workzen.com',
    role: 'employee',
    phone: '+1234567891',
    department: 'Engineering',
    designation: 'Software Engineer',
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@workzen.com',
    role: 'hr_officer',
    phone: '+1234567892',
    department: 'Human Resources',
    designation: 'HR Manager',
  },
  {
    id: '4',
    name: 'Robert Wilson',
    email: 'robert@workzen.com',
    role: 'payroll_officer',
    phone: '+1234567893',
    department: 'Finance',
    designation: 'Payroll Manager',
  },
];

// Auth state management
let currentUser: User | null = null;

// Vite exposes environment variables via import.meta.env.
// Use VITE_API_BASE to configure the API base URL in development/production.
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const login = async (email: string, password: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('auth failed');
    const user = await res.json();
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  } catch (err) {
    // fallback to mock users
    const user = mockUsers.find((u) => u.email === email);
    if (user && password === 'password123') {
      currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    return null;
  }
};

export const logout = () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
};

export const getCurrentUser = (): User | null => {
  if (currentUser) return currentUser;
  
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    currentUser = JSON.parse(stored);
    return currentUser;
  }
  
  return null;
};

export const hasRole = (allowedRoles: UserRole[]): boolean => {
  const user = getCurrentUser();
  return user ? allowedRoles.includes(user.role) : false;
};
