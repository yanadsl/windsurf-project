interface ConflictMessageProps {
  message: string | null;
}

export default function ConflictMessage({ message }: ConflictMessageProps) {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md shadow-lg z-50">
      {message}
    </div>
  );
}
