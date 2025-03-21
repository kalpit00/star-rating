import RatingListContainer from "../components/RatingListContainer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-900">
      <header className="mt-8 mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
          Star Rating System
        </h1>
        <p className="text-md mt-4 text-gray-600 dark:text-gray-300">
          A virtualized list of rating components with infinite scrolling
        </p>
      </header>

      <main className="w-full max-w-5xl mx-auto">
        <RatingListContainer />
      </main>

      <footer className="mt-8 text-center text-gray-500 dark:text-gray-400 text-xs">
        <p>Built with Next.js, Tailwind CSS, and React</p>
      </footer>
    </div>
  );
}
