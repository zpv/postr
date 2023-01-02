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
  if (content === "") return <></>;

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

  return (
    <>
      <div
        className={"group w-full flex " + (author === user && "justify-end")}>
        {isUser && (
          <div className="group-hover:inline hidden text-center text-neutral-400 text-xs my-auto">
            {timeStr}
          </div>
        )}
        <p
          className={
            "my-[0.5px] mx-5 py-1 px-4 break-all max-w-xs lg:max-w-lg rounded-sm " +
            (isUser ? userStyling : authorStyling)
          }>
          {content}
        </p>
        {!isUser && (
          <div className="group-hover:inline hidden text-center text-neutral-400 text-xs my-auto">
            {timeStr}
          </div>
        )}
      </div>
    </>
  );
};

export default MessageBodyItem;
