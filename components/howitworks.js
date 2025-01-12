export const HowItWorks = () => {
    return (
      <div className="font-radley  items-center px-4 sm:px-8 mt-12">
        <h2 className="text-4xl font-bold mb-12 text-center">how it works</h2>
        <div className="border-2 border-black rounded-lg p-8 space-y-16">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-black text-white text-xl font-bold rounded-full mr-6">
              <p>1</p>
            </div>
            <p className="text-2xl max-w-xl">
              fill out a quick 1-minute survey about what you're looking for in a conversation.
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-black text-white text-xl font-bold rounded-full mr-6">
              <p>2</p>
            </div>
            <p className="text-2xl max-w-xl">
              get matched with a stranger & talk about anything. it’s your moment to connect and share—for 8 minutes.
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-black text-white text-xl font-bold rounded-full mr-6">
              <p>3</p>
            </div>
            <button className="max-w-xl border-2 border-black py-3 px-6 text-xl rounded hover:bg-black hover:text-white transition ease-in-out duration-300">
              get started
            </button>
          </div>
        </div>
      </div>
    );
  };
  