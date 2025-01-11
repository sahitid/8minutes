import HeadObject from '../components/head';
import Nav from '../components/nav';

export default function Home() {
  return (
    <div className="font-radley dark:text-white dark:bg-black min-h-screen flex flex-col">
      <HeadObject />
      <Nav />
      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-8xl font-bold">8</h1>
        <p className="text-2xl mt-2">minutes</p>

        {/* Updated Slower Bouncing Arrow */}
        <div className="mt-8">
          <a href="#next-section" className="flex justify-center items-center animate-bounce-slow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-black dark:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>

        <div className="mt-10">
          <p className="text-2xl italic">"just 8 minutes with a friend to feel less</p>
          <p className="text-2xl font-bold">alone"</p>
        </div>

        <div className="mt-12">
          <button className="bg-transparent border border-black dark:border-white py-2 px-4 rounded text-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition">
            get started
          </button>
        </div>
        <div className="mt-4">
          <button className="text-sm underline">testimonials</button>
        </div>
      </main>
    </div>
  );
}
