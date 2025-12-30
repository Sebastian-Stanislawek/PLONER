export function LoadingState({ message = 'Ładowanie...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        <p className="text-gray-500 mt-4">{message}</p>
      </div>
    </div>
  );
}


