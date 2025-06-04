export interface Problem {
  id: string;
  lcnumber: string;
  title: string;
  tags: string[];
  difficulty: string;
  solution: string;
  notes: string;
  completed: boolean;
  created_time: string;
  updated_time: string;
}
