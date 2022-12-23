import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";

import { useEffect, useState } from "react";
import Message from "../../components/Message";

import MessagesNav from "../../components/MessagesNav";

const MessagesLayout = ({ user_profile, peer, setPeer }) => {
  const [conversation, setConversation] = useState([]);
  const [message_list, setMessageList] = useState([]);
  const [peer_profiles, setPeerProfiles] = useState({});
  const [message, setMessage] = useState("");
  const [onSubmit, setOnSubmit] = useState(false);
  const [loading, setLoading] = useState(true);

  const getMessages = async () => {
    return await invoke("user_convos");
  };

  const getProfiles = async (messages) => {
    const profiles = {};
    for (const message of messages) {
      try {
        const profile: any = await invoke("user_profile", {
          pubkey: message.peer,
        });
        if (!profile.picture) {
          profile.picture = `https://robohash.org/${message.peer}.png`;
        }
        profiles[message.peer] = profile;
      } catch {
        console.log("failed to get profile for ", message.peer);

        profiles[message.peer] = {
          picture: `https://robohash.org/${message.peer}.png`,
          pubkey: message.peer,
        };
      }
    }
    return profiles;
  };

  const refreshMessages = () =>
    getMessages()
      .then((messages: any) => {
        return getProfiles(messages)
          .then((profiles) => {
            setMessageList(messages);
            setPeerProfiles(profiles);
            setLoading(false);
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {
        setMessageList([]);
        setPeerProfiles({});
        setLoading(false);
        console.log(e);
      });

  function removeItem<T>(arr: Array<T>, value: T): Array<T> {
    const index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }

  useEffect(() => {
    const unlisten = listen("dm", (event: any) => {
      // event.event is the event name (useful if you want to use a single callback fn for multiple event types)
      // event.payload is the payload object
      // refreshMessages();
      console.log(event);
      console.log("PEER", peer)
      console.log("AUTHOR", event.payload.author)
      if (
        peer === event.payload.author ||
        (user_profile.pubkey === event.payload.author &&
          peer === event.payload.recipient)
      ) {
        setConversation((prev) => [...prev, event.payload]);
      }
    });

    refreshMessages();

    return () => {
      unlisten.then((f) => f());
    };
  }, [peer]);

  useEffect(() => {
    setLoading(true);

    if (peer !== "") {
      const switchConversation = async () => {
        return await invoke("user_dms", { peer });
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

  useEffect(() => {
    if (onSubmit && message !== "") {
      const sendMessage = async () => {
        return await invoke("send_dm", { peer, message });
      };
      sendMessage()
        .then((r: any) => {
          setOnSubmit(false);
          setMessage("");
        })
        .catch((e) => {
          setOnSubmit(false);
          setMessage("");
          console.log(e);
        });
    } else {
      setOnSubmit(false);
    }
  }, [onSubmit]);

  return (
    <>
      <MessagesNav
        {...{
          message_list,
          peer_profile: peer_profiles[peer],
          peer_profiles,
          setPeer,
        }}
      />
      <Message
        {...{
          user_profile,
          peer_profile: peer_profiles[peer],
          peer,
          conversation,
          loading,
          message,
          setMessage,
          setOnSubmit,
        }}
      />
    </>
  );
};

export default MessagesLayout;
