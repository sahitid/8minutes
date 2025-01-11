import HeadObject from '../components/head';
import Nav from '../components/nav';

export default function Home() {
  return (
    <div className="font-radley dark:text-white dark:bg-black min-h-screen flex flex-col">
      <HeadObject />
      <Nav />
      <main className="flex-1 flex flex-col items-center justify-center text-center min-h-screen">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-9xl font-bold">8</h1>
          <p className="text-4xl mt-2">minutes</p>
          <div className="mt-12">
            <button className="bg-transparent border border-black dark:border-white py-2 px-4 rounded text-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition">
              get started
            </button>
          </div>

          <div className="mt-8">
            <a
              href="#next-section"
              className="flex items-center justify-center w-6 h-6 bg-black dark:bg-white text-white dark:text-black rounded-full transition hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </a>
          </div>
        </div>

        <div id="next-section" className="mt-10">
          <p className="text-3xl italic">"just 8 minutes with</p>
          <p className="text-3xl italic">a friend to feel less</p>
          <p className="text-5xl font-bold">alone"</p>
        </div>
      </main>
    </div>
  );
}
