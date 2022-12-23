import { createRef, useEffect, useRef } from "react";
import MessageBodyItem from "../MessageBodyItem";

const MessageBody = ({ conversation, user }) => {
  const messageRef = useRef();

  useEffect(() => {
    if (messageRef.current) {
      const element = messageRef.current as HTMLDivElement;
      element.scrollTop = element.scrollHeight;
    }
  }, [conversation]);

  return (
    <>
      <div
        ref={messageRef}
        className="py-5 w-full overflow-y-scroll overflow-x-hidden h-full">
        {conversation.map((message_content) => {
          return <MessageBodyItem {...message_content} {...{ user }} />;
        })}
      </div>
    </>
  );
};

export default MessageBody;
