// Format of a single message
// {
//   "author": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d"
//   "content": "Hello",
//   "timestamp": 1671705410
// }

import { getTime } from "../../helpers/timeHelpers";

const MessageBodyItem = ({ author, content, timestamp, user, rounded_bottom, rounded_top }) => {
  if (content === "") return <></>;

  const isUser = author === user

  const userStyling = "bg-indigo-800 rounded-bl-2xl rounded-tl-2xl" + (rounded_bottom && " rounded-br-2xl" || "") + (rounded_top && " rounded-tr-2xl" || "");
  const authorStyling = "bg-neutral-800 rounded-br-2xl rounded-tr-2xl" + (rounded_bottom && " rounded-bl-xl" || "") + (rounded_top && " rounded-tl-xl" || "");

  const timeStr = getTime(timestamp);

  return (
    <>
      <div
        className={
          "group w-full flex " + (author === user && "justify-end")
        }>
        {isUser && <div className="group-hover:inline hidden text-center text-neutral-400 text-xs my-auto">{timeStr}</div>}
        <p
          className={
            "my-[0.5px] mx-5 py-1 px-4 break-all max-w-xs lg:max-w-lg rounded-sm " +
            (isUser
              ? userStyling
              : authorStyling)
          }>
          {content}
        </p>
        {!isUser && <div className="group-hover:inline hidden text-center text-neutral-400 text-xs my-auto">{timeStr}</div>}
      </div>
    </>
  );
};

export default MessageBodyItem;
