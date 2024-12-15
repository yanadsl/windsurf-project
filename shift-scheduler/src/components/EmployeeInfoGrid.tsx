interface Employee {
  id: string;
  name: string;
  expectedHours: number;
  assignedHours: number;
  shifts: Array<{
    day: string;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  details: {
    department: string[];
    role: string[];
    contactInfo: string[];
    preferences: string[];
    other: string[];
  };
}

interface EmployeeInfoGridProps {
  employee: Employee | null;
  currentTime: Date;
}

export default function EmployeeInfoGrid({ employee, currentTime }: EmployeeInfoGridProps) {
  // If no employee selected, show placeholder or empty state
  if (!employee) {
    return (
      <div className="grid grid-cols-3 gap-4 p-4 bg-white">
        {[...Array(6)].map((_, index) => (
          <div 
            key={index} 
            className="border rounded-lg p-4 bg-gray-100 text-center text-gray-400 min-h-[100px] flex items-center justify-center"
          >
            Select an employee
          </div>
        ))}
      </div>
    );
  }

  // Detailed employee information grid
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-white">
      <div className="border rounded-lg p-4 min-h-[100px] flex flex-col">
        <strong className="text-sm mb-1">Name:</strong>
        <div className="text-sm break-words overflow-hidden">
          {employee.name}
        </div>
      </div>
      <div className="border rounded-lg p-4 min-h-[100px] flex flex-col">
        <strong className="text-sm mb-1">Department:</strong>
        <div className="text-sm break-words overflow-hidden">
          {employee.details.department.map((dept, index) => (
            <p key={index}>{dept}</p>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-4 min-h-[100px] flex flex-col">
        <strong className="text-sm mb-1">Role:</strong>
        <div className="text-sm break-words overflow-hidden">
          {employee.details.role.map((role, index) => (
            <p key={index}>{role}</p>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-4 min-h-[100px] flex flex-col">
        <strong className="text-sm mb-1">Contact:</strong>
        <div className="text-sm break-words overflow-hidden">
          {employee.details.contactInfo.map((contact, index) => (
            <p key={index}>{contact}</p>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-4 min-h-[100px] flex flex-col">
        <strong className="text-sm mb-1">Preferences:</strong>
        <div className="text-sm break-words overflow-hidden">
          {employee.details.preferences.map((pref, index) => (
            <p key={index}>{pref}</p>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-4 min-h-[100px] flex flex-col">
        <strong className="text-sm mb-1">Other Details:</strong>
        <div className="text-sm break-words overflow-hidden">
          {employee.details.other.map((other, index) => (
            <p key={index}>{other}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
