import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import EditProfileModal from "../EditProfileModal";

const style =
  " text-neutral-500 focus:text-white bg-neutral-700 bg-opacity-20 rounded-sm px-2 py-1 w-full placeholder-neutral-500 focus:placeholder-opacity-0";

const EditProfile = ({
  user_profile,
  setProfiles,
  setLastRefresh,
  setPeer,
  setMessageList,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [initialProfileLoaded, setInitialProfileLoaded] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const router = useRouter();
  const formRef = useRef(null);
  const msgRef = useRef(null);

  useEffect(() => {
    msgRef.current.innerText = "";
    if (user_profile?.failed) {
      formRef.current[0].disabled = true;
      formRef.current[1].disabled = true;
      formRef.current[2].disabled = true;
      formRef.current[3].disabled = true;
      // show disabled pointer cursor
      formRef.current[0].classList.add("cursor-not-allowed");
      formRef.current[1].classList.add("cursor-not-allowed");
      formRef.current[2].classList.add("cursor-not-allowed");
      formRef.current[3].classList.add("cursor-not-allowed");

      msgRef.current.innerText =
        "Unable to load profile. (still loading or relay(s) down)";
      setInitialProfileLoaded(false);
    } else {
      formRef.current[0].disabled = false;
      formRef.current[1].disabled = false;
      formRef.current[2].disabled = false;
      formRef.current[3].disabled = false;
      // remove disabled pointer cursor
      formRef.current[0].classList.remove("cursor-not-allowed");
      formRef.current[1].classList.remove("cursor-not-allowed");
      formRef.current[2].classList.remove("cursor-not-allowed");
      formRef.current[3].classList.remove("cursor-not-allowed");

      setInitialProfileLoaded(true);
    }
  }, [user_profile]);

  useEffect(() => {
    if (user_profile?.pubkey) {
      //   formRef.current[0].value = user_profile?.name;
      //   formRef.current[1].value = user_profile?.about;
      //   formRef.current[2].value = user_profile?.nip05;
      //   formRef.current[3].value = user_profile?.picture;
    } else {
      invoke("user_profile", {
        pubkey: user_profile?.pubkey,
      })
        .then((res) => {
          setProfiles((prev) => {
            prev[user_profile?.pubkey] = res;
            return prev;
          });
          router.push("/profile");
        })
        .catch((err) => {
          const default_profile = {
            pubkey: user_profile?.pubkey,
            failed: true,
          };
          setProfiles((prev) => {
            prev[user_profile?.pubkey] = default_profile;
            return prev;
          });
        });
    }
  }, []);

  const handleRefresh = async (e) => {
    e.preventDefault();
    msgRef.current.innerText = "";

    invoke("user_profile", {
      pubkey: user_profile?.pubkey,
    })
      .then((res) => {
        setProfiles((prev) => {
          prev[user_profile?.pubkey] = res;
          return prev;
        });
        router.push("/profile");
      })
      .catch((err) => {
        setAttempts(attempts + 1);
        msgRef.current.innerText = `(${attempts}) Unable to load profile. (still loading or relay(s) down)`;
      });
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    const name = e.target[0].value;
    const about = e.target[1].value;
    const nip05 = e.target[2].value;
    const picture = e.target[3].value;
    const data = {
      name,
      about,
      nip05,
      picture,
    };
    invoke("set_user_info", { ...data }).then((res) => {
      setProfiles((prev) => {
        prev[user_profile?.pubkey] = { ...user_profile, ...data };
        console.log(prev[user_profile?.pubkey]);
        return prev;
      });
      router.push("/profile");
    });
  };

  const copyToClipboard = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(user_profile?.pubkey);
  };

  return (
    <>
      {showModal ? (
        <EditProfileModal
          {...{
            setShowModal,
            setProfiles,
            setLastRefresh,
            setPeer,
            setMessageList,
            formRef,
          }}
        />
      ) : null}

      <h1 className="text-2xl">Edit Profile</h1>
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          handleEditProfile(e);
        }}>
        <div className="grid grid-cols-2 gap-1 max-h-full pb-5 mb-4 border-b border-neutral-800">
          <div className="bg-neutral-800 pt-3 pb-5 px-4 rounded-tl-3xl rounded-bl-3xl bg-opacity-50">
            <h2>Display name:</h2>
            <input
              type="text"
              className={style}
              defaultValue={user_profile?.name || ""}
            />
            <h2 className="mt-5">About:</h2>
            <textarea
              className={"resize-none h-[131px]" + style}
              defaultValue={user_profile?.about || ""}
            />
            <h2 className="mt-[13px]">NIP-05 domain:</h2>
            <input
              type="text"
              className={style}
              defaultValue={user_profile?.nip05 || ""}
            />
          </div>
          <div className="bg-neutral-800 pt-3 pb-5 px-4 rounded-tr-3xl rounded-br-3xl bg-opacity-50">
            <h2>Image:</h2>
            <div className="bg-neutral-900 h-52 w-52 border-2 rounded-xl border-neutral-800">
              <img
                src={
                  user_profile?.picture ||
                  `https://robohash.org/${user_profile.pubkey}.png`
                }
                className="h-full w-full"
              />
            </div>

            <h2 className="mt-5">Image link:</h2>
            <input
              type="text"
              className={style}
              defaultValue={user_profile?.picture || ""}
            />
          </div>
          <div className="flex items-center col-span-2  ">
            {initialProfileLoaded && (
              <button
                type="submit"
                className="bg-indigo-800 rounded-sm px-3 py-1 font-medium text-white my-2 hover:ripple-bg-indigo-800 w-min">
                Save
              </button>
            )}
            {!initialProfileLoaded && (
              <button
                type="button"
                className="bg-neutral-900 border border-red-500 rounded-sm px-3 py-1 font-medium text-white my-2 hover:bg-red-500 transition duration-150 w-min"
                onClick={handleRefresh}>
                Retry
              </button>
            )}
            <p className="mx-3" ref={msgRef}></p>
          </div>
        </div>
      </form>
      <div className="mb-4">
        <h1 className="text-2xl">Account</h1>

        <div>
          <div className="bg-neutral-800 pt-3 pb-5 px-4 rounded-3xl bg-opacity-50">
            <h2>Public key:</h2>
            <div className="flex items-center">
              <input
                type="text"
                value={user_profile?.pubkey || ""}
                className={style}
                readOnly
              />
              <button
                onClick={copyToClipboard}
                className="bg-neutral-800 rounded-sm px-3 py-1 ml-1 font-medium text-white hover:ripple-bg-indigo-700">
                Copy
              </button>
            </div>
          </div>
          <div className="flex items-center my-2">
            <button
              className="bg-indigo-800 font-medium hover:bg-opacity-50 border border-opacity-0 border-indigo-800 transition duration-300 rounded-sm px-3 py-1 text-white mb-3 active:bg-neutral-800"
              onClick={() => setShowModal(true)}
              type="button">
              Import private key
            </button>
            <button
              className="bg-neutral-900 font-medium rounded-sm mx-2 px-3 py-1 border border-indigo-800 hover:border-opacity-0 text-white mb-3 transition duration-300 hover:bg-indigo-800 active:bg-neutral-800"
              type="button">
              Configure relays
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfile;
