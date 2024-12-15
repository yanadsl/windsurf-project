# Shift Scheduler

## Project Overview
A comprehensive web application for managing employee shifts, built with Next.js and TypeScript.

## Features
- Employee shift scheduling
- Dynamic time-based employee status tracking
- Intuitive user interface with grid-based layout

## Prerequisites
- Node.js (v18 or later)
- npm or yarn

## Setup Instructions
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure
- `src/app/`: Main application routes and layout
- `src/components/`: Reusable React components
  - `StatusBar.tsx`: Top navigation and action buttons
  - `EmployeeInfoGrid.tsx`: Employee details display
  - `EmployeeList.tsx`: List of employees by status
  - `TimeTable.tsx`: Shift scheduling grid

## Technologies
- Next.js 14
- TypeScript
- Tailwind CSS
- React Hooks

## Customization
Modify employee data and time references in `page.tsx`

## TODO
