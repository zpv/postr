import { useState } from "react";
import MessagesLayout from "../../layouts/MessagesLayout";
import { invoke } from "@tauri-apps/api/tauri";
import Layout from "../../layouts/Layout";

Messages.getInitialProps = async (ctx) => {
  const user_pubkey: string = await invoke("get_pubkey");
  const user_profile: any = await invoke("user_profile", {
    pubkey: user_pubkey,
  }).catch((e) => {
    return {
      picture: `https://robohash.org/${user_pubkey}.png`,
      pubkey: user_pubkey,
    };
  });

  if (!user_profile.picture) {
    user_profile.picture = `https://robohash.org/${user_pubkey}.png`;
  }

  return { user: user_pubkey, user_profile };
};

function Messages({
  user,
  user_profile,
  peer,
  setPeer,
  profiles,
  setProfiles,
  lastRefresh,
  setLastRefresh,
  message_list,
  setMessageList,
}) {
  // rudimentary state lol
  const tab = "Messages";

  if (!profiles[user_profile.pubkey]) {
    profiles[user_profile.pubkey] = user_profile;
  }

  return (
    <div className="bg-neutral-900 w-full h-full overflow-hidden">
      <div className="grid grid-cols-[180px_240px_1fr] h-full">
        <Layout {...{ user_profile }} {...{ tab }}>
          <MessagesLayout {...{ user, profiles, setProfiles, peer, setPeer, lastRefresh, setLastRefresh, message_list, setMessageList }} />
        </Layout>
      </div>
    </div>
  );
}

export default Messages;
