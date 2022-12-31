import { useState } from "react";
import info from "../../assets/info.png";
import verifIcon from "../../assets/verif.png";

const MessageHead = ({ pubkey, name, picture, nip05, peer }) => {
  const display_name = name || (peer && peer.slice(0, 6)) || "";
  const hover_text = peer.slice(0, 10) + "..." + peer.slice(-10);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(peer);
  };

  return (
    <>
      <div className="bg-neutral-800 flex flex-row border-b border-neutral-800 group">
        <div
          className="cursor-pointer flex flex-row hover:ripple-bg-neutral-700"
          onClick={copyToClipboard}>
          <img
            src={picture || `https://robohash.org/${peer}.png`}
            alt="profile"
            className="rounded-lg w-10 h-10 m-3 border border-white border-opacity-20"
          />
          <div className="text-neutral-200 truncate overflow-hidden w-64 my-auto">
            <h1 className="text-gray-400 truncate hidden group-hover:inline">
              {hover_text}
            </h1>

            <div className="group-hover:hidden">
              <h1 className="text-neutral-200 truncate leading-none">
                {display_name}
              </h1>

              {nip05 && (
                <div className="flex flex-row">
                  <img
                    src={verifIcon.src}
                    className="h-3 w-3 my-auto opacity-20 mr-1 leading-none"
                  />
                  <div className="flex items-center">
                    <span className="text-gray-400" style={{ height: 21 }}>
                      @{nip05.split("@")[1]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* <div className="flex flex-row w-full justify-end">
          <div className="my-auto p-2 mx-3 cursor-pointer hover:ripple-bg-neutral-700 rounded-lg opacity-50">
            <img
              src={info?.src || ""}
              alt="info"
              className="w-5 h-5"
            />
          </div>
        </div> */}
      </div>
    </>
  );
};

export default MessageHead;
