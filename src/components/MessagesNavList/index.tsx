import { useEffect, useState } from "react";
import { toNpub, toPubkeyOrNone } from "../../helpers/pubkey";
import {
  ConversationsListItem,
  Profiles,
  SetStringState,
  SuggestionItem,
} from "../../lib/types";
import MessagesNavListItem from "../MessagesNavListItem";

interface MessagesNavListProps {
  message_list: ConversationsListItem[];
  peer: string;
  profiles: Profiles;
  setPeer: SetStringState;
}

const MessagesNavList: React.FC<MessagesNavListProps> = ({
  message_list,
  peer,
  profiles,
  setPeer,
}) => {
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  const handleClick = (pubkey: string) => {
    setPeer(pubkey);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // if searchFilter is a valid pubkey (sha256 hexadecimal string), set peer to that pubkey
    // else, set peer to the first pubkey that matches the searchFilter
    const pubkey = toPubkeyOrNone(searchFilter);
    if (pubkey) {
      setPeer(pubkey);
    } else {
      for (let i = 0; i < message_list.length; i++) {
        if (!filteredOut(message_list[i])) {
          setPeer(message_list[i].peer);
          break;
        }
      }
    }
  };

  const filteredOut = (msg: ConversationsListItem) => {
    const pubkey = msg.peer;
    const name = profiles[pubkey]?.name;
    const nip05 = profiles[pubkey]?.nip05;
    const npub = toNpub(pubkey);

    return (
      !name?.toLowerCase().startsWith(searchFilter.toLowerCase()) &&
      !npub?.toLowerCase().startsWith(searchFilter.toLowerCase()) &&
      !pubkey?.toLowerCase().startsWith(searchFilter.toLowerCase()) &&
      !nip05?.toLowerCase().startsWith(searchFilter.toLowerCase()) &&
      !(nip05 && "@" + nip05.toLowerCase().split("@")[1])?.startsWith(
        searchFilter.toLowerCase()
      )
    );
  };

  useEffect(() => {
    // nip-05 starts with @ followed by a domain name like @example.com
    // example.com/.well-known/nostr.json has a json of format
    // {
    //   "names": {
    //     "steven": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
    //     "kelvin": "73ee0c7420638fe8e01e528a6af60c272a1786a752e4249158f79ded8f0ef9c8",
    //     "_": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d"
    //   }
    // }
    // if searchFilter starts with @, get the json from the domain name and set suggestions to the list of names

    const fetchSuggestions = async () => {
      if (searchFilter !== "" && searchFilter.includes("@")) {
        const local_part = searchFilter.split("@")[0];
        const domain = searchFilter.split("@")[1];
        if (!domain.includes(".") || domain.split(".")[1].length < 2) {
          return;
        }

        const handleFetch = async () => {
          if (local_part) {
            return await fetch(
              `https://${domain}/.well-known/nostr.json?name=${local_part}`
            );
          } else {
            return await fetch(`https://${domain}/.well-known/nostr.json`);
          }
        };

        handleFetch()
          .then((response) => response.json())
          .then((data) => {
            // if "_" exists, then create a suggestion for it with the name being "Root"
            if (data.names["_"]) {
              const pubkey = data.names["_"];
              const nip05 = "@" + domain;
              const suggestion = {
                peer: pubkey,
                name: "_",
                last_message: "NIP-05 maintainer", // ugly hack for subtext ### TODO: fix this when last_message is no longer a timestamp lol
                nip05,
              };
              delete data.names["_"];
              setSuggestions([suggestion]);
            }
            const names = data.names;
            // delete names[name] if the pubkey is already in the message_list
            // const pubkeys: string[] = Object.values(names);
            // for (let i = 0; i < message_list.length; i++) {
            //   const pubkey = message_list[i].peer;
            //   if (pubkeys.includes(pubkey)) {
            //     delete names[
            //       Object.keys(names).find((key) => names[key] === pubkey)
            //     ];
            //   }
            // }
            const suggestions = Object.keys(names).map((name) => {
              const pubkey = names[name];
              const nip05 = name + "@" + domain;
              return {
                peer: pubkey,
                name,
                nip05,
              };
            });
            setSuggestions((prev) => [...prev, ...suggestions]);
          })
          .catch((error) => {
            console.log("Not a valid domain: ", error);
          });
      }
    };

    setSuggestions([]);

    // set timer to not fetch too often
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchFilter]);

  return (
    <>
      <div className="hidden p-3 xs:block">
        <form
          onSubmit={handleSubmit}
          className="flex flex-row items-center justify-between"
        >
          <input
            type="text"
            placeholder="Search... (nip05, npub, name)"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-sm border border-neutral-700 bg-neutral-800 px-2 outline-none focus:placeholder-transparent"
          />
        </form>
      </div>

      <div className="h-full overflow-y-auto overflow-x-hidden">
        {message_list.map((msg: ConversationsListItem) => {
          if (searchFilter !== "") {
            if (filteredOut(msg)) {
              return <></>;
            }
          }
          return (
            <div
              onClick={() => handleClick(msg.peer)}
              className={
                "flex cursor-pointer flex-row border-indigo-600 p-3 " +
                (peer && msg.peer === peer
                  ? "border-r-2 bg-neutral-900"
                  : "hover:bg-neutral-900 active:bg-opacity-70")
              }
              key={msg.peer}
            >
              <MessagesNavListItem {...profiles[msg.peer]} {...msg} />
            </div>
          );
        })}
        {searchFilter !== "" &&
          searchFilter.includes("@") &&
          suggestions.length > 0 && (
            <>
              <div className="border-b border-neutral-600 px-3 py-2 text-center">
                <p className="text-sm text-neutral-500">
                  @{searchFilter.split("@")[1]}
                </p>
              </div>
              {suggestions.map((s: SuggestionItem) => {
                return (
                  <div
                    onClick={() => handleClick(s.peer)}
                    className={
                      "flex cursor-pointer flex-row border-indigo-600 p-3 transition duration-100 " +
                      (peer && s.peer === peer
                        ? "border-r-2 bg-neutral-900"
                        : "hover:bg-neutral-900")
                    }
                    key={s.name + s.peer}
                  >
                    <MessagesNavListItem {...profiles[s.peer]} {...s} />
                  </div>
                );
              })}
            </>
          )}
      </div>
    </>
  );
};

export default MessagesNavList;
