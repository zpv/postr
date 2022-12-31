import { sha256 } from "@noble/hashes/sha256";
import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
import { useState } from "react";
import { Profile } from "../lib/types";

const relayUrls: string[] = [
  "wss://nostr-pub.wellorder.net",
  "wss://nostr-relay.untethr.me",
];

function App({ listenFunc, setListenFunc }) {
  const [privkey, setPrivkey] = useState<string>("");

  const router = useRouter();

  const launchApp = async (privkey: string) => {
    await invoke("set_privkey", { privkey });

    // invoke("sub_to_msg_events");
    setListenFunc(invoke("sub_to_msg_events"));

    router.push("/messages");
  };

  const default_privkey: string =
    "bb13681e0cd2f86d6a8d124fe051abf8a8a250a6d7357cb6b6e67a8640203ece";

  return (
    <div className="bg-neutral-900 w-full h-[100vh]">
      <h1 className="flex justify-center text-4xl pt-2 bg-neutral-800">
        debug menu
      </h1>

      <div className="flex flex-row px-5 pt-5">
        <input
          className="rounded-lg px-2 bg-slate-600"
          id="pubkeyinput"
          type="text"
          value={privkey}
          onChange={(e) => setPrivkey(e.target.value)}
          placeholder="Enter private key"
        />
        <h2
          className="px-4 mx-2 cursor-pointer bg-neutral-800 hover:bg-slate-700 rounded-md"
          onClick={(e) => {
            launchApp(privkey);
          }}>
          Launch
        </h2>
      </div>

      <div className="flex p-5">
        <h2
          className="rounded-lg px-2 bg-neutral-800 hover:bg-slate-700 cursor-pointer"
          onClick={(e) => {
            launchApp(default_privkey);
          }}>
          Launch with default private key
        </h2>
      </div>

      <div className="flex p-5">
        <h2
          className="rounded-lg px-2 bg-neutral-800 hover:bg-slate-700 cursor-pointer"
          onClick={(e) => {
            const random = Buffer.from(
              sha256(Math.random().toString())
            ).toString("hex");

            launchApp(random);
          }}>
          Launch with random private key
        </h2>
      </div>

      {/* <button onClick={greet}>test greet</button>
    <p>{JSON.stringify(greetMsg)}</p> */}
    </div>
  );
}

export default App;
