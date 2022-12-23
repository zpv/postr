import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import LoadingWheel from "../LoadingWheel";
import MessageBody from "../MessageBody";
import MessageCompose from "../MessageCompose";
import MessageHead from "../MessageHead";

const Message = ({ user_profile, peer_profile, peer, conversation, loading }) => {
  const messageBody = (
    <>
      <div
        style={{ gridTemplateRows: "min-content 1fr min-content" }}
        className="grid h-[100vh] w-full"
      >
        <MessageHead {...peer_profile} />
        {!loading && <MessageBody {...{ conversation, user_profile }} />}
        {loading && peer && <LoadingWheel/>}
        <MessageCompose />
      </div>
    </>
  );

  return <>{peer && messageBody}</>;
};

export default Message;
