import Layout from "../layouts/Layout";
import { useState } from "react";
import MessagesLayout from "../layouts/MessagesLayout";

Messages.getInitialProps = async (ctx) => {
  // const res = await fetch('https://api.github.com/repos/vercel/next.js')
  // const json = await res.json()
  const user = {
    public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
    icon: "https://avatars.githubusercontent.com/u/12267041?v=4",
    display_name: "",
  }
  return { user }
}

function Messages({ user }) {
  const tab = "Messages";
  const pageBody = (
    <>
      <MessagesLayout />
    </>
  );


  return (
    <Layout {...user} {...{tab}} children={pageBody} />
  );
}

export default Messages;