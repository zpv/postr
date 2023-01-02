import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";

import { useEffect, useState } from "react";
import Message from "../../components/Message";

import MessagesNav from "../../components/MessagesNav";
import {
  ConversationsListItem,
  DmEvent,
  Profile,
  Profiles,
  SetConversationsListState,
  SetNumberState,
  SetProfilesState,
  SetStringState,
  SingleMessage,
} from "../../lib/types";

interface MessagesLayoutProps {
  user: string;
  peer: string;
  setPeer: SetStringState;
  profiles: Profiles;
  setProfiles: SetProfilesState;
  lastRefresh: number;
  setLastRefresh: SetNumberState;
  message_list: ConversationsListItem[];
  setMessageList: SetConversationsListState;
}

const MessagesLayout: React.FC<MessagesLayoutProps> = ({
  user,
  peer,
  setPeer,
  profiles,
  setProfiles,
  lastRefresh,
  setLastRefresh,
  message_list,
  setMessageList,
}) => {
  const [message, setMessage] = useState<string>("");
  const [conversation, setConversation] = useState<SingleMessage[]>([]);
  const [onSubmit, setOnSubmit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const getMessages: () => Promise<ConversationsListItem[]> = async () => {
    if (Date.now() - lastRefresh < 30_000) {
      return message_list;
    }
    return await invoke<ConversationsListItem[]>("user_convos");
  };

  const getProfile: (pubkey: string) => Promise<Profile> = async (
    pubkey: string
  ) => {
    return await invoke<Profile>("user_profile", {
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

  const getProfiles: (
    messages: ConversationsListItem[]
  ) => Promise<Profiles> = async (messages: ConversationsListItem[]) => {
    if (Date.now() - lastRefresh < 30_000) {
      return profiles;
    }
    setLastRefresh(Date.now());
    const res: Profiles = profiles;
    const raw_profiles = await invoke<Profile[]>("user_profiles", {
      pubkeys: messages.map((m) => m.peer),
    });

    for (const raw_profile of raw_profiles) {
      res[raw_profile.pubkey] = raw_profile;
    }
    return res;
  };

  const refreshMessages: () => Promise<void> = () =>
    getMessages()
      .then(async (messages: ConversationsListItem[]) => {
        try {
          const profiles: Profiles = await getProfiles(messages);
          setMessageList(messages);
          setProfiles((prev) => {
            return { ...prev, ...profiles };
          });
        } catch (e) {
          console.log(e);
        }
      })
      .catch((e) => {
        setMessageList([]);
        setProfiles({});
        setLoading(false);
        console.log(e);
      });

  useEffect(() => {
    const unlisten: Promise<UnlistenFn> = listen("dm", (event: DmEvent) => {
      console.log("listening");
      // if dm is for this peer, add it to the conversation
      if (
        peer === event.payload.author ||
        (user === event.payload.author && peer === event.payload.recipient)
      ) {
        setConversation((prev) => {
          const new_conversation: SingleMessage[] = [...prev];

          // to save time, check if should be pushed immediately
          if (new_conversation.length === 0 || new_conversation[new_conversation.length - 1].timestamp < event.payload.timestamp) {
            new_conversation.push(event.payload); 
            return new_conversation;
          }

          // search for insertion point
          let index: number = new_conversation.length;
          let low: number = 0;
          let high: number = new_conversation.length - 1;
          while (low <= high) {
            const mid: number = Math.floor((low + high) / 2);
            if (new_conversation[mid].timestamp > event.payload.timestamp) {
              index = mid;
              high = mid - 1;
            } else {
              low = mid + 1;
            }
          }
          new_conversation.splice(index, 0, event.payload);
          return new_conversation;
        });
      }

      console.log(event);
      // everything below here is to update message list

      // setup profile if it doesn't exist
      const updatePeerProfile = (peer_pubkey: string) => {
        const peer_profile: Profile = profiles[peer_pubkey];
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
      setMessageList((prev: ConversationsListItem[]) => {
        // handle case where author === recipient (i.e. sending to self)
        if (event.payload.author === event.payload.recipient) {
          const message: ConversationsListItem = prev.find(
            (m) => m.peer === event.payload.author
          );
          if (message) {
            message.last_message = Math.max(
              message.last_message,
              event.payload.timestamp
            );
            return [...prev].sort((a, b) => b.last_message - a.last_message);
          } else {
            const pubkey: string = event.payload.author;

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
        const message: ConversationsListItem = prev.find(
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
          const pubkey: string =
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
          const profile: Profile = await getProfile(peer);
          console.log("using default profile for ", profile);
          setProfiles((prev) => {
            return { ...prev, [peer]: profile };
          });
        }
        const switchConversation: () => Promise<SingleMessage[]> = async () => {
          return await invoke<SingleMessage[]>("user_dms", { peer, limit: 40 });
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
      const sendMessage: () => Promise<void> = async () => {
        return await invoke<void>("send_dm", { peer, message });
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
