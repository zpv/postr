import { useState } from "react";
import MessagesLayout from "../../layouts/MessagesLayout";
import { invoke } from "@tauri-apps/api/tauri";
import Layout from "../../layouts/Layout";

Messages.getInitialProps = async (ctx) => {
  const privkey = ctx.query.privkey;
  const user_pubkey = await invoke("to_pubkey", { privkey });
  console.log(user_pubkey);
  const user_profile:any = await invoke("user_profile", { pubkey: user_pubkey }).catch(e => {
    return {
      picture: `https://robohash.org/${user_pubkey}.png`,
      pubkey: user_pubkey
    }
  })

  if (!user_profile.picture) {
    user_profile.picture = `https://robohash.org/${user_pubkey}.png`;
  }

  return { user_profile };
};

function Messages({
  user_profile,
  peer,
  setPeer,
  user,
}) {
  // rudimentary state lol
  const tab = "Messages";

  return (
    <Layout {...{ user_profile }} {...{ tab, user }}>
      <MessagesLayout
        {...{ user_profile, user, peer, setPeer }}
      />
    </Layout>
  );
}

export default Messages;
