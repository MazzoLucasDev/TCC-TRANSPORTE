export interface StudentData {
  userId: string;
  dateOfBirth: string;
  collectionPoint: {
    lat: number;
    long: number;
  };
}
