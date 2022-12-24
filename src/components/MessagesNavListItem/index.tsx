import { useState } from "react";
import verifIcon from "../../assets/verif.png";

const getFormattedTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const seven_days_ago = new Date(today);
  seven_days_ago.setDate(seven_days_ago.getDate() - 7);

  if (date.toDateString() === today.toDateString()) {
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
      .replace(/^0/, "");
  } else if (date > seven_days_ago) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
    });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

const MessagesNavListItem = ({
  pubkey,
  nip05,
  last_message,
  picture,
  name,
}) => {
  const display = name || (pubkey && pubkey.slice(0, 6)) || "";
  const pubkey_truncated = pubkey.slice(0, 6) + "..." + pubkey.slice(-6);
  const hover_text = (nip05 && "@" + nip05?.split("@")[1]) || pubkey_truncated;
  const [isHovering, setIsHovering] = useState(false);

  const verif = verifIcon;

  // last_message is a temporarily? a unix timestamp
  last_message = getFormattedTime(last_message);

  function handleMouseOver() {
    setIsHovering(true);
  }

  function handleMouseOut() {
    setIsHovering(false);
  }

  return (
    <>
      <img
        src={picture}
        className="rounded-lg h-12 mr-2 border-white border border-opacity-20"
      />
      <div className="grid grid-rows-2">
        <div
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          style={{ gridTemplateRows: "1fr" }}
          className={"flex flex-row"}
        >
          {isHovering && (
            <h1 className="text-gray-400 truncate">{hover_text}</h1>
          )}
          {!isHovering && <h1>{display}</h1>}
          {!isHovering && nip05 && (
            <img src={verif.src} className="h-3 w-3 my-auto opacity-20 ml-1" />
          )}
        </div>
        <p className="text-neutral-500 truncate overflow-hidden text-xs">
          {last_message}
        </p>
      </div>
    </>
  );
};

export default MessagesNavListItem;
