import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import {
  SetBooleanState,
  SetConversationsListState,
  SetListenFuncState,
  SetNumberState,
  SetProfilesState,
  SetStringState,
} from "../../lib/types";

interface PrivKeyModalProps {
  setShowConfigRelaysModal: SetBooleanState;
  setLastRefresh: SetNumberState;
  setPeer: SetStringState;
  setMessageList: SetConversationsListState;
  setListenFunc: SetListenFuncState;
  listenFunc: Promise<void>;
}

const ConfigRelaysModal: React.FC<PrivKeyModalProps> = ({
  setShowConfigRelaysModal,
  setLastRefresh,
  setPeer,
  setMessageList,
  listenFunc,
  setListenFunc,
}) => {
  const inputRef = useRef(null);
  const router = useRouter();
  const [relays, setRelays] = useState<string[]>([]);

  useEffect(() => {
    // mock relays
    // setRelays([
    //   "wss://satstacker.cloud",
    //   "wss://relay.damus.io",
    //   "wss://relay.nostr.info",
    // ]);
    invoke("get_relays").then((res: string[]) => {
      setRelays(res);
    });
  }, []);

  const handleConfigRelays = (e) => {
    e.preventDefault();
    invoke("set_relays", {
      relays,
    }).then(() => {
      setShowConfigRelaysModal(false);
    });
  };

  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-2/3 my-6 mx-auto max-w-3xl">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-neutral-800 outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-start justify-between p-5 border-b border-solid border-neutral-700 rounded-t">
              <h3 className="text-3xl font-semibold">Configure Relays</h3>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-black opacity-30 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                onClick={() => setShowConfigRelaysModal(false)}>
                <span className="bg-transparent text-white h-6 w-6 text-2xl block outline-none focus:outline-none">
                  ×
                </span>
              </button>
            </div>
            {/*body*/}
            {/* <form
              onSubmit={(e) => {
                e.preventDefault();
                // handleConfigRelays(e);
              }}
              key="config-relays-form"
              > */}
            <div>
              <div className="relative p-6 flex-auto">
                {/* <p className="my-4 text-gray-500 text-lg leading-relaxed">
                  Add or remove relays.
                </p> */}

                <div className="flex flex-col">
                  <label className="leading-loose">Relays</label>
                  <div className="flex flex-col">
                    {relays.map((relay, i) => (
                      <div className="flex flex-row items-center" key={relay}>
                        <input
                          type="text"
                          className="border border-neutral-700 w-full bg-opacity-0 bg-neutral-700 rounded-tl-full rounded-bl-full px-3 py-1 mr-1 mb-1 text-gray-200"
                          placeholder="Relay"
                          readOnly
                          defaultValue={relay}
                        />
                        <button
                          className="border-red-600 border text-white hover:bg-red-600 active:bg-opacity-70 transition font-medium px-3 py-1 mb-1 w-9"
                          type="button"
                          onClick={() => {
                            const newRelays = [...relays];
                            newRelays.splice(i, 1);
                            setRelays(newRelays);
                          }}>
                          -
                        </button>
                      </div>
                    ))}

                    {/* <div
                      className="flex flex-row items-center justify-between"
                      key="add-relay">
                      <input
                        type="text"
                        className="border border-neutral-700 w-full bg-opacity-0 bg-neutral-700 rounded-tl-full rounded-bl-full px-3 py-1 mr-1 mb-1 text-gray-200 placeholder-neutral-400 focus:placeholder-opacity-0"
                        placeholder="Enter a relay you want to add"
                        ref={inputRef}
                      />
                      <button
                        className="border-green-600 border text-white hover:bg-green-600 active:bg-opacity-70 font-medium px-3 py-1 mb-1 w-9"
                        type="button"
                        onClick={() => {
                          const newRelays = [...relays];
                          if (
                            inputRef.current.value === "" ||
                            newRelays.includes(inputRef.current.value)
                          )
                            return;

                          newRelays.push(inputRef.current.value);
                          inputRef.current.value = "";
                          setRelays(newRelays);
                        }}>
                        +
                      </button>
                    </div> */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const value: string = inputRef.current.value
                          .trim()
                          .toLowerCase();
                        inputRef.current.value = "";
                        const newRelays = relays.map((relay) =>
                          relay.toLowerCase()
                        );

                        if (value === "" || newRelays.includes(value)) return;

                        newRelays.push(value);
                        setRelays(newRelays);
                      }}
                      key="add-relay-form">
                      <div
                        className="flex flex-row items-center justify-between"
                        key="add-relay">
                        <input
                          type="text"
                          className="border border-neutral-700 w-full bg-opacity-0 bg-neutral-700 rounded-tl-full rounded-bl-full px-3 py-1 mr-1 mb-1 text-gray-200 placeholder-neutral-400 focus:placeholder-opacity-0"
                          placeholder="Enter a relay you want to add"
                          autoComplete="off"
                          autoFocus={true}
                          ref={inputRef}
                        />
                        <button
                          className="border-green-600 border text-white hover:bg-green-600 active:bg-opacity-70 font-medium px-3 py-1 mb-1 w-9"
                          type="submit"
                          key="add-relay-button">
                          +
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              {/*footer*/}
              <div className="flex items-center justify-end p-2 border-t border-solid border-neutral-700 rounded-b">
                <button
                  className="text-gray-200 active:text-gray-500 background-transparent font-medium px-3 pt-1 outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  type="button"
                  onClick={() => setShowConfigRelaysModal(false)}>
                  Cancel
                </button>
                <button
                  className="bg-indigo-800 text-white hover:bg-opacity-70 active:bg-opacity-40 font-medium px-3 py-1 rounded-sm"
                  type="button"
                  onClick={handleConfigRelays}
                  key="config-relays-button">
                  Save
                </button>
              </div>
              {/* </form> */}
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
};

export default ConfigRelaysModal;
