import MessagesNavHead from "../MessagesNavHead";
import MessagesNavListItem from "../MessagesNavListItem";

const MessagesNavList = ({ message_list, peer_profile, peer_profiles, setPeer }) => {

  const handleClick = (pubkey) => {
    setPeer(pubkey);
  };
  
  return (
    <>
      <div className="p-3">
          <input type="text" placeholder="Search..." className="rounded-sm w-full bg-neutral-800 px-2"/>
      </div>
      <div className="overflow-y-scroll h-full">
          {message_list.map((msg) => (
              <div onClick={() => handleClick(msg.peer)} className={"p-3 flex flex-row border-indigo-600 cursor-pointer transition duration-100 " + (peer_profile && msg.peer === peer_profile.pubkey ? "bg-neutral-900 border-r-2" : "hover:bg-neutral-900")}>
                <MessagesNavListItem {...peer_profiles[msg.peer]} { ...msg }/>
              </div>
          ))}
      </div>
    </>
  );
};

export default MessagesNavList;