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

  const getProfile = async (pubkey) => {
    return await invoke("user_profile", {
      pubkey: pubkey,
    })
      .then((r: any) => {
        if (!r.picture) {
          r.picture = `https://robohash.org/${pubkey}.png`;
        }
        return r;
      })
      .catch((e) => {
        console.log(`getProfile error (${e}) for: `, pubkey);
        return {
          picture: `https://robohash.org/${pubkey}.png`,
          pubkey: pubkey,
        };
      });
  };

  const getProfiles = async (messages) => {
    const profiles = {};
    for (const message of messages) {
      profiles[message.peer] = await getProfile(message.peer);
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

  useEffect(() => {
    const unlisten = listen("dm", (event: any) => {
      // console.log(event);
      // console.log("PEER", peer);
      // console.log("AUTHOR", event.payload.author);

      // if message is for this peer, add it to the conversation
      if (
        peer === event.payload.author ||
        (user_profile.pubkey === event.payload.author &&
          peer === event.payload.recipient)
      ) {
        setConversation((prev) => [...prev, event.payload]);
      }

      // everything below here is to update message list

      // setup profile if it doesn't exist
      const updatePeerProfile = (peer_pubkey) => {
        const peer_profile = peer_profiles[peer_pubkey];
        if (!peer_profile) {
          getProfile(peer_pubkey).then((profile) => {
            setPeerProfiles((prev_profiles) => {
              prev_profiles[peer_pubkey] = profile;
              return prev_profiles;
            });
          });
        }
      };

      setMessageList((prev) => {
        // handle case where author === recipient (i.e. sending to self)
        if (event.payload.author === event.payload.recipient) {
          const message = prev.find((m) => m.peer === event.payload.author);
          if (message) {
            message.last_message = Math.max(
              message.last_message,
              event.payload.timestamp
            );
            return [...prev].sort((a, b) => b.last_message - a.last_message);
          } else {
            const pubkey = event.payload.author;

            updatePeerProfile(pubkey);

            return [
              ...prev,
              {
                peer: pubkey,
                last_message: event.payload.timestamp,
              },
            ].sort((a, b) => b.last_message - a.last_message);
          }
        }

        // handle case where author !== recipient
        const message = prev.find(
          (m) =>
            (m.peer === event.payload.author ||
              m.peer === event.payload.recipient) &&
            m.peer !== user_profile.pubkey
        );
        if (message) {
          message.last_message = Math.max(
            message.last_message,
            event.payload.timestamp
          );
          // updatePeerProfile(message.peer);
          return [...prev].sort((a, b) => b.last_message - a.last_message);
        } else {
          const pubkey =
            user_profile.pubkey === event.payload.author
              ? event.payload.recipient
              : event.payload.author;

          updatePeerProfile(pubkey);

          return [
            ...prev,
            {
              peer: pubkey,
              last_message: event.payload.timestamp,
            },
          ].sort((a, b) => b.last_message - a.last_message);
        }
      });
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
