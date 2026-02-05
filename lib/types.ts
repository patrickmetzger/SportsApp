export type UserRole = 'admin' | 'school_admin' | 'coach' | 'assistant_coach' | 'student' | 'parent';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

export interface Student {
  id: string;
  userId: string;
  grade: number;
  parentId?: string;
  sports: string[];
}

export interface Coach {
  id: string;
  userId: string;
  sport: string;
  teamName?: string;
}

export interface Parent {
  id: string;
  userId: string;
  students: string[];
}
