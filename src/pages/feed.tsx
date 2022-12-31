import Layout from "../layouts/Layout";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Profile } from "../lib/types";

Feed.getInitialProps = async (ctx) => {
  const user_pubkey: string = await invoke("get_pubkey");
  console.log(user_pubkey);
  const user_profile: Profile = await invoke<Profile>("user_profile", {
    pubkey: user_pubkey,
  }).catch((e) => {
    return {
      pubkey: user_pubkey,
      failed: true,
    };
  });

  return { user_profile };
};

function Feed({ user_profile }) {
  const tab: string = "Feed";
  const pageBody = (
    <>
      <p>feed2</p>
    </>
  );

  return (
    <div className="bg-neutral-900 w-full h-full overflow-hidden">
      <div className="grid grid-cols-[180px_240px_1fr] h-full">
        <Layout {...{ user_profile }} {...{ tab }}>
          {pageBody}
        </Layout>
      </div>
    </div>
  );
}

export default Feed;
