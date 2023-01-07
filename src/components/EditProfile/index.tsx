import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { fromNpub, toNpub, toNsec } from "../../helpers/nip19";
import {
  Profile,
  Profiles,
  SetConversationsListState,
  SetListenFuncState,
  SetNumberState,
  SetProfilesState,
} from "../../lib/types";
import ConfigRelaysModal from "../ConfigRelaysModal";
import PrivKeyModal from "../PrivKeyModal";

const style =
  " text-neutral-400 focus:text-white bg-neutral-700 bg-opacity-20 rounded-sm px-2 py-1 w-full outline-none";

interface EditProfileProps {
  user_profile: Profile;
  setProfiles: SetProfilesState;
  setLastRefresh: SetNumberState;
  setPeer: (peer: string) => void;
  setMessageList: SetConversationsListState;
  setListenFunc: SetListenFuncState;
  listenFunc: Promise<void>;
}

const EditProfile: React.FC<EditProfileProps> = ({
  user_profile,
  setProfiles,
  setLastRefresh,
  setPeer,
  setMessageList,
  setListenFunc,
  listenFunc,
}) => {
  const [showPrivKeyModal, setShowPrivKeyModal] = useState<boolean>(false);
  const [showConfigRelaysModal, setShowConfigRelaysModal] =
    useState<boolean>(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState<boolean>(false);
  const attempts = useRef(1);
  const [changesMade, setChangesMade] = useState<boolean>(false);
  const [privkey, setPrivkey] = useState<string>("");
  const router = useRouter();
  const formRef = useRef(null);
  const privkeyRef = useRef(null);
  const msgRef = useRef(null);

  useEffect(() => {
    setPrivkey("");
    attempts.current = 1;
    msgRef.current.innerText = "";
    if (user_profile?.failed) {
      // formRef.current[0].disabled = true;
      // formRef.current[1].disabled = true;
      // formRef.current[2].disabled = true;
      // formRef.current[3].disabled = true;
      // // show disabled pointer cursor
      // formRef.current[0].classList.add("cursor-not-allowed");
      // formRef.current[1].classList.add("cursor-not-allowed");
      // formRef.current[2].classList.add("cursor-not-allowed");
      // formRef.current[3].classList.add("cursor-not-allowed");

      msgRef.current.innerText =
        "Unable to load profile. (no record on current relay(s) or still loading)";
      setIsProfileLoaded(false);
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

      setIsProfileLoaded(true);
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
          setProfiles((prev: Profiles) => {
            prev[user_profile?.pubkey] = res;
            return prev;
          });
          // router.push("/profile");
        })
        .catch((err) => {
          const default_profile: Profile = {
            pubkey: user_profile?.pubkey,
            failed: true,
          };
          setProfiles((prev: Profiles) => {
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
        setProfiles((prev: Profiles) => {
          prev[user_profile?.pubkey] = res;
          return prev;
        });
        router.push("/profile");
      })
      .catch((err) => {
        msgRef.current.innerText = `(${attempts.current}) Unable to load profile. (no record on current relay(s) or still loading)`;
        attempts.current += 1;
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
      setProfiles((prev: Profiles) => {
        prev[user_profile?.pubkey] = { ...user_profile, ...data };
        return prev;
      });
      router.push("/profile");
      // msgRef.current.innerText = "Profile updated!";
      setChangesMade(false);
    });
  };

  const handleShowPrivKey = () => {
    invoke("get_privkey").then((res: string) => {
      setPrivkey(res);
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {showPrivKeyModal ? (
        <PrivKeyModal
          {...{
            setShowPrivKeyModal,
            setLastRefresh,
            setPeer,
            setMessageList,
            formRef,
            setListenFunc,
            listenFunc,
          }}
        />
      ) : null}

      {showConfigRelaysModal ? (
        <ConfigRelaysModal
          {...{
            setShowConfigRelaysModal,
          }}
        />
      ) : null}

      <h1 className="text-2xl">Edit Profile</h1>
      <form
        ref={formRef}
        onChange={(e) => {
          e.preventDefault();
          setChangesMade(true);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          handleEditProfile(e);
        }}
      >
        <div className="mb-4 max-h-full grid-cols-2 gap-1 border-b border-neutral-800 pb-5 xs:grid">
          <div className="rounded-tl-xl rounded-tr-xl bg-neutral-800 bg-opacity-50 px-4 pt-3 pb-5 xs:rounded-bl-xl xs:rounded-tr-none">
            <h2>Display name:</h2>
            <input
              type="text"
              className={style}
              defaultValue={user_profile?.name || ""}
            />
            <h2 className="mt-5">About:</h2>
            <textarea
              className={"h-[131px] resize-none" + style}
              defaultValue={user_profile?.about || ""}
            />
            <h2 className="mt-[13px]">NIP-05 domain:</h2>
            <input
              type="text"
              className={style}
              defaultValue={user_profile?.nip05 || ""}
            />
          </div>
          <div className="rounded-br-xl rounded-bl-xl bg-neutral-800 bg-opacity-50 px-4 pb-5 xs:rounded-tr-xl xs:rounded-bl-none xs:pt-3 ">
            <h2>Image:</h2>
            <div className="h-52 w-52 rounded-xl border-2 border-neutral-800 bg-neutral-900">
              <img
                src={
                  user_profile?.picture ||
                  `https://robohash.org/${user_profile.pubkey}.png`
                }
                className="h-full w-full flex-shrink-0 object-contain"
              />
            </div>

            <h2 className="mt-5">Image link:</h2>
            <input
              type="text"
              className={style}
              defaultValue={user_profile?.picture || ""}
            />
          </div>
          <div className="col-span-2 flex items-center">
            {!isProfileLoaded && (
              <button
                type="button"
                className="my-2 w-min rounded-sm border border-red-500 bg-neutral-900 px-4 py-2 font-medium text-white transition duration-150 hover:bg-red-500"
                onClick={handleRefresh}
              >
                Retry
              </button>
            )}
            <p className="mx-3 mt-1" ref={msgRef}></p>
            <button
              type="submit"
              className={
                "my-2 ml-auto w-min rounded-sm px-4 py-2 font-medium " +
                (changesMade
                  ? "bg-indigo-800 text-white hover:bg-opacity-70 active:bg-opacity-40"
                  : "cursor-not-allowed bg-neutral-800 text-neutral-500")
              }
              disabled={!changesMade}
            >
              Save
            </button>
          </div>
        </div>
      </form>
      <div className="mb-4">
        <h1 className="text-2xl">Account</h1>

        <div>
          <div className="rounded-xl bg-neutral-800 bg-opacity-50 px-4 pt-3 pb-5">
            <h2>Public key:</h2>
            <div className="mb-5 flex items-center">
              <input
                type="text"
                value={toNpub(user_profile?.pubkey) || ""}
                className={style}
                readOnly
              />
              <button
                onClick={() => copyToClipboard(toNpub(user_profile?.pubkey))}
                className="ml-1 rounded-sm bg-neutral-800 px-3 py-1 font-medium text-white transition duration-100 hover:bg-indigo-800 active:bg-opacity-70"
              >
                Copy
              </button>
            </div>

            <h2>Private key:</h2>
            <div className="flex items-center">
              <input
                type="text"
                className={style + " cursor-pointer"}
                value={toNsec(privkey) || "Click to reveal..."}
                onClick={handleShowPrivKey}
                readOnly
                ref={privkeyRef}
              />
              <button
                onClick={() => {
                  if (privkey) {
                    copyToClipboard(toNsec(privkey));
                  } else {
                    invoke("get_privkey").then((privkey: string) => {
                      copyToClipboard(toNsec(privkey));
                    });
                  }
                }}
                className="ml-1 rounded-sm bg-neutral-800 px-3 py-1 font-medium text-white transition duration-100 hover:bg-indigo-800 active:bg-opacity-70"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="my-2">
            <button
              className="mr-2 mb-2 rounded-sm border border-indigo-800 border-opacity-0 bg-indigo-800 px-4 py-2  font-medium text-white hover:bg-opacity-70 active:bg-opacity-40"
              onClick={() => setShowPrivKeyModal(true)}
              type="button"
            >
              Import private key
            </button>
            <button
              className="mb-3 rounded-sm border border-indigo-800 bg-neutral-900 px-4 py-2 font-medium text-white transition duration-100 hover:bg-indigo-800 active:bg-opacity-70"
              onClick={() => setShowConfigRelaysModal(true)}
              type="button"
            >
              Configure relays
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfile;
