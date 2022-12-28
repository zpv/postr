import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";

import { useEffect, useState } from "react";
import Message from "../../components/Message";

import MessagesNav from "../../components/MessagesNav";

const MessagesLayout = ({ user, peer, setPeer, profiles, setProfiles, lastRefresh, setLastRefresh, message_list, setMessageList }) => {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [onSubmit, setOnSubmit] = useState(false);
  const [loading, setLoading] = useState(true);

  const getMessages = async () => {
    if (Date.now() - lastRefresh < 30_000) {
      return message_list;
    }
    return await invoke("user_convos");
  };

  const getProfile = async (pubkey) => {
    return await invoke("user_profile", {
      pubkey: pubkey,
    })
      .then((r: any) => {
        return r;
      })
      .catch((e) => {
        console.log(`getProfile error (${e}) for: `, pubkey);
        return {
          pubkey: pubkey,
          failed: true,
        };
      });
  };

  const getProfiles = async (messages) => {
    if (Date.now() - lastRefresh < 30_000) {
      return message_list;
    } else {
      setLastRefresh(Date.now());
    }
    const res = profiles;
    for (const message of messages) {
      res[message.peer] = await getProfile(message.peer);
    }
    return res;
  };

  const refreshMessages = () =>
    getMessages()
      .then((messages: any) => {
        return getProfiles(messages)
          .then((profiles) => {
            setMessageList(messages);
            setProfiles((prev) => {
              return { ...prev, ...profiles };
            });
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {
        setMessageList([]);
        setProfiles({});
        setLoading(false);
        console.log(e);
      });

  useEffect(() => {
    const unlisten = listen("dm", (event: any) => {
      // if dm is for this peer, add it to the conversation
      if (
        peer === event.payload.author ||
        (user === event.payload.author && peer === event.payload.recipient)
      ) {
        setConversation((prev) => [...prev, event.payload]);
      }

      console.log(event)
      // everything below here is to update message list

      // setup profile if it doesn't exist
      const updatePeerProfile = (peer_pubkey) => {
        const peer_profile = profiles[peer_pubkey];
        if (!peer_profile) {
          getProfile(peer_pubkey).then((profile) => {
            setProfiles((prev_profiles) => {
              prev_profiles[peer_pubkey] = profile;
              return prev_profiles;
            });
          });
        }
      };

      // update message list to move most recent message to top
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

        // handle rest of cases
        const message = prev.find(
          (m) =>
            (m.peer === event.payload.author ||
              m.peer === event.payload.recipient) &&
            m.peer !== user
        );
        if (message) {
          message.last_message = Math.max(
            message.last_message,
            event.payload.timestamp
          );
          return [...prev].sort((a, b) => b.last_message - a.last_message);
        } else {
          const pubkey =
            user === event.payload.author
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
    if (peer !== "") {
      setLoading(true);
      (async () => {
        if (!profiles[peer] || profiles[peer].failed) {
          const profile = await getProfile(peer);
          console.log("using default profile for ", profile);
          setProfiles((prev) => {
            return { ...prev, [peer]: profile };
          });
        }
        const switchConversation = async () => {
          return await invoke("user_dms", { peer, limit: 40 });
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
      })();
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
          peer,
          profiles,
          setPeer,
        }}
      />
      <Message
        {...{
          user,
          peer_profile: profiles[peer],
          peer,
          conversation,
          loading,
          message,
          setMessage,
          setOnSubmit,
          setConversation,
        }}
      />
    </>
  );
};

export default MessagesLayout;
