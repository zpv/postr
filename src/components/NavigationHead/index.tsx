import Link from "next/link";
import { useState } from "react";

const NavigationHead = ({ picture, nip05, pubkey, name }) => {
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
      <div className="flex flex-row p-4 border-b border-neutral-600">
        <img
          src={picture || `https://robohash.org/${pubkey}.png`}
          className="rounded-lg h-12 border border-opacity-20 border-white bg-neutral-900"
        />
        <div className="grid grid-rows-2 text-start items-center">
          {/* <h1 className="text-xl mx-2 truncate overflow-hidden">{display_name ? display_name : "no name"}</h1> */}
          <h1
            className="text-xl rounded-lg mx-1 px-1 truncate overflow-hidden hover:ripple-bg-neutral-800 cursor-pointer"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onClick={copyToClipboard}>
            {isHovering && ((nip05 && "@" + nip05?.split("@")[1]) || pubkey)}
            {!isHovering && display_name}
          </h1>
          <Link href="/profile">
            <h2 className="mx-2 text-neutral-600 cursor-pointer hover:underline">Edit profile</h2>
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavigationHead;
