import { useState } from "react";
import MessagesNavHead from "../MessagesNavHead";
import MessagesNavListItem from "../MessagesNavListItem";

const MessagesNavList = ({ message_list, peer, profiles, setPeer }) => {
  const [searchFilter, setSearchFilter] = useState("");

  const handleClick = (pubkey) => {
    setPeer(pubkey);
  };

  return (
    <>
      <div className="p-3">
        <input
          type="text"
          placeholder="Search..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="rounded-sm w-full bg-neutral-800 px-2 placeholder-neutral-500 focus:placeholder-opacity-0"
        />
      </div>

      
      <div className="overflow-y-scroll h-full">
        {message_list.map((msg) => {

          if (searchFilter !== "") {
            if (
              !profiles[msg.peer]?.name
                ?.toLowerCase()
                .includes(searchFilter.toLowerCase()) &&
              !profiles[msg.peer]?.pubkey
                ?.toLowerCase()
                .includes(searchFilter.toLowerCase()) &&
              !profiles[msg.peer]?.nip05
                ?.toLowerCase()
                .includes(searchFilter.toLowerCase()) &&
              !profiles[msg.peer]?.nip05
                ?.toLowerCase()
                .split("@")[1]
                .includes(searchFilter.toLowerCase())
            ) {
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
              }>
              <MessagesNavListItem {...profiles[msg.peer]} {...msg} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MessagesNavList;
