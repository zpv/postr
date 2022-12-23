import Layout from "../layouts/Layout";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

Feed.getInitialProps = async (ctx) => {
  const privkey = ctx.query.privkey;
  const user_pubkey = await invoke("get_pubkey");
  console.log(user_pubkey);
  const user_profile:any = await invoke("user_profile", { pubkey: user_pubkey }).catch(e => {
    return {
      picture: `https://robohash.org/${user_pubkey}.png`,
      pubkey: user_pubkey
    }
  });

  if (!user_profile.picture) {
    user_profile.picture = `https://robohash.org/${user_pubkey}.png`;
  }

  return { user_profile };
}

function Feed({ user_profile, user }) {
  const tab = "Feed";
  const pageBody = (
    <>
      <p>feed2</p>
    </>
  );


  return (
    <Layout {...{user_profile}} {...{tab, user}}>
      {pageBody}
    </Layout>
  );
}

export default Feed;