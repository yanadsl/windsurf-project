import React, { useRef } from 'react';

interface StatusBarProps {
  currentTime: Date;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function StatusBar({ 
  currentTime, 
  onExport, 
  onImport 
}: StatusBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-100 p-2 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Shift Scheduler</h1>

      {/* Import/Export Buttons */}
      <div className="flex items-center space-x-2">
        {/* Export Button */}
        <button 
          onClick={onExport}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Export Json
        </button>

        {/* Import Input */}
        <input 
          type="file" 
          ref={fileInputRef}
          accept=".json"
          onChange={onImport}
          className="hidden" 
        />
        <button
          onClick={triggerFileInput}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Import Json
        </button>
      </div>
    </div>
  );
}
