export function sanitizeStudentID(studentID: string): string {
  return studentID.replace(/[^a-zA-Z0-9_-]/g, "");
}
