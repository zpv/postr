import { useState } from "react";
import info from "../../assets/info.png";
import verifIcon from "../../assets/verif.png";

const MessageHead = ({ pubkey, name, picture, nip05 }) => {
  const display_name = name || (pubkey && pubkey.slice(0, 6)) || "";

  const [isHovering, setIsHovering] = useState(false);
  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(pubkey);
  };

  return (
    <>
      <div
        className="bg-neutral-800 flex flex-row border-b border-neutral-800"
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <div
          className="cursor-pointer flex flex-row hover:ripple-bg-neutral-700 rounded-sm"
          onClick={copyToClipboard}
        >
          <img
            src={picture}
            alt="profile"
            className="rounded-lg w-10 h-10 m-3 border border-white border-opacity-20"
          />
          <div className="text-neutral-200 truncate overflow-hidden w-64 my-auto">
            {isHovering && <h1 className="text-gray-400 truncate">{pubkey}</h1>}
            {!isHovering && (
              <>
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
              </>
            )}
          </div>
        </div>
        <div className="flex flex-row w-full justify-end">
          <div className="my-auto p-2 mx-3 cursor-pointer hover:ripple-bg-neutral-700 rounded-lg opacity-50">
            <img src={info.src} alt="info" className="w-5 h-5" />
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageHead;
