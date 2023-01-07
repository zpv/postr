import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
import { useRef } from "react";
import { randomPubkey } from "../../helpers/nip19";
import {
  SetBooleanState,
  SetConversationsListState,
  SetListenFuncState,
  SetNumberState,
  SetProfilesState,
  SetStringState,
} from "../../lib/types";

interface PrivKeyModalProps {
  setShowPrivKeyModal: SetBooleanState;
  setLastRefresh: SetNumberState;
  setPeer: SetStringState;
  setMessageList: SetConversationsListState;
  setListenFunc: SetListenFuncState;
  listenFunc: Promise<void>;
  formRef: any;
}

const PrivKeyModal: React.FC<PrivKeyModalProps> = ({
  setShowPrivKeyModal,
  setLastRefresh,
  setPeer,
  setMessageList,
  formRef,
  listenFunc,
  setListenFunc,
}) => {
  const router = useRouter();
  const inputRef = useRef(null);
  const msgRef = useRef(null);
  const numAttempts = useRef(0);

  const handleRandomPrivkey = (e) => {
    e.preventDefault();
    const privkey = randomPubkey();
    inputRef.current.value = privkey;
  };

  const handleImportPrivkey = (e) => {
    e.preventDefault();
    const privkey: string = e.target[0].value.trim();

    invoke("set_privkey", { privkey })
      .then((res) => {
        invoke("unsub_from_msg_events").then(() => {
          console.log("unsubscribed from old private key");
          listenFunc.then(() => {
            setListenFunc(invoke("sub_to_msg_events"));
            console.log("listening on new private key");

            setPeer("");
            setMessageList([]);
            setLastRefresh(Date.now() - 999_999);
            formRef.current.reset();
            router.push("/profile");
            setShowPrivKeyModal(false);
          });
        });
      })
      .catch((err) => {
        msgRef.current.innerText =
          "Invalid private key format" +
          (numAttempts.current > 0 ? ` (${numAttempts.current})` : "");
        numAttempts.current++;
      });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden">
        <div className="relative my-6 mx-auto w-auto max-w-3xl">
          {/*content*/}
          <div className="relative flex w-full flex-col rounded-lg border-0 bg-neutral-800 shadow-lg">
            {/*header*/}
            <div className="flex items-start justify-between rounded-t border-b border-solid border-neutral-700 p-5">
              <h3 className="text-3xl font-semibold">Import Private Key</h3>
              <button
                className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-30"
                onClick={() => setShowPrivKeyModal(false)}
              >
                <span className="block h-6 w-6 bg-transparent text-2xl text-white">
                  ×
                </span>
              </button>
            </div>
            {/*body*/}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleImportPrivkey(e);
              }}
            >
              <div className="relative flex-auto py-3 px-5">
                <p>
                  Enter the private key you want to import. This will replace
                  your current private key.
                </p>
                <input
                  type="text"
                  className="my-3 w-full border border-neutral-700 bg-neutral-700 bg-opacity-0 py-1 px-2 text-neutral-200 outline-none focus:placeholder-transparent"
                  placeholder="Private key..."
                  autoFocus={true}
                  ref={inputRef}
                />
                <p ref={msgRef} className="text-red-500"></p>
              </div>
              {/*footer*/}
              <div className="flex items-center justify-end rounded-b border-t border-solid border-neutral-700 p-2">
                <button
                  className="background-transparent mr-auto mb-1 px-3 pt-1 text-gray-200 outline-none hover:underline focus:outline-none active:text-gray-500"
                  type="button"
                  onClick={(e) => handleRandomPrivkey(e)}
                >
                  Generate a random one
                </button>
                <button
                  className="background-transparent mr-1 mb-1 px-3 pt-1 text-gray-200 outline-none hover:underline focus:outline-none active:text-gray-500"
                  type="button"
                  onClick={() => setShowPrivKeyModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-sm bg-indigo-800 px-3 py-1 font-medium text-white hover:bg-opacity-70 active:bg-opacity-40"
                  type="submit"
                >
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
    </>
  );
};

export default PrivKeyModal;
