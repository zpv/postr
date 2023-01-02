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
  const icon = text_icon;
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
    console.log(new_relays);
    invoke("set_relays", {
      relays: new_relays,
    }).then(() => {
      setShowConfigRelaysModal(false);
    });
  };

  return (
    <>
      <div className="justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-2/3 my-10 mx-auto max-w-3xl">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative w-full bg-neutral-800 outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-start justify-between p-5 border-b border-solid border-neutral-700 rounded-t">
              <h3 className="text-3xl font-semibold">Configure Relays</h3>
              <img
                className={
                  "ml-3 mr-auto w-7 opacity-40 border p-1 border-neutral-700 rounded-sm cursor-pointer " +
                  (viewRaw
                    ? "bg-neutral-900 border-neutral-600"
                    : "opacity-100")
                }
                src={icon.src}
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
                }}></img>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-black opacity-30 float-right text-3xl leading-none font-semibold "
                onClick={() => setShowConfigRelaysModal(false)}>
                <span className="bg-transparent text-white h-6 w-6 text-2xl block">
                  ×
                </span>
              </button>
            </div>
            {/*body*/}
            <div>
              {viewRaw ? (
                <div className="relative p-6">
                  <textarea
                    className="border border-neutral-700 w-full bg-opacity-0 bg-neutral-700 px-3 py-1 text-gray-200 h-64 focus:placeholder-transparent"
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
              <div className="flex items-center justify-end p-2 border-t border-solid border-neutral-700 rounded-b">
                <button
                  className="text-gray-200 active:text-gray-500 font-medium px-3 pt-1 outline-none focus:outline-none mr-1 mb-1"
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
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
};

export default ConfigRelaysModal;
