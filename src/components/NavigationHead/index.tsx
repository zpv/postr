import Link from "next/link";
import { useState } from "react";
import { toNpub } from "../../helpers/pubkey";

interface NavigationHeadProps {
  picture?: string;
  nip05?: string;
  pubkey: string;
  name?: string;
}

const NavigationHead: React.FC<NavigationHeadProps> = ({
  picture,
  nip05,
  pubkey,
  name,
}) => {
  const npub = toNpub(pubkey);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const display_name: string = name || (pubkey && npub) || "";

  async function copyToClipboard() {
    await navigator.clipboard.writeText(npub);
  }

  function handleMouseOver() {
    setIsHovering(true);
  }

  function handleMouseOut() {
    setIsHovering(false);
  }

  return (
    <>
      <div className="flex flex-row border-b border-neutral-600 p-4">
        <img
          src={picture || `https://robohash.org/${pubkey}.png`}
          className="h-12 rounded-lg border border-white border-opacity-20 bg-neutral-900"
        />
        <div className="grid grid-rows-2 items-center text-start">
          {/* <h1 className="text-xl mx-2 truncate overflow-hidden">{display_name ? display_name : "no name"}</h1> */}
          <h1
            className="mx-1 cursor-pointer overflow-hidden truncate rounded-lg px-1 text-xl hover:ripple-bg-neutral-800"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onClick={copyToClipboard}
          >
            {isHovering &&
              ((nip05 && "@" + nip05?.split("@")[1]) || toNpub(pubkey))}
            {!isHovering && display_name}
          </h1>
          <Link href="/profile">
            <h2 className="mx-2 cursor-pointer text-neutral-600 hover:underline">
              Edit profile
            </h2>
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavigationHead;
