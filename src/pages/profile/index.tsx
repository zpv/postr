import { invoke } from "@tauri-apps/api/tauri";
import { StrictMode } from "react";
import EditProfileLayout from "../../layouts/EditProfileLayout";
import Layout from "../../layouts/Layout";
import { Profile } from "../../lib/types";

EditProfile.getInitialProps = async (ctx) => {
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

function EditProfile({
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
  listenFunc,
  setListenFunc,
}) {
  const tab: string = "none";

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
        <div className="grid h-full grid-cols-[75px_1fr] sm:grid-cols-[180px_1fr]">
          <Layout {...{ user_profile }} {...{ tab }}>
            <EditProfileLayout
              {...{
                user_profile,
                setProfiles,
                setLastRefresh,
                setPeer,
                setMessageList,
                listenFunc,
                setListenFunc,
              }}
            />
          </Layout>
        </div>
      </div>
    </StrictMode>
  );
}

export default EditProfile;
