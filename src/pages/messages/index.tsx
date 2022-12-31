import { useState } from "react";
import MessagesLayout from "../../layouts/MessagesLayout";
import { invoke } from "@tauri-apps/api/tauri";
import Layout from "../../layouts/Layout";
import { Profile } from "../../lib/types";

Messages.getInitialProps = async (ctx) => {
  const user_pubkey: string = await invoke<string>("get_pubkey");
  const user_profile: Profile = await invoke<Profile>("user_profile", {
    pubkey: user_pubkey,
  }).catch((e) => {
    return {
      pubkey: user_pubkey,
      failed: true,
    };
  });

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
  const tab: string = "Messages";

  if (
    !profiles[user_profile?.pubkey] ||
    profiles[user_profile?.pubkey]?.failed
  ) {
    profiles[user_profile?.pubkey] = user_profile;
  } else {
    user_profile = profiles[user_profile?.pubkey];
  }

  return (
    <div className="bg-neutral-900 w-full h-full overflow-hidden">
      <div className="grid grid-cols-[180px_240px_1fr] h-full">
        <Layout {...{ user_profile }} {...{ tab }}>
          <MessagesLayout
            {...{
              user,
              profiles,
              setProfiles,
              peer,
              setPeer,
              lastRefresh,
              setLastRefresh,
              message_list,
              setMessageList,
            }}
          />
        </Layout>
      </div>
    </div>
  );
}

export default Messages;
