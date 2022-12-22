import { useState } from "react";
import MessagesLayout from "../../layouts/MessagesLayout";
import { invoke } from "@tauri-apps/api/tauri";
import Layout from "../../layouts/Layout";

Messages.getInitialProps = async (ctx) => {
  const pubkey = ctx.query.pubkey;
  const user_profile = await invoke("user_profile", { pubkey });

  // *** MOCK DATA STARTING HERE ***
  // const message_list = await invoke("dbChats", { pubkey });
  const message_list = [
    {
      id: 1,
      icon: "https://avatars.githubusercontent.com/u/71356404?v=4",
      public_key:
        "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      last_message: "Hello",
      last_message_time: "2021-07-01T00:00:00.000Z",
    },
    {
      id: 2,
      icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
      display_name: "kelvin",
      public_key:
        "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
      last_message: "Hello",
      last_message_time: "2021-06-04T00:00:00.000Z",
    },
    {
      id: 2,
      icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
      display_name: "kelvin",
      public_key:
        "1da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
      last_message: "Hello",
      last_message_time: "2021-06-04T00:00:00.000Z",
    },
    {
      id: 2,
      icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
      display_name: "kelvin",
      public_key:
        "2da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
      last_message: "Hello",
      last_message_time: "2021-06-04T00:00:00.000Z",
    },
    {
      id: 2,
      icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
      display_name: "kelvin",
      public_key:
        "3da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
      last_message: "Hello",
      last_message_time: "2021-06-04T00:00:00.000Z",
    },
    {
      id: 2,
      icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
      display_name: "kelvin",
      public_key:
        "4da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
      last_message: "Hello",
      last_message_time: "2021-06-04T00:00:00.000Z",
    },
    {
      id: 2,
      icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
      display_name: "kelvin",
      public_key:
        "5da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
      last_message: "Hello",
      last_message_time: "2021-06-04T00:00:00.000Z",
    },
    {
      id: 2,
      icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
      display_name: "kelvin",
      public_key:
        "6da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
      last_message: "Hello",
      last_message_time: "2021-06-04T00:00:00.000Z",
    },
    {
      id: 2,
      icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
      display_name: "kelvin",
      public_key:
        "7da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
      last_message: "Hello",
      last_message_time: "2021-06-04T00:00:00.000Z",
    },
  ];

  const peer_profiles = {
    "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d": {
      id: 1,
      picture: "https://avatars.githubusercontent.com/u/71356404?v=4",
      pubkey:
        "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      last_message: "Hello",
      last_message_time: "2021-07-01T00:00:00.000Z",
    },
    "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee": {
      id: 2,
      picture: "https://avatars.githubusercontent.com/u/24833484?v=4",
      name: "kelvin",
      pubkey:
        "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
      last_message: "Hello",
      last_message_time: "2021-06-04T00:00:00.000Z",
    },
  };

  return { user_profile, message_list, peer_profiles };
};

function Messages({
  user_profile,
  message_list,
  peer_profiles,
  peer,
  setPeer,
}) {
  // rudimentary state lol
  const tab = "Messages";

  return (
    <Layout {...{ user_profile }} {...{ tab }}>
      <MessagesLayout
        {...{ user_profile, peer_profiles, message_list, peer, setPeer }}
      />
    </Layout>
  );
}

export default Messages;
