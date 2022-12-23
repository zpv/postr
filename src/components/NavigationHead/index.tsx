import { useState } from "react";

const NavigationHead = ({ picture, pubkey, name }) => {
  const [isHovering, setIsHovering] = useState(false);
  const display_name = name || (pubkey && pubkey.slice(0, 6)) || "";

  async function copyToClipboard() {
    await navigator.clipboard.writeText(pubkey);
  }

  function handleMouseOver() {
    setIsHovering(true);
  }

  function handleMouseOut() {
    setIsHovering(false);
  }

  return (
    <>
      <div className="flex flex-row p-4 cursor-pointer border-b border-gray-500">
        <img
          src={picture}
          className="rounded-lg h-12 border border-opacity-20 border-white"
        />
        <div className="grid grid-rows-2 text-start items-center">
          {/* <h1 className="text-xl mx-2 truncate overflow-hidden">{display_name ? display_name : "no name"}</h1> */}
          <h1
            className="text-xl rounded-lg mx-1 px-1 truncate overflow-hidden hover:ripple-bg-neutral-800"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onClick={copyToClipboard}
          >
            {isHovering && pubkey}
            {!isHovering && display_name}
          </h1>
          <h2 className="mx-2 text-neutral-600">View profile</h2>
        </div>
      </div>
    </>
  );
};

export default NavigationHead;
