export interface TodoEntry {
    id: string;
    userId: string; // required for single-table PK
    title: string;
    completed: boolean;
    date: string;
    timePeriod: string;
  
  }
  