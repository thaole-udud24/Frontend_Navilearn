export interface StudentSubject {
  _id: string;
  owner: string;
  // Null when this is a self-made subject (ST-01 "Tạo môn của riêng tôi") — it then carries no
  // lộ trình/Mastery, just the student's own custom* label below.
  concept: { _id: string; name: string; description?: string } | string | null;
  customTitle?: string;
  customDescription?: string;
  customColor?: string;
  pinned: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubjectFilters {
  page?: number;
  limit?: number;
}

export type CreateStudentSubjectInput =
  | { concept: string }
  | { customTitle: string; customDescription?: string; customColor?: string };

export interface UpdateStudentSubjectInput {
  pinned?: boolean;
  displayOrder?: number;
  customTitle?: string;
  customDescription?: string;
  customColor?: string;
}
