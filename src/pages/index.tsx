import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
import { useState } from "react";

const relayUrls = [
  "wss://nostr-pub.wellorder.net",
  "wss://nostr-relay.untethr.me",
];

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [privkey, setPrivkey] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(
      await invoke("user_profile", {
        pubkey:
          "6a0e6b709fb5239a3df637695764f153e56edccd48fa1c64916b8481d0ca3ab3",
      })
    );
  }

  const router = useRouter();

  const launchApp = async (privkey: string) => {
    await invoke("set_privkey", { privkey });
    invoke("sub_to_msg_events");

    router.push("/messages");
  };

  // const user = {
  //   public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
  //   icon: "https://avatars.githubusercontent.com/u/12267041?v=4",
  //   display_name: "",
  // }

  // const initialState = {
  //   cli: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee"
  // }

  const default_privkey =
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
          }}
        >
          Launch
        </h2>
      </div>

      <div className="flex p-5">
        <h2
          className="rounded-lg px-2 bg-neutral-800 hover:bg-slate-700 cursor-pointer"
          onClick={(e) => {
            launchApp(default_privkey);
          }}
        >
          Launch with default private key
        </h2>
      </div>

      {/* <button onClick={greet}>test greet</button>
    <p>{JSON.stringify(greetMsg)}</p> */}
    </div>
  );
}

export default App;
