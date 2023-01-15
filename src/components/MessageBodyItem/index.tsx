import { useState } from "react";
import { getTime } from "../../helpers/timeHelpers";

interface MessageBodyItemProps {
  author: string;
  content: string;
  timestamp: number;
  user: string;
  rounded_bottom: boolean;
  rounded_top: boolean;
}

const MessageBodyItem: React.FC<MessageBodyItemProps> = ({
  author,
  content,
  timestamp,
  user,
  rounded_bottom,
  rounded_top,
}) => {
  const MAX_LENGTH: number = 200;
  const TRIM_LENGTH: number = 50;
  const isUser: boolean = author === user;
  const userStyling: string =
    "bg-indigo-800 rounded-bl-2xl rounded-tl-2xl" +
    ((rounded_bottom && " rounded-br-2xl") || "") +
    ((rounded_top && " rounded-tr-2xl") || "");
  const authorStyling: string =
    "bg-neutral-800 rounded-br-2xl rounded-tr-2xl" +
    ((rounded_bottom && " rounded-bl-2xl") || "") +
    ((rounded_top && " rounded-tl-2xl") || "");
  const timeStr: string = getTime(timestamp);
  const [expanded, setExpanded] = useState(false);

  if (content === "") return <></>;

  return (
    <>
      <div
        className={"group flex w-full " + (author === user && "justify-end")}
      >
        {isUser && (
          <p className="invisible my-auto ml-5 text-center text-xs text-neutral-400 group-hover:visible">
            {timeStr}
          </p>
        )}
        <p
          className={
            "my-[0.5px] mx-5 min-w-0 max-w-xs break-words rounded-sm py-1 px-4 lg:max-w-lg " +
            (isUser ? userStyling : authorStyling)
          }
        >
          {(content.length <= MAX_LENGTH || expanded) && content}
          {content.length > MAX_LENGTH && !expanded && (
            <>
              {content.slice(0, MAX_LENGTH - TRIM_LENGTH)}...
              <span
                className="cursor-pointer text-indigo-300 underline hover:no-underline"
                onClick={() => setExpanded(true)}
              >
                <br />
                Expand {content.length - MAX_LENGTH + TRIM_LENGTH} more
                characters
              </span>
            </>
          )}
        </p>
        {!isUser && (
          <p className="invisible my-auto mr-5 text-center text-xs text-neutral-400 group-hover:visible">
            {timeStr}
          </p>
        )}
      </div>
    </>
  );
};

export default MessageBodyItem;
