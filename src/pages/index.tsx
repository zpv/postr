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

function App() {
  const [greetMsg, setGreetMsg] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("user_profile", { pubkey: '6a0e6b709fb5239a3df637695764f153e56edccd48fa1c64916b8481d0ca3ab3' }));
  }

  const user = {
    public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
    icon: "https://avatars.githubusercontent.com/u/12267041?v=4",
    display_name: "",
  }

  return (
    <div className="container bg-neutral-900 w-full h-full">
    <button onClick={greet}>test</button>
    <Link href="/messages" >
      <h2>Lol</h2>
    </Link>
    <p>{JSON.stringify(greetMsg)}</p>
    </div>
  );
}

export default App;
