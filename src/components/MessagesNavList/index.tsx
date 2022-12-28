import { useState } from "react";
import MessagesNavListItem from "../MessagesNavListItem";

const MessagesNavList = ({ message_list, peer, profiles, setPeer }) => {
  const [searchFilter, setSearchFilter] = useState("");

  const handleClick = (pubkey) => {
    setPeer(pubkey);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // if searchFilter is a valid pubkey (sha256 hexadecimal string), set peer to that pubkey
    // else, set peer to the first pubkey that matches the searchFilter
    if (
      searchFilter.length === 64 &&
      searchFilter.match(/^[0-9A-Fa-f]+$/i) !== null
    ) {
      setPeer(searchFilter);
    } else {
      for (let i = 0; i < message_list.length; i++) {
        if (!filteredOut(message_list[i])) {
          setPeer(message_list[i].peer);
          break;
        }
      }
    }
  };

  const filteredOut = (msg) => {
    const { name, pubkey, nip05 } = profiles[msg.peer];

    return (
      !name?.toLowerCase().startsWith(searchFilter.toLowerCase()) &&
      !pubkey?.toLowerCase().startsWith(searchFilter.toLowerCase()) &&
      !nip05?.toLowerCase().startsWith(searchFilter.toLowerCase()) &&
      !(nip05 && "@" + nip05.toLowerCase().split("@")[1])?.startsWith(
        searchFilter.toLowerCase()
      )
    );
  };

  return (
    <>
      <div className="p-3">
        <form
          onSubmit={handleSubmit}
          className="flex flex-row items-center justify-between"
        >
          <input
            type="text"
            placeholder="Search... (nip05, pubkey, name)"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="rounded-sm w-full bg-neutral-800 px-2 placeholder-neutral-500 focus:placeholder-opacity-0 border border-neutral-700"
          />
        </form>
      </div>

      <div className="overflow-y-auto h-full">
        {message_list.map((msg) => {
          if (searchFilter !== "") {
            if (filteredOut(msg)) {
              return <></>;
            }
          }
          return (
            <div
              onClick={() => handleClick(msg.peer)}
              className={
                "p-3 flex flex-row border-indigo-600 cursor-pointer transition duration-100 " +
                (peer && msg.peer === peer
                  ? "bg-neutral-900 border-r-2"
                  : "hover:bg-neutral-900")
              }
            >
              <MessagesNavListItem {...profiles[msg.peer]} {...msg} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MessagesNavList;
