import Nav from "../../components/nav";

export default function Chat() {
  return (
    <div className="font-radley dark:text-white dark:bg-black">
      <Nav />

      <main className="flex w-full items-center justify-center h-screen">
        <div className="w-full max-w-xl bg-white dark:bg-black border-2 border-black dark:border-white p-8 rounded-md shadow">
          <h2 className="text-lg text-center mb-4">
            send a message to start your conversation:
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log(e.target.message.value);
            }}
            className="space-y-4"
          >
            <textarea
              name="message"
              className="w-full border border-black px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-black dark:text-white dark:border-white"
              rows="4"
              required
            ></textarea>
            <div className="text-center">
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-300 transition"
              >
                chat
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="mt-12">
        <p className="text-1xl items-center justify-center text-center mb-3">
          made with 🖤
        </p>
      </footer>
    </div>
  );
}
