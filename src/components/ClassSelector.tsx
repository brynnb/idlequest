import React from "react";
import classes from "../../data/classes.json";

interface Class {
  id: number;
  name: string;
}

interface ClassSelectorProps {
  selectedClass: Class | null;
  onSelectClass: (selectedClass: Class) => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({
  selectedClass,
  onSelectClass,
}) => {
  const availableClasses = classes.slice(0, 14);

  return (
    <div>
      {availableClasses.map((classItem) => (
        <button
          key={classItem.id}
          onClick={() => onSelectClass(classItem)}
          style={{
            backgroundColor:
              selectedClass?.id === classItem.id ? "#007bff" : "#f8f9fa",
            color: selectedClass?.id === classItem.id ? "white" : "black",
            margin: "5px",
            padding: "10px",
            border: "1px solid #ced4da",
            borderRadius: "4px",
          }}
        >
          {classItem.name}
        </button>
      ))}
    </div>
  );
};

export default ClassSelector;
