import Link from "next/link";
import { useState } from "react";
import { toNpub } from "../../helpers/nip19";

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
      <div className="flex flex-row border-b border-neutral-600 p-3 sm:pl-3 sm:pt-3 sm:pb-1 sm:pr-0">
        <img
          src={picture || `https://robohash.org/${pubkey}.png`}
          className="hidden h-12 w-12 flex-shrink-0 rounded-lg border border-neutral-700 bg-neutral-900 object-contain sm:inline"
        />

        <span className="inline sm:hidden">
          <Link href="/profile">
            <img
              src={picture || `https://robohash.org/${pubkey}.png`}
              className="h-12 w-12 flex-shrink-0 cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 object-contain"
            />
          </Link>
        </span>

        <div className="hidden w-full grid-rows-2 sm:grid">
          {/* <h1 className="text-xl mx-2 truncate overflow-hidden">{display_name ? display_name : "no name"}</h1> */}
          <h1
            className="mx-1 cursor-pointer overflow-hidden truncate rounded-lg px-1 text-xl hover:ripple-bg-neutral-800"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onClick={copyToClipboard}
          >
            {isHovering &&
              ((nip05 && "@" + nip05?.split("@")[1].toLowerCase()) || toNpub(pubkey))}
            {!isHovering && display_name}
          </h1>
          <Link href="/profile">
            <h2 className="ml-2 cursor-pointer text-neutral-600 hover:underline">
              Edit profile
            </h2>
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavigationHead;
