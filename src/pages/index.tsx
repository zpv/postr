import { NostrProvider } from "@nostrgg/react";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import Navigation from "../components/Navigation";
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from "../layouts/Layout";

const relayUrls = [
  "wss://nostr-pub.wellorder.net",
  "wss://nostr-relay.untethr.me",
];

function App({peer, setPeer, user, setUser}) {
  const [greetMsg, setGreetMsg] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("user_profile", { pubkey: '6a0e6b709fb5239a3df637695764f153e56edccd48fa1c64916b8481d0ca3ab3' }));
  }

  // const user = {
  //   public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
  //   icon: "https://avatars.githubusercontent.com/u/12267041?v=4",
  //   display_name: "",
  // }

  // const initialState = {
  //   cli: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee"
  // }

  return (
    <div className="bg-neutral-900 w-full h-[100vh]">
    <h1 className="flex justify-center text-4xl pt-2 bg-neutral-800">debug menu</h1>

    <div className="flex flex-row px-5 pt-5">
    <input className="rounded-lg px-2 bg-slate-600" id="pubkeyinput" type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Enter public key"/>
    <Link href={"/messages?pubkey=" + user} >
      <h2 className="px-4 mx-2 cursor-pointer bg-neutral-800 hover:bg-slate-700 rounded-md">Launch</h2>
    </Link>
    </div>

    <div className="flex p-5">
    <Link href={"/messages?pubkey=6a0e6b709fb5239a3df637695764f153e56edccd48fa1c64916b8481d0ca3ab3"} >
      <h2 className="rounded-lg px-2 bg-neutral-800 hover:bg-slate-700 cursor-pointer">Launch with default key</h2>
    </Link>
    </div>

    {/* <button onClick={greet}>test greet</button>
    <p>{JSON.stringify(greetMsg)}</p> */}
    </div>
  );
}

export default App;
