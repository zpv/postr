import React, { useEffect, useState } from "react";
import Message from "../../components/Message";
import MessagesNav from "../../components/MessagesNav";
import { invoke } from "@tauri-apps/api/tauri";

const MessagesLayout = ({
  user_profile,
  user,
  peer,
  setPeer,
}) => {
  const [conversation, setConversation] = useState([]);
  const [message_list, setMessageList] = useState([]);
  const [peer_profiles, setPeerProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMessages = async () => {
      return await invoke("user_convos", { privkey: user });
    };
    
    const getProfiles = async (messages) => {
      const profiles = {};
      for (const message of messages) {
        try {
          const profile:any = await invoke("user_profile", { pubkey: message.peer });
          if (!profile.picture) {
            profile.picture = `https://robohash.org/${message.peer}.png`;
          }
          profiles[message.peer] = profile;
        } catch {
          console.log("failed to get profile for ", message.peer);

          profiles[message.peer] = {
            picture: `https://robohash.org/${message.peer}.png`,
            pubkey: message.peer
          };
        }
      }
      return profiles;
    };

    getMessages()
      .then((messages: any) => {
        return getProfiles(messages).then((profiles) => {
          console.log("conversation", messages);
          setMessageList(messages);
          setPeerProfiles(profiles);
          setLoading(false);
        }).catch(e => {
          console.log(e);
        });
      })
      .catch((e) => {
        setMessageList([]);
        setPeerProfiles({});
        setLoading(false);
        console.log(e);
      });
  }, []);

  useEffect(() => {
    // setConversation([]);       // will we need this?
    setLoading(true);

    if (peer !== "") {
      const switchConversation = async () => {
        return await invoke("user_dms", { peer, privkey: user });
      };
      switchConversation()
        .then((r: any) => {
          setLoading(false);
          setConversation(r);
        })
        .catch((e) => {
          setLoading(false);
          setConversation([]);
          console.log(e);
        });
    }
  }, [peer]);

  return (
    <>
      <MessagesNav
        {...{ message_list, peer_profile: peer_profiles[peer], peer_profiles, setPeer }}
      />
        <Message {...{ user_profile, peer_profile: peer_profiles[peer], peer, conversation, loading }} />
    </>
  );
};

export default MessagesLayout;
