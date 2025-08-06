export interface Employee {
  id: string;
  name: string;
  position: string;
  team: number;
  birthday: string;
  email: string;
  phoneNumber: string;
  address: string;
  employmentStatus: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  notes: string;
} 