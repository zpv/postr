import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
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

  const handleImportPrivkey = (e) => {
    e.preventDefault();
    const privkey: string = e.target[0].value.trim();

    // if (privkey.length !== 64 || privkey.match(/^[0-9A-Fa-f]+$/i) === null) {
    //   e.target[0].value = "Invalid private key";
    //   return;
    // }

    invoke("set_privkey", { privkey }).then((res) => {
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
    });
  };

  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-neutral-800">
            {/*header*/}
            <div className="flex items-start justify-between p-5 border-b border-solid border-neutral-700 rounded-t">
              <h3 className="text-3xl font-semibold">Import Private Key</h3>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-black opacity-30 float-right text-3xl leading-none font-semibold"
                onClick={() => setShowPrivKeyModal(false)}>
                <span className="bg-transparent text-white h-6 w-6 text-2xl block">
                  ×
                </span>
              </button>
            </div>
            {/*body*/}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleImportPrivkey(e);
              }}>
              <div className="relative py-3 px-5 flex-auto">
                <p>
                  Enter the private key you want to import. This will replace
                  your current private key.
                </p>
                <input
                  type="text"
                  className="border border-neutral-700 bg-opacity-0 bg-neutral-700 py-1 px-2 text-neutral-200 my-3 w-[500px] focus:placeholder-transparent"
                  placeholder="Private key..."
                  autoFocus={true}
                />
              </div>
              {/*footer*/}
              <div className="flex items-center justify-end p-2 border-t border-solid border-neutral-700 rounded-b">
                <button
                  className="text-gray-200 active:text-gray-500 background-transparent font-medium px-3 pt-1 outline-none focus:outline-none mr-1 mb-1"
                  type="button"
                  onClick={() => setShowPrivKeyModal(false)}>
                  Cancel
                </button>
                <button
                  className="bg-indigo-800 text-white hover:bg-opacity-70 active:bg-opacity-40 font-medium px-3 py-1 rounded-sm"
                  type="submit">
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
};

export default PrivKeyModal;
