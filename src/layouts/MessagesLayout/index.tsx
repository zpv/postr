import React, { useEffect, useState } from "react";
import Message from "../../components/Message";
import MessagesNav from "../../components/MessagesNav";
import { invoke } from "@tauri-apps/api/tauri";

const MessagesLayout = ({ user_profile, peer_profiles, message_list, peer, setPeer }) => {

  // assuming that peer_profiles and conversation_history are lookup tables with peer as key
  // const peer_profile = peer_profiles[peer];
  const conversation = [];
  const peer_profile = peer_profiles[peer];

  return (
      <>
        <MessagesNav {...{message_list, peer, setPeer}}/>
        <Message {...{ user_profile, peer_profile, peer }} />
      </>
  );
}

export default MessagesLayout;