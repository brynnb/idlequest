import classes from "@data/json/classes.json";

interface Class {
  id: number;
  name: string;
  // Add other class properties as needed
}

export const getClassName = (classId: number): string => {
  const classData = classes.find((c: Class) => c.id === classId);
  return classData?.name || "";
};
