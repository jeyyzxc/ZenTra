export type PublicTestimony = {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  packageName: string | null;
  overallRating: number;
  approachRating: number;
  foodRating: number;
  serviceRating: number;
  venueRating: number | null;
  communicationRating: number | null;
  comment: string;
  photoUrl: string | null;
  isFeatured: boolean;
  submittedAt: string;
};

export type PublicTestimoniesResponse = {
  testimonies: PublicTestimony[];
  filterOptions: {
    eventTypes: string[];
    packages: string[];
  };
  error?: string;
};
