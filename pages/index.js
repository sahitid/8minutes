import HeadObject from "../components/head";
import Nav from "../components/nav";
import { About } from "../components/aboutus";
import { ReactLenis, useLenis } from "lenis/dist/lenis-react";
import { HowItWorks } from "../components/howitworks";
export default function Home() {
  const lenis = useLenis();
  return (
    <ReactLenis root>
      <div className="font-radley dark:text-white dark:bg-black">
        <HeadObject />
        <Nav />
        <main className="flex w-full items-center justify-center h-screen space-x-[5vw]">
          <img src="/speechbubble.png" className="w-[30%] -translate-y-[20vh]" />
          <div className="text-center ">
            <span className="text-[14rem] font-bold leading-none">8</span>
            <p className="text-5xl">minutes</p>
            <div className="mt-12">
              <a href="/chat" className="max-w-xl border-2 border-black py-3 px-6 text-xl rounded hover:bg-black hover:text-white transition ease-in-out duration-300">
                get started
              </a>
            </div>

            <div className="w-full absolute bottom-5  left-0 flex justify-center">

              <a
                onClick={() => {
                  lenis?.scrollTo("#next-section");

                }}
                href="#next-section"
                className="flex items-center justify-center w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full transition hover:scale-105"
              >
                <svg

                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
            </div >
          </div>
          <img
            src="/speechbubble.png"
            className="w-[30%] scale-x-[-1] translate-y-[5vh]"
          />

        </main>



        <div id="about" className="w-full flex justify-center pb-[10vh]">
          <About />
        </div>
        <div id="how-it-works" className="w-full flex justify-center h-screen">
          <HowItWorks />
        </div>
      </div>

      <div>
        <p className="text-1xl items-center justify-center text-center mb-3">made with 🖤</p>
      </div>
    </ReactLenis>

  );
}





