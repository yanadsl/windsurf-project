'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import StatusBar from '@/components/StatusBar';
import EmployeeInfoGrid from '@/components/EmployeeInfoGrid';
import EmployeeList from '@/components/EmployeeList';
import TimeTable from '@/components/TimeTable';

// Define types for our data structures
interface Shift {
  day: string;
  startTime: string;
  location: string;
}

interface ForbiddenHour {
  day: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

interface Employee {
  id: string;
  name: string;
  expectedHours: number;
  assignedHours: number;
  teams: string[];
  shifts: Array<{
    day: string;
    startTime: string;
    location: string;
  }>;
  forbiddenHours: Array<{
    day: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }>;
  details: {
    department: string[];
    role: string[];
    contactInfo: string[];
    preferences: string[];
    other: string[];
  };
}

interface Location {
  name: string;
  teams: string[];
}

const LOCATIONS: Location[] = [
  { name: 'Main Hall', teams: ['Main Hall', 'Service'] },
  { name: 'Kitchen', teams: ['Kitchen', 'Service'] },
  { name: 'Reception', teams: ['Reception', 'Management'] },
  { name: 'Warehouse', teams: ['Warehouse', 'Logistics'] },
  { name: 'Conference Room A', teams: ['Management', 'Sales'] },
  { name: 'Conference Room B', teams: ['Management', 'Sales'] },
  { name: 'Outdoor Patio', teams: ['Service', 'Main Hall'] },
  { name: 'Storage Room', teams: ['Logistics', 'Warehouse'] },
  { name: 'Break Room', teams: ['Service', 'All Teams'] },
  { name: 'Loading Dock', teams: ['Logistics', 'Warehouse'] }
];

const TEAMS = [
  'Sales', 
  'Management', 
  'Kitchen', 
  'Service', 
  'Reception', 
  'Warehouse', 
  'Logistics', 
  'Main Hall'
];

export { LOCATIONS, TEAMS };

export default function Home() {
  // State management
  const [currentTime] = useState(new Date('2024-12-07T17:52:50+08:00'));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0, 1, 2 for three days

  // State for dropdown visibility
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  // State for locations to allow modification
  const [availableLocations, setAvailableLocations] = useState<Location[]>(LOCATIONS);

  // State for available teams
  const [availableTeams, setAvailableTeams] = useState<string[]>(TEAMS);

  // State for team selection dropdown
  const [teamSelectionDropdown, setTeamSelectionDropdown] = useState({
    location: null as string | null
  });

  // State for add location modal
  const [addLocationModal, setAddLocationModal] = useState({
    isOpen: false,
    locationName: '',
    selectedTeams: [] as string[]
  });

  // Helper function to get day number
  const getDayDate = (dayOffset: number) => {
    return `${dayOffset + 1}`; // Returns "1", "2", or "3"
  };

  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: 'John Doe',
      expectedHours: 40,
      assignedHours: 32,
      teams: ['Sales', 'Management'],
      shifts: [
        {
          day: '1',
          startTime: '09:00',
          location: 'Conference Room A'
        }
      ],
      forbiddenHours: [
        {
          day: '1',
          startTime: '12:00',
          endTime: '13:00',
          reason: 'Lunch Break'
        }
      ],
      details: {
        department: ['Sales', 'Management'],
        role: ['Manager'],
        contactInfo: ['john.doe@company.com'],
        preferences: ['Prefers morning shifts and team meetings'],
        other: ['Excellent communication skills, leadership potential']
      }
    },
    {
      id: '2',
      name: 'Jane Smith',
      expectedHours: 35,
      assignedHours: 35,
      teams: ['Kitchen', 'Service'],
      shifts: [
        {
          day: '1',
          startTime: '10:00',
          location: 'Kitchen'
        }
      ],
      forbiddenHours: [
        {
          day: '1',
          startTime: '15:00',
          endTime: '16:00',
          reason: 'School Pickup'
        }
      ],
      details: {
        department: ['Kitchen'],
        role: ['Chef'],
        contactInfo: ['jane.smith@company.com'],
        preferences: ['Enjoys creative cooking stations, flexible hours'],
        other: ['Certified in food safety, multilingual']
      }
    },
    {
      id: '3',
      name: 'Mike Johnson',
      expectedHours: 30,
      assignedHours: 20,
      teams: ['Reception', 'Management'],
      shifts: [
        {
          day: '1',
          startTime: '10:00',
          location: 'Reception'
        },
        {
          day: '1',
          startTime: '15:30',
          location: 'Break Room'
        }
      ],
      forbiddenHours: [
        {
          day: '1',
          startTime: '08:00',
          endTime: '10:00',
          reason: 'Medical Appointment'
        },
        {
          day: '1',
          startTime: '20:00',
          endTime: '23:00',
          reason: 'Personal Time'
        }
      ],
      details: {
        department: ['Reception'],
        role: ['Receptionist'],
        contactInfo: ['mike.j@company.com'],
        preferences: ['Prefers afternoon shifts, enjoys customer interaction'],
        other: ['Strong organizational skills, tech-savvy']
      }
    },
    {
      id: '4',
      name: 'Emily Brown',
      expectedHours: 40,
      assignedHours: 38,
      teams: ['Warehouse', 'Logistics'],
      shifts: [
        {
          day: '1',
          startTime: '09:00',
          location: 'Warehouse'
        }
      ],
      forbiddenHours: [
        {
          day: '1',
          startTime: '12:00',
          endTime: '13:00',
          reason: 'Lunch Break'
        }
      ],
      details: {
        department: ['Warehouse'],
        role: ['Supervisor'],
        contactInfo: ['emily.b@company.com'],
        preferences: ['Prefers structured schedules, early morning shifts'],
        other: ['Experienced in inventory management, safety certified']
      }
    },
    {
      id: '5',
      name: 'David Wilson',
      expectedHours: 25,
      assignedHours: 15,
      teams: ['Main Hall', 'Service'],
      shifts: [
        {
          day: '1',
          startTime: '18:00',
          location: 'Outdoor Patio'
        }
      ],
      forbiddenHours: [
        {
          day: '1',
          startTime: '18:00',
          endTime: '20:00',
          reason: 'Personal Time'
        }
      ],
      details: {
        department: ['Main Hall'],
        role: ['Server'],
        contactInfo: ['david.w@company.com'],
        preferences: ['Flexible with evening shifts, enjoys social interactions'],
        other: ['Strong teamwork skills, adaptable to different roles']
      }
    },
    {
      id: '6',
      name: 'Lisa Chen',
      expectedHours: 35,
      assignedHours: 32,
      teams: ['Kitchen', 'Service'],
      shifts: [
        {
          day: '1',
          startTime: '08:00',
          location: 'Conference Room B'
        }
      ],
      forbiddenHours: [
        {
          day: '1',
          startTime: '15:00',
          endTime: '16:00',
          reason: 'School Pickup'
        }
      ],
      details: {
        department: ['Kitchen'],
        role: ['Sous Chef'],
        contactInfo: ['lisa.c@company.com'],
        preferences: ['Prefers morning shifts, enjoys cooking with team'],
        other: ['Certified in food safety, multilingual']
      }
    },
    {
      id: '7',
      name: 'Tom Anderson',
      expectedHours: 30,
      assignedHours: 20,
      teams: ['Warehouse', 'Logistics'],
      shifts: [
        {
          day: '1',
          startTime: '10:00',
          location: 'Storage Room'
        },
        {
          day: '1',
          startTime: '15:30',
          location: 'Loading Dock'
        }
      ],
      forbiddenHours: [
        {
          day: '1',
          startTime: '08:00',
          endTime: '10:00',
          reason: 'Medical Appointment'
        },
        {
          day: '1',
          startTime: '20:00',
          endTime: '23:00',
          reason: 'Personal Time'
        }
      ],
      details: {
        department: ['Warehouse'],
        role: ['Staff'],
        contactInfo: ['tom.a@company.com'],
        preferences: ['Prefers afternoon shifts, enjoys working independently'],
        other: ['Experienced in inventory management, safety certified']
      }
    },
    {
      id: '8',
      name: 'Rachel Garcia',
      expectedHours: 35,
      assignedHours: 35,
      teams: ['Reception', 'Management'],
      shifts: [
        {
          day: '1',
          startTime: '08:00',
          location: 'Reception'
        }
      ],
      forbiddenHours: [
        {
          day: '1',
          startTime: '12:00',
          endTime: '13:00',
          reason: 'Lunch Break'
        }
      ],
      details: {
        department: ['Reception'],
        role: ['Lead Host'],
        contactInfo: ['rachel.g@company.com'],
        preferences: ['Prefers morning shifts, enjoys customer interaction'],
        other: ['Strong organizational skills, tech-savvy']
      }
    }
  ]);

  // Refs for components
  const employeeInfoGridRef = useRef<HTMLDivElement>(null);
  const dayFilterRef = useRef<HTMLDivElement>(null);
  const teamFilterRef = useRef<HTMLDivElement>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);

  // Get unique teams from employees
  const availableTeamsFromEmployees = useMemo(() => {
    const teamSet = new Set<string>();
    employees.forEach(emp => {
      emp.teams?.forEach(team => teamSet.add(team));
    });
    return Array.from(teamSet).sort();
  }, [employees]);

  // Toggle team selection
  const toggleTeamSelection = (team: string) => {
    setSelectedTeams(prev => 
      prev.includes(team) 
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  // Toggle dropdown visibility
  const toggleTeamDropdown = () => {
    setIsTeamDropdownOpen(prev => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('team-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsTeamDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedEmployee = useMemo(() => 
    employees.find(emp => emp.id === selectedEmployeeId) || null
  , [employees, selectedEmployeeId]);

  // Filter employees based on selected teams
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      // If no teams are selected, show all employees
      selectedTeams.length === 0 || 
      // Check if employee's teams or location teams match selected teams
      emp.teams.some(team => selectedTeams.includes(team)) ||
      emp.shifts.some(shift => {
        const location = availableLocations.find(loc => loc.name === shift.location);
        return location && location.teams.some(team => selectedTeams.includes(team));
      })
    );
  }, [employees, selectedTeams, availableLocations]);

  // Filter locations based on selected teams
  const filteredLocations = useMemo(() => {
    // If no teams are selected, return all locations
    if (selectedTeams.length === 0) {
      return availableLocations.map(loc => loc.name);
    }
    
    // Return locations that match any of the selected teams
    return availableLocations
      .filter(loc => 
        loc.teams.some(team => selectedTeams.includes(team))
      )
      .map(loc => loc.name);
  }, [selectedTeams, availableLocations]);

  // Helper function to determine if an employee needs more hours
  const needsMoreHours = (employee: Employee) => employee.assignedHours < employee.expectedHours;

  // Check if a time slot conflicts with forbidden hours
  const checkTimeConflict = (
    employee: Employee, 
    timeSlot: string, 
    day: string
  ): boolean => {
    // Convert timeSlot to a Date for easier comparison
    const slotTime = parseTime(timeSlot);

    return employee.forbiddenHours.some(forbidden => {
      // Check if the forbidden hours are for the same day
      if (forbidden.day !== day) return false;

      const forbiddenStart = parseTime(forbidden.startTime);
      const forbiddenEnd = parseTime(forbidden.endTime);

      // Check if the time slot falls within forbidden hours
      return (
        slotTime >= forbiddenStart && 
        slotTime < forbiddenEnd
      );
    });
  };

  const handleUpdateShifts = (
    employee: Employee, 
    timeSlot: string, 
    location: string, 
    isAdding: boolean
  ) => {
    const currentDay = getDayDate(selectedDay);

    setEmployees(prevEmployees => {
      return prevEmployees.map(emp => {
        if (emp.id === employee.id) {
          let updatedShifts;
          
          if (isAdding) {
            // Check for time conflicts with forbidden hours
            if (checkTimeConflict(emp, timeSlot, currentDay)) {
              // Optional: Add a notification or prevent adding
              return emp;
            }

            // Location and team validation logic remains the same
            const locationObj = availableLocations.find(loc => loc.name === location);
            const isValidLocation = 
              selectedTeams.length === 0 || 
              (locationObj && locationObj.teams.some(team => selectedTeams.includes(team))) ||
              emp.teams.some(team => selectedTeams.includes(team));
            
            if (!isValidLocation) {
              return emp; // Do not add shift if location doesn't match teams
            }
            
            updatedShifts = [
              ...emp.shifts,
              {
                day: currentDay,
                startTime: timeSlot,
                location: location
              }
            ];
          } else {
            // Removing shift
            updatedShifts = emp.shifts.filter(shift => 
              !(shift.day === currentDay && 
                shift.startTime === timeSlot && 
                shift.location === location)
            );
          }

          // Calculate total hours (each shift is 30 minutes)
          const totalHours = updatedShifts.length * 0.5;

          return {
            ...emp,
            shifts: updatedShifts,
            assignedHours: totalHours
          };
        }
        return emp;
      });
    });
  };

  // Helper function to parse time string into a comparable format
  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Handler functions
  const handleAddEmployee = () => {
    // Logic to add a new employee
  };

  const handleDeleteEmployee = () => {
    // Logic to delete an employee
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
  };

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export function to generate JSON with current state
  const exportToJson = async () => {
    const exportData = {
      locations: availableLocations.map(location => ({
        name: location.name,
        teams: location.teams || [] // Ensure teams are always an array
      })),
      teams: availableTeams, // Export all current teams
      employees: employees
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    try {
      // Show native file save dialog
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: `shift_scheduler_export_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`,
        types: [{
          description: 'JSON File',
          accept: {'application/json': ['.json']}
        }]
      });

      // Write file contents
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();
    } catch (error) {
      // Handle cancellation or errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('File save was cancelled');
      } else {
        console.error('Export failed:', error);
        alert('Failed to export file.');
      }
    }
  };

  // Enhanced import function to handle locations with teams
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        // Validate imported data structure
        if (!importedData.employees || !Array.isArray(importedData.employees)) {
          throw new Error('Invalid import file format');
        }

        // Update employees with imported data
        const updatedEmployees = importedData.employees.map(importedEmp => {
          // Find existing employee or create new one
          const existingEmp = employees.find(emp => emp.id === importedEmp.id);
          
          return {
            ...existingEmp,
            ...importedEmp,
            shifts: importedEmp.shifts || []
          };
        });

        // Update state with imported employees
        setEmployees(updatedEmployees);

        // Replace locations entirely if provided
        if (importedData.locations && Array.isArray(importedData.locations)) {
          // Directly replace availableLocations
          const newLocations = importedData.locations.map(importedLocation => ({
            name: importedLocation.name,
            teams: importedLocation.teams || []
          }));

          // Update state for locations
          setAvailableLocations(newLocations);
          
          // Update available teams from imported locations
          const allTeams = Array.from(new Set(
            newLocations.flatMap(loc => loc.teams)
          ));
          setAvailableTeams(allTeams);
        }

        // Show success message
        alert(`Successfully imported ${updatedEmployees.length} employees and ${importedData.locations?.length || 0} locations`);

        // Reset the file input to allow re-importing the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import file. Please check the file format.');

        // Reset the file input even if import fails
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Function to handle location-specific team selection
  const handleLocationTeamChange = (location: string, teams: string[]) => {
    // Update the availableLocations with new team configuration
    const updatedLocations = availableLocations.map(loc => 
      loc.name === location 
        ? { ...loc, teams: teams } 
        : loc
    );
    setAvailableLocations(updatedLocations);

    // Update available teams globally
    const allTeams = Array.from(new Set(
      updatedLocations.flatMap(loc => loc.teams)
    ));
    setAvailableTeams(allTeams);
  };

  // Handle adding a new location
  const handleAddLocation = () => {
    // Validate location name
    if (!addLocationModal.locationName.trim()) {
      alert('Please enter a location name');
      return;
    }

    // Check if location already exists
    const locationExists = availableLocations.some(
      loc => loc.name.toLowerCase() === addLocationModal.locationName.trim().toLowerCase()
    );

    if (locationExists) {
      alert('A location with this name already exists');
      return;
    }

    // Create new location
    const newLocation = {
      name: addLocationModal.locationName.trim(),
      teams: addLocationModal.selectedTeams
    };

    // Update available locations
    const updatedLocations = [...availableLocations, newLocation];
    setAvailableLocations(updatedLocations);

    // Update available teams
    const updatedTeams = Array.from(new Set([
      ...availableTeams,
      ...addLocationModal.selectedTeams
    ]));
    setAvailableTeams(updatedTeams);

    // Close modal and reset state
    setAddLocationModal({
      isOpen: false,
      locationName: '',
      selectedTeams: []
    });
  };

  // Render add location modal
  const renderAddLocationModal = () => {
    if (!addLocationModal.isOpen) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setAddLocationModal(prev => ({ ...prev, isOpen: false }))}
      >
        <div 
          className="bg-white p-6 rounded-lg shadow-xl w-96"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-4">Add New Location</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Name
            </label>
            <input 
              type="text"
              value={addLocationModal.locationName}
              onChange={(e) => setAddLocationModal(prev => ({ 
                ...prev, 
                locationName: e.target.value 
              }))}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter location name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Teams
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableTeams.map(team => (
                <label 
                  key={team} 
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input 
                    type="checkbox"
                    checked={addLocationModal.selectedTeams.includes(team)}
                    onChange={() => {
                      setAddLocationModal(prev => ({
                        ...prev,
                        selectedTeams: prev.selectedTeams.includes(team)
                          ? prev.selectedTeams.filter(t => t !== team)
                          : [...prev.selectedTeams, team]
                      }));
                    }}
                    className="form-checkbox"
                  />
                  <span>{team}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setAddLocationModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddLocation}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Location
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Status Bar with ref */}
      <div ref={statusBarRef} className="z-10">
        <StatusBar 
          currentTime={currentTime} 
          onExport={exportToJson}
          onImport={handleImport}
        />
      </div>

      <div className="flex flex-grow">
        {/* Left Side - Employee List */}
        <div className="w-1/4 bg-gray-100 flex flex-col">
          {/* Header with Team Filter Dropdown */}
          <div ref={teamFilterRef} className="flex items-center p-4 border-b relative space-x-4">
            {/* Team Filter Dropdown */}
            <div className="relative" id="team-dropdown">
              <button 
                onClick={toggleTeamDropdown}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center"
              >
                Filter 
                <svg 
                  className={`ml-2 h-4 w-4 transform transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isTeamDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {availableTeamsFromEmployees.map(team => (
                    <label 
                      key={team} 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <input 
                        type="checkbox"
                        checked={selectedTeams.includes(team)}
                        onChange={() => toggleTeamSelection(team)}
                        className="mr-2 form-checkbox"
                      />
                      {team}
                    </label>
                ))}
                </div>
              )}
            </div>

            {/* Selected Teams Display */}
            {selectedTeams.length > 0 && (
              <div className="flex flex-col items-start text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="mb-1">Selected:</span>
                  <button 
                    onClick={() => setSelectedTeams([])}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs mb-1"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedTeams.map(team => (
                    <span 
                      key={team} 
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                    >
                      {team}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Day Filter with ref */}
          <div ref={dayFilterRef} className="p-4 bg-gray-100">
            {[0, 1, 2].map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`mr-2 px-4 py-2 rounded ${
                  selectedDay === day 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                Day {day + 1} ({getDayDate(day)})
              </button>
            ))}
          </div>

          {/* Top 6 Squares - Employee Info Grid with ref */}
          <div ref={employeeInfoGridRef}>
            <EmployeeInfoGrid 
              employee={selectedEmployee} 
              currentTime={currentTime}
            />
          </div>

          {/* Employee List */}
          <div className="flex-grow overflow-hidden">
            <EmployeeList 
              employees={filteredEmployees}
              onSelectEmployee={handleSelectEmployee}
              selectedEmployee={selectedEmployee}
              selectedDay={selectedDay}
              employeeInfoGridRef={employeeInfoGridRef}
              dayFilterRef={dayFilterRef}
              teamFilterRef={teamFilterRef}
              statusBarRef={statusBarRef}
            />
          </div>
        </div>

        {/* Right Side - Time Table */}
        <div className="w-3/4 h-full overflow-hidden">
          <TimeTable 
            employee={selectedEmployee} 
            employees={employees}
            onUpdateShifts={handleUpdateShifts}
            currentTime={currentTime}
            selectedDay={selectedDay}
            locations={filteredLocations}
            selectedTeams={selectedTeams}
            availableLocations={availableLocations}
            onTeamSelectionChange={(location, teams) => {
              // If no specific location is selected, do nothing
              if (!location) return;
              
              // Update teams for the specific location
              handleLocationTeamChange(location, teams);
            }}
            onOpenAddLocationModal={() => 
              setAddLocationModal(prev => ({ ...prev, isOpen: true }))
            }
          />
        </div>
      </div>
      {renderAddLocationModal()}
    </div>
  );
}
