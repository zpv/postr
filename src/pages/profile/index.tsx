import { invoke } from "@tauri-apps/api/tauri";
import EditProfileLayout from "../../layouts/EditProfileLayout";
import Layout from "../../layouts/Layout";

EditProfile.getInitialProps = async (ctx) => {
  const user_pubkey: string = await invoke("get_pubkey");
  const user_profile: any = await invoke("user_profile", {
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
}) {
  const tab = "none";

  if (!profiles[user_profile?.pubkey] || profiles[user_profile?.pubkey]?.failed) {
    profiles[user_profile?.pubkey] = user_profile;
  } else {
    user_profile = profiles[user_profile?.pubkey];
  }

  return (
    <div className="bg-neutral-900 w-full h-full overflow-hidden">
      <div className="grid grid-cols-[180px_1fr] h-full">
        <Layout {...{ user_profile }} {...{ tab }}>
          <EditProfileLayout
            {...{ user_profile, setProfiles, setLastRefresh, setPeer, setMessageList }}
          />
        </Layout>
      </div>
    </div>
  );
}

export default EditProfile;
