import Layout from "../layouts/Layout";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

Feed.getInitialProps = async (ctx) => {
  const pubkey = "6a0e6b709fb5239a3df637695764f153e56edccd48fa1c64916b8481d0ca3ab3";
  const user_profile = await invoke("user_profile", { pubkey });

  return { user_profile };
}

function Feed({ user_profile }) {
  const tab = "Feed";
  const pageBody = (
    <>
      <p>feed2</p>
    </>
  );


  return (
    <Layout {...{user_profile}} {...{tab}}>
      {pageBody}
    </Layout>
  );
}

export default Feed;