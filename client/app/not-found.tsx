export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-6xl font-bold text-yellow-400 mb-4">404</h2>
      <p className="text-2xl text-white mb-6">Page Not Found</p>
      <p className="text-gray-400 mb-8 max-w-md">
        Oops! The flight you're looking for seems to have been redirected or doesn't exist.
      </p>
      <a 
        href="/" 
        className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
      >
        Return to Homepage
      </a>
    </div>
  );
}
