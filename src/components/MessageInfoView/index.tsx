import { useEffect, useState } from "react";
import { SetBooleanState } from "../../lib/types";
import verifIcon from "../../assets/verif.png";
import info from "../../assets/info.png";
import { toNpub } from "../../helpers/pubkey";

interface MessageInfoViewProps {
  setShowUserInfo: SetBooleanState;
  peer: string;
  name?: string;
  about?: string;
  nip05?: string;
  picture?: string;
  failed?: boolean;
}

const MessageInfoView: React.FC<MessageInfoViewProps> = ({
  setShowUserInfo,
  peer,
  name,
  about,
  nip05,
  picture,
  failed,
}) => {
  const npub = toNpub(peer);
  const npub_truncated: string =
    npub && npub.slice(0, 6) + "..." + npub.slice(-6);
  const display: string = name || (npub && npub_truncated) || "";
  const display_name: string = name || (peer && npub_truncated) || "";

  return (
    <div
      style={{ gridTemplateRows: "min-content 1fr" }}
      className="grid h-[100vh]"
    >
      <div className="min-w-0 bg-neutral-900">
        <div className="flex flex-row border-b border-neutral-700 bg-neutral-800">
          <div className="flex h-[64px] w-full">
            <h1 className="my-auto ml-6 pt-2 text-4xl leading-none">
              User Details
            </h1>
            <div
              className="my-auto mx-3 ml-auto flex flex-shrink-0 cursor-pointer rounded-lg p-2 opacity-50 transition duration-100 hover:bg-neutral-700 active:opacity-20"
              onClick={() => setShowUserInfo(false)}
            >
              <img src={info?.src || ""} alt="info" className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 overflow-y-auto bg-neutral-900">
        <div
          className={
            "flex flex-row overflow-x-hidden border-b border-neutral-700 bg-gradient-to-br from-neutral-800 to-black py-6"
          }
        >
          <div className="mx-6 flex min-w-fit flex-shrink-0 flex-col">
            <img
              src={picture || `https://robohash.org/${peer}.png`}
              alt="profile"
              className="h-56 w-56 rounded-lg border border-neutral-700 object-contain"
            />
            <button className="mt-3 rounded-lg border border-indigo-800 bg-indigo-800 px-3 py-1 font-medium text-neutral-200 hover:bg-opacity-70 active:bg-opacity-40">
              Follow
            </button>
            <button className="mt-3 rounded-lg border border-indigo-800 bg-transparent px-3 py-1 font-medium text-neutral-200 transition duration-100 hover:bg-indigo-800 active:bg-opacity-70">
              Mute
            </button>
          </div>

          <div className="mr-6 flex min-w-0 flex-1 flex-col">
            <div className="border-b border-neutral-700 pb-2">
              <div className="flex flex-row">
                <h1 className="truncate text-3xl">{display_name}</h1>
                {nip05 && (
                  <img
                    src={verifIcon.src}
                    className="my-auto ml-1 h-5 w-5 flex-shrink-0 leading-none opacity-20"
                  />
                )}
              </div>

              {nip05 && (
                <p className="truncate text-2xl font-thin text-neutral-500">
                  @{nip05.split("@")[1]}
                </p>
              )}
            </div>

            <div id="about" className="mt-3">
              <h2>About</h2>
              <textarea
                className="w-full resize-none rounded-lg border border-neutral-700 bg-transparent px-4 py-2 text-white outline-none"
                readOnly
                rows={3}
                value={about || "None"}
              />
            </div>

            <div id="pubkey" className="mt-3">
              <h2>Pubkey</h2>
              <div className="flex">
                <p className="flex-1 truncate rounded-bl-full rounded-tl-full border border-r-0 border-neutral-700 bg-neutral-900 px-4 py-2">
                  {toNpub(peer)}
                </p>
                <button
                  className="ml-auto border border-indigo-800 bg-transparent px-3 py-1 font-medium text-neutral-200 transition duration-100 hover:bg-indigo-800 active:bg-opacity-70"
                  onClick={() => {
                    navigator.clipboard.writeText(toNpub(peer));
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInfoView;
