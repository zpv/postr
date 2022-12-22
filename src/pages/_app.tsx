import type { AppProps } from "next/app";

import "../style.css";
import "../App.css";
import { useState } from "react";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  const [peer, setPeer] = useState("");
  const [user, setUser] = useState("");
  return <Component {...pageProps} {...{user, setUser, peer, setPeer}} />;
}
