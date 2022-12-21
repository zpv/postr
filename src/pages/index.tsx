import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Image from "next/image";
import reactLogo from "../assets/react.svg";
import tauriLogo from "../assets/tauri.svg";
import nextLogo from "../assets/next.svg";
import { NostrProvider } from "@nostrgg/react";
import ProfileFeed from "../components/ProfileFeed";
import Navigation from "../components/Navigation";

const relayUrls = [
  "wss://nostr-pub.wellorder.net",
  "wss://nostr-relay.untethr.me",
];

const test = {
  public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
  icon: "https://avatars.githubusercontent.com/u/12267041?v=4",
  display_name: "",
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <NostrProvider relayUrls={relayUrls} debug> 
      <div className="container bg-neutral-900 w-full h-[100vh]">
        <div className="grid grid-cols-[175px_200px_minmax(900px,_1fr)] h-full">
          <Navigation {...test}/>
          <div className="bg-black">
            <p>sample text</p>
          </div>
          <div>
            <ProfileFeed />
          </div>
        </div>
      </div>
    </NostrProvider>
  );
}

export default App;
