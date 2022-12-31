import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";

const EditProfileModal = ({
  setShowModal,
  setProfiles,
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
    const privkey = e.target[0].value;
    invoke("set_privkey", { privkey }).then((res) => {
      invoke("unsub_from_msg_events").then(() => {
        console.log("unsubscribed from old private key");
        listenFunc.then(() => {
          setListenFunc(invoke("sub_to_msg_events"));
          console.log("listening on new private key");
          
          setPeer("");
          setMessageList([]);
          setLastRefresh(new Date(Date.now() - 999_999));
          formRef.current.reset();
          router.push("/profile");
          setShowModal(false);
        });
      });
    });
  };

  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-neutral-800 outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-start justify-between p-5 border-b border-solid border-neutral-700 rounded-t">
              <h3 className="text-3xl font-semibold">Import Private Key</h3>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-black opacity-30 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                onClick={() => setShowModal(false)}>
                <span className="bg-transparent text-white h-6 w-6 text-2xl block outline-none focus:outline-none">
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
                <input
                  type="text"
                  className="bg-neutral-700 rounded-sm py-1 px-2 text-neutral-200 my-3 w-[500px] placeholder-neutral-400 focus:placeholder-opacity-0"
                  placeholder="Private key"
                />
              </div>
              {/*footer*/}
              <div className="flex items-center justify-end p-2 border-t border-solid border-neutral-700 rounded-b">
                <button
                  className="text-gray-200 active:text-gray-500 background-transparent font-medium px-3 pt-1 outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  type="button"
                  onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="bg-indigo-800 text-white active:bg-indigo-900 font-medium px-3 py-1 rounded-sm"
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

export default EditProfileModal;
