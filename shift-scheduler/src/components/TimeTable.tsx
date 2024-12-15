import { useState, useMemo, useEffect, useRef } from 'react';
import ConflictMessage from './ConflictMessage';

// Import TEAMS and Location from page.tsx
import { TEAMS } from '@/app/page';

// Define Location type to match page.tsx
interface Location {
  name: string;
  teams: string[];
}

// Hardcode locations to match page.tsx
const availableLocations: Location[] = [
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

interface Employee {
  id: string;
  name: string;
  shifts: Array<{
    day: string;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  forbiddenHours: Array<{
    day: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }>;
}

interface TimeTableProps {
  employee: Employee | null;
  employees: Employee[];
  onUpdateShifts: (employee: Employee, timeSlot: string, location: string, isAdd: boolean) => void;
  currentTime: Date;
  selectedDay: number;
  locations?: string[]; // Optional prop for filtered locations
  selectedTeams: string[]; // Add selectedTeams prop
  onTeamSelectionChange: (location: string | null, teams: string[]) => void; // Update callback type
  availableLocations: Location[]; // Add availableLocations prop
  onOpenAddLocationModal: () => void; // Add prop to open add location modal
}

type ShiftMode = 'add' | 'remove';
type SelectionState = {
  isSelecting: boolean;
  startTimeSlot: string | null;
  currentTimeSlot: string | null;
  location: string | null;
  isAdding: boolean | null;
};

export default function TimeTable({ 
  employee, 
  employees, 
  onUpdateShifts, 
  currentTime,
  selectedDay,
  locations, // Destructure locations prop
  selectedTeams, // Destructure selectedTeams prop
  onTeamSelectionChange, // Destructure onTeamSelectionChange prop
  availableLocations, // Destructure availableLocations prop
  onOpenAddLocationModal // Destructure onOpenAddLocationModal prop
}: TimeTableProps) {
  const [shiftMode, setShiftMode] = useState<ShiftMode>('add');
  const [selection, setSelection] = useState<SelectionState>({
    isSelecting: false,
    startTimeSlot: null,
    currentTimeSlot: null,
    location: null,
    isAdding: null
  });
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // State to track window height
  const [maxHeight, setMaxHeight] = useState<number>(window.innerHeight - 105); // Reduce header/status bar height

  // Effect to update max height on window resize
  useEffect(() => {
    const handleResize = () => {
      // Adjust height dynamically, subtracting approximate header/status bar height
      setMaxHeight(window.innerHeight - 100);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const preventSelection = (e: MouseEvent) => {
      if (selection.isSelecting) {
        e.preventDefault();
      }
    };

    // Add event listeners to prevent text selection
    document.addEventListener('selectstart', preventSelection);
    
    // Cleanup listener
    return () => {
      document.removeEventListener('selectstart', preventSelection);
    };
  }, [selection.isSelecting]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Use passed locations or fallback to default locations
  const displayLocations = locations && locations.length > 0 
    ? locations 
    : availableLocations.map(loc => loc.name);

  // Helper function to get day number
  const getDayDate = (dayOffset: number) => {
    return `${dayOffset + 1}`; // Returns "1", "2", or "3"
  };

  // Helper function to parse time string into a comparable format
  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check if a time slot is forbidden for a specific employee
  const isForbiddenTime = (
    employee: Employee | null, 
    timeSlot: string, 
    currentDay: string
  ): boolean => {
    // If no employee is selected, no forbidden time
    if (!employee) return false;

    // Check if the employee has any forbidden hours
    return employee.forbiddenHours.some(forbidden => {
      // Check if the forbidden hours are for the same day
      if (forbidden.day !== currentDay) return false;

      const forbiddenStart = parseTime(forbidden.startTime);
      const forbiddenEnd = parseTime(forbidden.endTime);
      const slotTime = parseTime(timeSlot);

      // Check if the time slot falls within forbidden hours
      return (
        slotTime >= forbiddenStart && 
        slotTime < forbiddenEnd
      );
    });
  };

  const isTimeSlotInRange = (timeSlot: string) => {
    if (!selection.startTimeSlot || !selection.currentTimeSlot || !selection.location) return false;
    
    const allSlots = timeSlots;
    const startIdx = allSlots.indexOf(selection.startTimeSlot);
    const currentIdx = allSlots.indexOf(selection.currentTimeSlot);
    const slotIdx = allSlots.indexOf(timeSlot);
    
    const minIdx = Math.min(startIdx, currentIdx);
    const maxIdx = Math.max(startIdx, currentIdx);
    
    return slotIdx >= minIdx && slotIdx <= maxIdx;
  };

  const checkForConflicts = (timeSlot: string, location: string) => {
    if (!employee) return false;
    
    // Check if current employee has any shifts at this time (regardless of location)
    const existingShift = employee.shifts.find(shift => 
      shift.day === getDayDate(selectedDay) &&
      shift.startTime === timeSlot
    );

    if (existingShift) {
      setConflictMessage(`${employee.name} already has a shift at ${timeSlot} in ${existingShift.location}`);
      return true;
    }



    return false;
  };

  const getRowStyle = (timeSlot: string) => {
    if (!employee) return false;
    
    return employee.shifts.some(shift => 
      shift.day === getDayDate(selectedDay) &&
      shift.startTime === timeSlot
    );
  };

  const getCellStyle = (timeSlot: string, location: string) => {
    // Check if the current employee has a shift in this time slot and location
    const isScheduled = employee?.shifts.some(shift => 
      shift.day === getDayDate(selectedDay) && 
      shift.startTime === timeSlot && 
      shift.location === location
    );

    // Check if the time slot is forbidden
    const isForbidden = isForbiddenTime(
      employee, 
      timeSlot, 
      getDayDate(selectedDay)
    );

    // Determine cell style based on scheduling and forbidden status
    if (isForbidden) {
      return 'bg-red-100 opacity-100 cursor-not-allowed';
    }

    if (isScheduled) {
      return 'border p-2 bg-green-200';
    }

    const isSelected = selection.isSelecting && 
                      selection.location === location && 
                      isTimeSlotInRange(timeSlot);
    const isSelectionStart = selection.startTimeSlot === timeSlot && 
                            selection.location === location;

    let className = 'border p-2 select-none '; // Add select-none to prevent text selection

    if (isSelected) {
      className += 'bg-blue-300 hover:bg-blue-400 cursor-pointer ';
      if (isSelectionStart) className += 'ring-2 ring-blue-500 ring-inset';
    }
    else className += 'hover:bg-blue-100 cursor-pointer';

    return className;
  };

  // Handle mouse down with button type checking
  const handleMouseDown = (
    timeSlot: string, 
    location: string, 
    event: React.MouseEvent
  ) => {
    // Only react to left-click (button 0)
    if (event.button !== 0) return;

    // Prevent default selection behavior
    window.getSelection()?.removeAllRanges();

    if (!employee) return;
    
    const isScheduled = employee.shifts.some(shift => 
      shift.day === getDayDate(selectedDay) &&
      shift.startTime === timeSlot &&
      shift.location === location
    );
    const isForbidden = isForbiddenTime(employee, timeSlot, getDayDate(selectedDay));
    
    if (isForbidden) return;
    setSelection({
      isSelecting: true,
      startTimeSlot: timeSlot,
      currentTimeSlot: timeSlot,
      location: location,
      isAdding: !isScheduled
    });

    // Handle single click
    if (shiftMode === 'add' && !isScheduled) {
      if (!checkForConflicts(timeSlot, location)) {
        onUpdateShifts(employee, timeSlot, location, true);
      }
    } else if (shiftMode === 'remove' && isScheduled) {
      onUpdateShifts(employee, timeSlot, location, false);
    }
  };

  // Handle mouse enter with button type checking
  const handleMouseEnter = (
    timeSlot: string, 
    location: string, 
    event: React.MouseEvent
  ) => {
    // Only react to left-click (button 0)
    if (event.button !== 0) return;

    // Prevent default selection behavior
    window.getSelection()?.removeAllRanges();

    if (!selection.isSelecting) return;

    setSelection(prev => ({
      ...prev,
      currentTimeSlot: timeSlot,
      location: location
    }));

    // Get the range of time slots
    const timeSlots = getTimeSlotRange(selection.startTimeSlot!, timeSlot);
    
    // Process each time slot in the range
    timeSlots.forEach(slot => {
      if (shiftMode === 'add') {
        if (!isScheduledForTimeSlot(employee, slot, location) && !checkForConflicts(slot, location)) {
          onUpdateShifts(employee, slot, location, true);
        }
      } else {
        if (isScheduledForTimeSlot(employee, slot, location)) {
          onUpdateShifts(employee, slot, location, false);
        }
      }
    });
  };

  const handleMouseUp = () => {
    setSelection({
      isSelecting: false,
      startTimeSlot: null,
      currentTimeSlot: null,
      location: null,
      isAdding: null
    });
    setConflictMessage(null);
  };

  const getTimeSlotRange = (start: string, end: string) => {
    const startIndex = timeSlots.indexOf(start);
    const endIndex = timeSlots.indexOf(end);
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    return timeSlots.slice(minIndex, maxIndex + 1);
  };

  const isScheduledForTimeSlot = (emp: typeof employee, timeSlot: string, location: string) => {
    if (!emp) return false;
    return emp.shifts.some(shift => 
      shift.day === getDayDate(selectedDay) &&
      shift.startTime === timeSlot &&
      shift.location === location
    );
  };

  const getForbiddenReason = (timeSlot: string) => {
    if (!employee) return null;
    const forbidden = employee.forbiddenHours.find(forbidden => 
      forbidden.day === getDayDate(selectedDay) &&
      timeSlot >= forbidden.startTime && timeSlot < forbidden.endTime
    );
    return forbidden?.reason;
  };

  const getWorkingEmployees = (timeSlot: string, location: string) => {
    return employees.filter(emp => 
      emp.shifts.some(shift => 
        shift.day === getDayDate(selectedDay) &&
        shift.startTime === timeSlot &&
        shift.location === location
      )
    );
  };

  // Empty handlers for middle and right clicks
  const handleMiddleClick = (
    timeSlot: string, 
    location: string, 
    event: React.MouseEvent
  ) => {
    // Prevent default behavior
    event.preventDefault();
    // Do nothing for middle click
  };

  const handleRightClick = (
    timeSlot: string, 
    location: string, 
    event: React.MouseEvent
  ) => {
    // Prevent default context menu
    event.preventDefault();
    // Do nothing for right click
  };

  // State for tooltip
  const [tooltipInfo, setTooltipInfo] = useState<{
    show: boolean;
    x: number;
    y: number;
    reason: string;
  }>({
    show: false,
    x: 0,
    y: 0,
    reason: ''
  });

  // Render a tooltip for forbidden time reason
  const ForbiddenTimeTooltip = () => {
    if (!tooltipInfo.show) return null;

    return (
      <div 
        className="fixed z-50 bg-red-200 text-red-800 text-xs p-2 rounded shadow-lg 
        border border-red-300 pointer-events-none"
        style={{
          left: `${tooltipInfo.x + 10}px`,
          top: `${tooltipInfo.y + 10}px`
        }}
      >
        {tooltipInfo.reason}
      </div>
    );
  };

  // Mouse move handler for tooltip
  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltipInfo.show) {
      setTooltipInfo(prev => ({
        ...prev,
        x: event.clientX,
        y: event.clientY
      }));
    }
  };

  // Render shift mode and add location button
  const renderShiftModeControls = () => {
    return (
      <div className="flex items-center justify-between w-full">
        {/* Shift Mode Toggle */}
        <div className="flex items-center space-x-2">
          <span>Shift Mode:</span>
          <button
            onClick={() => setShiftMode(shiftMode === 'add' ? 'remove' : 'add')}
            className={`px-3 py-1 rounded ${
              shiftMode === 'add' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {shiftMode === 'add' ? 'Add' : 'Remove'}
          </button>
        </div>
        {/* Add Location Button */}
        <button
          onClick={onOpenAddLocationModal}
          className="px-3 py-1 rounded bg-blue-500 text-white"
        >
          Add Location
        </button>
      </div>
    );
  };

  // State for right-click scrolling
  const [rightClickScroll, setRightClickScroll] = useState({
    isScrolling: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0
  });

  // Ref for the scrollable container
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Handle right-click mouse down for scrolling
  const handleRightMouseDown = (e: React.MouseEvent) => {
    // Only handle right-click (button 2)
    if (e.button !== 2) return;

    e.preventDefault();

    if (tableContainerRef.current) {
      setRightClickScroll({
        isScrolling: true,
        startX: e.clientX - tableContainerRef.current.offsetLeft,
        startY: e.clientY - tableContainerRef.current.offsetTop,
        scrollLeft: tableContainerRef.current.scrollLeft,
        scrollTop: tableContainerRef.current.scrollTop
      });
    }
  };

  // Handle mouse move during right-click scroll
  const handleRightMouseMove = (e: React.MouseEvent) => {
    if (!rightClickScroll.isScrolling || !tableContainerRef.current) return;

    e.preventDefault();

    const x = e.clientX - tableContainerRef.current.offsetLeft;
    const y = e.clientY - tableContainerRef.current.offsetTop;

    const walkX = (x - rightClickScroll.startX) * 2; // Adjust scrolling speed
    const walkY = (y - rightClickScroll.startY) * 2;

    tableContainerRef.current.scrollLeft = rightClickScroll.scrollLeft - walkX;
    tableContainerRef.current.scrollTop = rightClickScroll.scrollTop - walkY;
  };

  // Handle mouse up to stop scrolling
  const handleRightMouseUp = (e: React.MouseEvent) => {
    if (e.button !== 2) return;
    setRightClickScroll(prev => ({ ...prev, isScrolling: false }));
  };

  // State for team selection dropdown
  const [teamSelectionDropdown, setTeamSelectionDropdown] = useState<{
    isOpen: boolean;
    location: string | null;
    selectedTeams: string[];
  }>({
    isOpen: false,
    location: null,
    selectedTeams: []
  });

  // Get teams for a specific location
  const getLocationTeams = (location: string) => {
    const locationObj = availableLocations.find(loc => loc.name === location);
    return locationObj ? locationObj.teams : [];
  };

  // Open team selection dropdown for a specific location
  const handleLocationClick = (location: string) => {
    // Get pre-selected teams for the location
    const locationTeams = getLocationTeams(location);

    // Open team selection dropdown
    setTeamSelectionDropdown({
      isOpen: true,
      location: location,
      selectedTeams: locationTeams
    });
  };

  // Toggle team selection
  const toggleTeamSelection = (team: string) => {
    setTeamSelectionDropdown(prev => ({
      ...prev,
      selectedTeams: prev.selectedTeams.includes(team)
        ? prev.selectedTeams.filter(t => t !== team)
        : [...prev.selectedTeams, team]
    }));
  };

  // Confirm team selection
  const confirmTeamSelection = () => {
    // You can add additional logic here if needed
    onTeamSelectionChange(teamSelectionDropdown.location, teamSelectionDropdown.selectedTeams);
    setTeamSelectionDropdown(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // Render team selection dropdown
  const renderTeamSelectionDropdown = () => {
    if (!teamSelectionDropdown.isOpen || !teamSelectionDropdown.location) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setTeamSelectionDropdown({ isOpen: false, location: null, selectedTeams: [] })}
      >
        <div 
          className="bg-white p-6 rounded-lg shadow-xl w-96"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">Select Teams for</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {teamSelectionDropdown.location}
            </span>
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {TEAMS.map(team => (
              <label 
                key={team} 
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input 
                  type="checkbox"
                  checked={teamSelectionDropdown.selectedTeams.includes(team)}
                  onChange={() => toggleTeamSelection(team)}
                  className="form-checkbox"
                />
                <span>{team}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button 
              onClick={() => setTeamSelectionDropdown({ isOpen: false, location: null, selectedTeams: [] })}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button 
              onClick={confirmTeamSelection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render location cell with team selection
  const renderLocationCell = (location: string, index: number) => {
    const isSelectedLocation = teamSelectionDropdown.location === location;
    const isAnyLocationSelected = !!teamSelectionDropdown.location;
    
    return (
      <div 
        key={location} 
        className={`px-2 py-1 text-center cursor-pointer ${
          isSelectedLocation 
            ? 'bg-blue-100 text-blue-800' 
            : isAnyLocationSelected
              ? 'bg-gray-200 text-gray-500 opacity-50' 
              : 'hover:bg-gray-100'
        }`}
        onClick={() => handleLocationClick(location)}
      >
        {location}
      </div>
    );
  };

  return (
    <div 
      className="h-full flex flex-col select-none" 
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <ConflictMessage message={conflictMessage} />
      <ForbiddenTimeTooltip />
      {renderTeamSelectionDropdown()}
      
      {/* Control Panel */}
      <div className=" justify-between items-center p-2 border-b">
        {/* Employee Selection */}
        <div className="flex-grow">
          {/* EmployeeSelector 
            employees={employees} 
            selectedEmployeeId={employee?.id} 
            onSelectEmployee={handleSelectEmployee} 
          /> */}
        </div>

        {/* Shift Mode Toggle Button */}
        {renderShiftModeControls()}
      </div>

      {/* Scrollable Table Container */}
      <div 
        ref={tableContainerRef}
        className="overflow-auto flex-grow"
        onMouseDown={handleRightMouseDown}
        onMouseMove={handleRightMouseMove}
        onMouseUp={handleRightMouseUp}
        onContextMenu={(e) => e.preventDefault()} // Prevent context menu
        style={{ maxHeight: `${maxHeight}px` }} // Restore original dynamic height
      >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-50 bg-white">
            <tr>
              <th className="border p-2 bg-gray-200 sticky top-0 left-0 z-20 min-w-[80px]">
                Time
              </th>
              {displayLocations.map((location, index) => (
                <th 
                  key={location} 
                  className="border p-2 bg-gray-200 sticky top-0 z-10 min-w-[150px] whitespace-nowrap"
                >
                  {renderLocationCell(location, index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(timeSlot => {
              const hasShifts = getRowStyle(timeSlot);
              return (
                <tr 
                  key={timeSlot} 
                  className={`${hasShifts ? 'bg-green-50' : 'bg-white'} hover:bg-gray-50 select-none`}
                >
                  <td 
                    className="border p-2 text-center sticky left-0 z-10 whitespace-nowrap relative select-none" 
                    style={{ backgroundColor: 'inherit' }}
                  >
                    {timeSlot}
                  </td>
                  {displayLocations.map(location => {
                    const cellStyle = getCellStyle(timeSlot, location);
                    const workingEmployees = getWorkingEmployees(timeSlot, location);
                    const isForbidden = isForbiddenTime(employee, timeSlot, getDayDate(selectedDay));
                    const forbiddenReason = getForbiddenReason(timeSlot);

                    return (
                      <td
                        key={`${timeSlot}-${location}`}
                        className={`${cellStyle} relative select-none`}
                        onMouseDown={(e) => handleMouseDown(timeSlot, location, e)}
                        onMouseEnter={(e) => {
                          handleMouseEnter(timeSlot, location, e);
                          
                          // Restore tooltip functionality for forbidden hours
                          if (isForbidden && forbiddenReason) {
                            setTooltipInfo({
                              show: true,
                              x: e.clientX,
                              y: e.clientY,
                              reason: forbiddenReason
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          // Hide tooltip when mouse leaves
                          setTooltipInfo(prev => ({ ...prev, show: false }));
                        }}
                        onMouseUp={handleMouseUp}
                        onAuxClick={(e) => {
                          // Handle middle and right clicks
                          if (e.button === 1) {
                            handleMiddleClick(timeSlot, location, e);
                          } else if (e.button === 2) {
                            handleRightClick(timeSlot, location, e);
                          }
                        }}
                        onContextMenu={(e) => e.preventDefault()} // Prevent context menu
                      >
                        {workingEmployees.map(emp => (
                          <div
                            key={emp.id}
                            className={`text-sm select-none ${emp.id === employee?.id ? 'font-bold text-blue-600' : ''}`}
                          >
                            {emp.name}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
