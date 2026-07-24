export interface AttendanceData {
  studentId: string;
  date: string;
  status?: "PRESENT" | "ABSENT";
}
