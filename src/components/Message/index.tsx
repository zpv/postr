import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { SingleMessage, Profile, SetStringState, SetBooleanState, SetMessagesState } from "../../lib/types";
import LoadingWheel from "../LoadingWheel";
import MessageBody from "../MessageBody";
import MessageCompose from "../MessageCompose";
import MessageHead from "../MessageHead";

interface MessageProps {
  user: string;
  peer_profile: Profile,
  peer: string;
  conversation: SingleMessage[];
  loading: boolean;
  message: string;
  setMessage: SetStringState;
  setOnSubmit: SetBooleanState;
  setConversation: SetMessagesState;
}

const Message: React.FC<MessageProps> = ({
  user,
  peer_profile,
  peer,
  conversation,
  loading,
  message,
  setMessage,
  setOnSubmit,
  setConversation
}) => {
  const messageBody = (
    <>
      <div
        style={{ gridTemplateRows: "min-content 1fr min-content" }}
        className="grid h-[100vh] w-full">
        <MessageHead {...peer_profile } {...{peer}} />
        {!loading && <MessageBody {...{ conversation, user, setConversation, peer }} />}
        {loading && peer && <LoadingWheel />}
        <MessageCompose {...{ message, setMessage, setOnSubmit }} />
      </div>
    </>
  );

  return <>{peer && messageBody}</>;
};

export default Message;
