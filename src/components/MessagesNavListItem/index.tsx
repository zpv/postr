import { l } from "@tauri-apps/api/fs-4bb77382";
import { useState } from "react";

const getFormattedTime = (timestamp:number) => {
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

const MessagesNavListItem = ({ pubkey, last_message, picture, name }) => {
  const display = name || (pubkey && pubkey.slice(0, 6)) || "";
  const [isHovering, setIsHovering] = useState(false);

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
        <h1
          // onMouseOver={handleMouseOver}
          // onMouseOut={handleMouseOut}
          className="truncate overflow-hidden"
        >
          {/* {isHovering && pubkey} */}
          {!isHovering && display}
        </h1>
        <p className="text-neutral-500 truncate overflow-hidden text-xs">
          {last_message}
        </p>
      </div>
    </>
  );
};

export default MessagesNavListItem;
