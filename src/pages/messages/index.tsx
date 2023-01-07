import { StrictMode, useState } from "react";
import MessagesLayout from "../../layouts/MessagesLayout";
import { invoke } from "@tauri-apps/api/tauri";
import Layout from "../../layouts/Layout";
import { Profile } from "../../lib/types";

Messages.getInitialProps = async (ctx) => {
  if (typeof window === "undefined") {
    console.log("EditProfile.getInitialProps: typeof window === 'undefined'");
    return { user: "", user_profile: { pubkey: "", failed: true } };
  }
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
    <StrictMode>
      <div className="h-full w-full overflow-hidden bg-neutral-900">
        <div className="grid h-full grid-cols-[75px_75px_1fr] xs:grid-cols-[75px_240px_1fr] sm:grid-cols-[180px_240px_1fr]">
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
    </StrictMode>
  );
}

export default Messages;
