import { sha256 } from "@noble/hashes/sha256";
import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import LoadingWheel from "../components/LoadingWheel";
import { randomPubkey } from "../helpers/nip19";

function App({ listenFunc, setListenFunc }) {
  const [privkey, setPrivkey] = useState<string>("");
  const router = useRouter();
  const debugPage = false;

  useEffect(() => {
    if (debugPage) return;
    invoke("set_privkey", { privkey: randomPubkey() }).then(() => {
      setListenFunc(invoke("sub_to_msg_events"));
    });
    router.push("/messages");
  }, []);

  const launchApp = async (privkey: string) => {
    await invoke("set_privkey", { privkey });
    setListenFunc(invoke("sub_to_msg_events"));

    router.push("/messages");
  };

  const default_privkey: string =
    "bb13681e0cd2f86d6a8d124fe051abf8a8a250a6d7357cb6b6e67a8640203ece";

  return debugPage ? (
    <div className="h-[100vh] w-full bg-neutral-900">
      <h1 className="flex justify-center bg-neutral-800 pt-2 text-4xl">
        debug menu
      </h1>

      <div className="flex flex-row px-5 pt-5">
        <input
          className="rounded-lg bg-slate-600 px-2 outline-none"
          id="pubkeyinput"
          type="text"
          value={privkey}
          onChange={(e) => setPrivkey(e.target.value)}
          placeholder="Enter private key"
        />
        <h2
          className="mx-2 cursor-pointer rounded-md bg-neutral-800 px-4 hover:bg-slate-700"
          onClick={(e) => {
            launchApp(privkey);
          }}
        >
          Launch
        </h2>
      </div>

      <div className="flex p-5">
        <h2
          className="cursor-pointer rounded-lg bg-neutral-800 px-2 hover:bg-slate-700"
          onClick={(e) => {
            launchApp(default_privkey);
          }}
        >
          Launch with default private key
        </h2>
      </div>

      <div className="flex p-5">
        <h2
          className="cursor-pointer rounded-lg bg-neutral-800 px-2 hover:bg-slate-700"
          onClick={(e) => {
            const random = Buffer.from(
              sha256(Math.random().toString())
            ).toString("hex");

            launchApp(random);
          }}
        >
          Launch with random private key
        </h2>
      </div>
    </div>
  ) : (
    <div className="my-auto flex h-[100vh] w-full justify-center bg-neutral-900">
      <LoadingWheel />
    </div>
  );
}

export default App;
