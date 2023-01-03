import { useState } from "react";
import info from "../../assets/info.png";
import verifIcon from "../../assets/verif.png";

interface MessageHeadProps {
  name?: string;
  picture?: string;
  nip05?: string;
  peer: string;
}

const MessageHead: React.FC<MessageHeadProps> = ({
  name,
  picture,
  nip05,
  peer,
}) => {
  const display_name: string = name || (peer && peer.slice(0, 6)) || "";
  const hover_text: string = peer.slice(0, 10) + "..." + peer.slice(-10);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(peer);
  };

  return (
    <>
      <div className="flex flex-row border-b border-neutral-800 bg-neutral-800">
        <div
          className="group flex cursor-pointer flex-row hover:ripple-bg-neutral-700"
          onClick={copyToClipboard}
        >
          <img
            src={picture || `https://robohash.org/${peer}.png`}
            alt="profile"
            className="m-3 h-10 w-10 rounded-lg border border-white border-opacity-20"
          />
          <div className="my-auto w-64 overflow-hidden truncate text-neutral-200">
            <h1 className="hidden truncate text-gray-400 group-hover:inline">
              {hover_text}
            </h1>

            <div className="group-hover:hidden">
              <h1 className="truncate leading-none text-neutral-200">
                {display_name}
              </h1>

              {nip05 && (
                <div className="flex flex-row">
                  <img
                    src={verifIcon.src}
                    className="my-auto mr-1 h-3 w-3 leading-none opacity-20"
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
        <div className="flex w-full flex-row justify-end">
          <div className="my-auto mx-3 cursor-pointer rounded-lg p-2 opacity-50 hover:ripple-bg-neutral-700">
            <img src={info?.src || ""} alt="info" className="h-5 w-5" />
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageHead;
