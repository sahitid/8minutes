import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import { Provider } from "react-wrap-balancer";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <Provider>
        <ClerkProvider>

          <Component {...pageProps} />
        </ClerkProvider>
      </Provider>
    </ThemeProvider>
  );
}

export default MyApp;
