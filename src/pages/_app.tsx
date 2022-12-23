import type { AppProps } from "next/app";

import { useState } from "react";
import "../App.css";
import "../style.css";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  const [peer, setPeer] = useState("");

  return <Component {...pageProps} {...{ peer, setPeer }} />;
}
