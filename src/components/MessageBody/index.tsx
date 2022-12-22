import { createRef, useEffect, useRef } from "react";
import MessageBodyItem from "../MessageBodyItem";

const MessageBody = ({ conversation, user_profile }) => {

  // ASSUMING FORMAT OF SINGLE MESSAGE IS
  // {
  //   "id": "1",
  //   "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
  //   "receiver": "6a0e6b709fb5239a3df637695764f153e56edccd48fa1c64916b8481d0ca3ab3",
  //   "message": "Hello",
  //   "timestamp": "2021-07-01T00:00:00Z"
  // }

  const messageRef = useRef();

  useEffect(() => {
    if (messageRef.current) {
      const element = messageRef.current as HTMLDivElement;
      element.scrollTop = element.scrollHeight;
    }
  }, [conversation]);

  return (
    <>
      <div ref={messageRef} className="py-5 w-full overflow-y-scroll overflow-x-hidden h-full">
        {conversation.map((message_content) => {
          return <MessageBodyItem {...message_content} {...{user_profile}} />
        })}
      </div>
    </>
  );
};

export default MessageBody;
