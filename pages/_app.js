import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import { Provider } from "react-wrap-balancer";
import { SupabaseProvider } from "../lib/supabase/context";

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light">
      <Provider>
        <SupabaseProvider>
          <Component {...pageProps} />
        </SupabaseProvider>
      </Provider>
    </ThemeProvider>
  );
}

export default MyApp;
