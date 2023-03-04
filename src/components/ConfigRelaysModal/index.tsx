import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useRef, useState } from "react";
import text_icon from "../../assets/toggle_text.png";
import { SetBooleanState } from "../../lib/types";
import RelaysList from "../RelaysList";

interface PrivKeyModalProps {
  setShowConfigRelaysModal: SetBooleanState;
}

const ConfigRelaysModal: React.FC<PrivKeyModalProps> = ({
  setShowConfigRelaysModal,
}) => {
  const inputRef = useRef(null);
  const textAreaRef = useRef(null);
  const [relays, setRelays] = useState<string[]>([]);
  const [viewRaw, setViewRaw] = useState<boolean>(false);

  useEffect(() => {
    invoke("get_relays").then((res: string[]) => {
      setRelays(res);
    });
  }, []);

  const handleConfigRelays = (e) => {
    e.preventDefault();
    let new_relays: string[] = relays;
    if (viewRaw) {
      new_relays = textAreaRef.current.value
        .toLowerCase()
        .split(/[\n,]/)
        .map((r: string) => r.trim())
        .filter((r: string) => r.length > 0)
        .map((r: string) => r.replace(" ", "-"));
    }
    invoke("set_relays", {
      relays: new_relays,
    }).then(() => {
      setShowConfigRelaysModal(false);
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
        <div className="relative my-10 mx-auto w-auto max-w-3xl">
          {/*content*/}
          <div className="relative w-full rounded-lg border-0 bg-neutral-800 shadow-lg outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-start justify-between rounded-t border-b border-solid border-neutral-700 p-5">
              <h3 className="text-3xl font-semibold">Configure Relays</h3>
              <img
                className={
                  "ml-3 mr-auto w-7 cursor-pointer rounded-sm border border-neutral-700 p-1 opacity-40 " +
                  (viewRaw
                    ? "border-neutral-600 bg-neutral-900"
                    : "opacity-100")
                }
                src={text_icon.src}
                onClick={() => {
                  if (viewRaw) {
                    const newRelays = textAreaRef.current.value
                      .toLowerCase()
                      .split(/[\n,]/)
                      .map((r: string) => r.trim())
                      .filter((r: string) => r.length > 0)
                      .map((r: string) => r.replace(" ", "-"));
                    setRelays(newRelays);
                  }
                  setViewRaw(!viewRaw);
                }}
              ></img>
              <button
                className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-30 "
                onClick={() => setShowConfigRelaysModal(false)}
              >
                <span className="block h-6 w-6 bg-transparent text-2xl text-white">
                  ×
                </span>
              </button>
            </div>
            {/*body*/}
            <div>
              {viewRaw ? (
                <div className="relative p-6">
                  <textarea
                    className="h-64 w-full border border-neutral-700 bg-neutral-700 bg-opacity-0 px-3 py-1 text-gray-200 outline-none focus:placeholder-transparent"
                    placeholder="Enter relays, one per line or comma separated..."
                    defaultValue={relays.join(",\n")}
                    autoFocus={true}
                    ref={textAreaRef}
                  />
                </div>
              ) : (
                <RelaysList {...{ relays, setRelays, inputRef }} />
              )}
              {/*footer*/}
              <div className="flex items-center justify-end rounded-b border-t border-solid border-neutral-700 p-2">
                <button
                  className="mr-1 mb-1 px-3 pt-1 text-gray-200 outline-none hover:underline focus:outline-none active:text-gray-500"
                  type="button"
                  onClick={() => setShowConfigRelaysModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-sm bg-indigo-800 px-3 py-1 font-medium text-white hover:bg-opacity-70 active:bg-opacity-40"
                  type="button"
                  onClick={handleConfigRelays}
                  key="config-relays-button"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
    </>
  );
};

export default ConfigRelaysModal;
