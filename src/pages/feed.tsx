import Layout from "../layouts/Layout";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

Feed.getInitialProps = async (ctx) => {
  const user_pubkey = await invoke("get_pubkey");
  console.log(user_pubkey);
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

  return { user_profile };
};

function Feed({ user_profile }) {
  const tab = "Feed";
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
