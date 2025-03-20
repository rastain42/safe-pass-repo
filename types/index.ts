// src/types/index.ts

export interface EventForm {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  image?: string; // Optional field for the image URL
}
