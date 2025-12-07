export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadSampleCSV = () => {
  const csvContent = `name,notes
John Smith,Special Education Support
Jane Doe,ESL and Reading Specialist
Mary Johnson,`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, 'sample_aides_upload.csv');
};

export const downloadSampleClassroomsCSV = () => {
  const csvContent = `name,year_level,room_number,teacher
3A,3,101,Ms. Johnson
4B,4,,Mr. Smith
Prep A,Prep,102,Mrs. Williams`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, 'sample_classrooms_upload.csv');
};
















