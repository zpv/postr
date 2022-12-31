import type { AppProps } from "next/app";

import { useState } from "react";
import "../App.css";
import "../style.css";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  const [peer, setPeer] = useState("");
  const [profiles, setProfiles] = useState({});
  const [message_list, setMessageList] = useState([]);
  const [listenFunc, setListenFunc] = useState(() => Promise.resolve());

  // only invoke getMessages every 30 seconds
  const [lastRefresh, setLastRefresh] = useState(Date.now() - 999_999);

  return (
    <Component
      {...pageProps}
      {...{
        peer,
        setPeer,
        profiles,
        setProfiles,
        lastRefresh,
        setLastRefresh,
        message_list,
        setMessageList,
        listenFunc,
        setListenFunc,
      }}
    />
  );
}
