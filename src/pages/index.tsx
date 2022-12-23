import { invoke } from "@tauri-apps/api/tauri";
import Link from "next/link";
import { useState } from "react";

const relayUrls = [
  "wss://nostr-pub.wellorder.net",
  "wss://nostr-relay.untethr.me",
];

function App({ peer, setPeer, user, setUser }) {
  const [greetMsg, setGreetMsg] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(
      await invoke("user_profile", {
        pubkey:
          "6a0e6b709fb5239a3df637695764f153e56edccd48fa1c64916b8481d0ca3ab3",
      })
    );
  }

  // const user = {
  //   public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
  //   icon: "https://avatars.githubusercontent.com/u/12267041?v=4",
  //   display_name: "",
  // }

  // const initialState = {
  //   cli: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee"
  // }

  const privkey =
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
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Enter private key"
        />
        <Link href={"/messages?privkey=" + user}>
          <h2
            className="px-4 mx-2 cursor-pointer bg-neutral-800 hover:bg-slate-700 rounded-md"
            onClick={(e) =>
              invoke("sub_to_msg_events", {
                privkey: user,
              })
            }
          >
            Launch
          </h2>
        </Link>
      </div>

      <div className="flex p-5">
        <Link href={`/messages?privkey=${privkey}`}>
          <h2
            className="rounded-lg px-2 bg-neutral-800 hover:bg-slate-700 cursor-pointer"
            onClick={(e) => setUser(privkey)}
          >
            Launch with default private key
          </h2>
        </Link>
      </div>

      {/* <button onClick={greet}>test greet</button>
    <p>{JSON.stringify(greetMsg)}</p> */}
    </div>
  );
}

export default App;
