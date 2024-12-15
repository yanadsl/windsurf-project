import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  teams: Array<string>;
}

interface EmployeeListProps {
  employees: Array<Employee>;
  onSelectEmployee: (employee: Employee) => void;
  selectedEmployee: Employee | null;
  selectedDay: string;
  employeeInfoGridRef?: React.RefObject<HTMLDivElement>;
  dayFilterRef?: React.RefObject<HTMLDivElement>;
  teamFilterRef?: React.RefObject<HTMLDivElement>;
  statusBarRef?: React.RefObject<HTMLDivElement>;
}

export default function EmployeeList({ 
  employees, 
  onSelectEmployee, 
  selectedEmployee,
  selectedDay,
  employeeInfoGridRef,
  dayFilterRef,
  teamFilterRef,
  statusBarRef
}: EmployeeListProps) {
  // Use passed refs if available, otherwise create new ones
  const infoGridRef = employeeInfoGridRef || useRef<HTMLDivElement>(null);
  const dayFilterSearchRef = dayFilterRef || useRef<HTMLDivElement>(null);
  const teamFilterSearchRef = teamFilterRef || useRef<HTMLDivElement>(null);
  const statusBarRefLocal = statusBarRef || useRef<HTMLDivElement>(null);

  // State to track list height
  const [listHeight, setListHeight] = useState<number>(0);

  // Resize handler to dynamically calculate list height
  const handleResize = useCallback(() => {

    // Get heights of other components
    const infoGridHeight = infoGridRef.current?.offsetHeight || 0;
    const dayFilterHeight = dayFilterSearchRef.current?.offsetHeight || 0;
    const teamFilterHeight = teamFilterSearchRef.current?.offsetHeight || 0;
    const statusBarHeight = statusBarRefLocal.current?.offsetHeight || 0;

    // Calculate total height of top components
    const topComponentsHeight = infoGridHeight + dayFilterHeight + teamFilterHeight + statusBarHeight;

    // Calculate list height based on window height and top components
    const calculatedHeight = window.innerHeight - topComponentsHeight - 20; // Extra padding

    setListHeight(calculatedHeight);
  }, []);

  // Effect to add resize listener and initial calculation
  useEffect(() => {
    // Initial calculation with a slight delay to ensure refs are populated
    const timer = setTimeout(handleResize, 100);

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup listener
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Split employees into two categories
  const fullyScheduled = employees.filter(emp => emp.assignedHours >= emp.expectedHours);
  const needsHours = employees.filter(emp => emp.assignedHours < emp.expectedHours);

  // Helper function to get day number
  const getDayDate = (dayOffset: number) => {
    return `${dayOffset + 1}`; // Returns "1", "2", or "3"
  };

  const getEmployeeShiftsForDay = (employee: Employee) => {
    return employee.shifts.filter(shift => shift.day === getDayDate(parseInt(selectedDay)));
  };

  const getEmployeeCardStyle = (employee: typeof employees[0]) => {
    const baseStyle = "cursor-pointer p-2 rounded border transition-colors duration-200";
    const isSelected = selectedEmployee?.id === employee.id;
    
    if (employee.assignedHours >= employee.expectedHours) {
      return `${baseStyle} ${
        isSelected 
          ? 'bg-green-200 border-green-500' 
          : 'border-green-200 hover:bg-green-100'
      }`;
    } else {
      return `${baseStyle} ${
        isSelected 
          ? 'bg-yellow-200 border-yellow-500' 
          : 'border-yellow-200 hover:bg-yellow-100'
      }`;
    }
  };

  const formatHours = (hours: number) => {
    return Number.isInteger(hours) ? hours.toString() : hours.toFixed(1);
  };

  const getHoursText = (employee: typeof employees[0]) => {
    const hoursDiff = employee.assignedHours - employee.expectedHours;
    if (hoursDiff > 0) {
      return (
        <div className="text-xs text-orange-500">
          Overwork {formatHours(hoursDiff)} more hours
        </div>
      );
    } else if (hoursDiff < 0) {
      return (
        <div className="text-xs text-red-500">
          Needs {formatHours(-hoursDiff)} more hours
        </div>
      );
    }
    return null;
  };

  // Format shifts to hours, removing .0 for whole numbers
  const formatShiftsToHours = (shifts: Array<{day: string, startTime: string, endTime: string, location: string}>): string => {
    const hours = shifts.length / 2;
    // Use toFixed(1) to handle decimal, then remove trailing .0 if present
    return hours % 1 === 0 
      ? hours.toFixed(0) 
      : hours.toFixed(1).replace(/\.0$/, '');
  };

  return (
    <div 
      className="flex h-full overflow-hidden"
      style={{ maxHeight: `${listHeight}px` }}
    >
      {/* Fully Scheduled Employees */}
      <div 
        className="w-1/2 bg-green-50 p-4 overflow-y-auto"
      >
        <h3 className="font-bold mb-4 sticky top-0 bg-green-50 py-2">Fully Scheduled</h3>
        <div className="space-y-2">
          {fullyScheduled.map(employee => (
            <div 
              key={employee.id}
              onClick={() => onSelectEmployee(employee)}
              className={getEmployeeCardStyle(employee)}
            >
              <div className="font-medium">{employee.name}</div>
              <div className="text-sm text-gray-600">
                {formatHours(employee.assignedHours)}/{formatHours(employee.expectedHours)} hours
                {getHoursText(employee)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Shifts today: {formatShiftsToHours(getEmployeeShiftsForDay(employee))} hrs
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employees Needing Hours */}
      <div 
        className="w-1/2 bg-yellow-50 p-4 overflow-y-auto"
      >
        <h3 className="font-bold mb-4 sticky top-0 bg-yellow-50 py-2">Needs Hours</h3>
        <div className="space-y-2">
          {needsHours.map(employee => (
            <div 
              key={employee.id}
              onClick={() => onSelectEmployee(employee)}
              className={getEmployeeCardStyle(employee)}
            >
              <div className="font-medium">{employee.name}</div>
              <div className="text-sm text-gray-600">
                {formatHours(employee.assignedHours)}/{formatHours(employee.expectedHours)} hours
                {getHoursText(employee)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Shifts today: {formatShiftsToHours(getEmployeeShiftsForDay(employee))} hrs
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
