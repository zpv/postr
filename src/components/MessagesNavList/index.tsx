import MessagesNavHead from "../MessagesNavHead";
import MessagesNavListItem from "../MessagesNavListItem";

const MessagesNavList = ({ message_list, peer, setPeer }) => {

  const handleClick = (pubkey) => {
    setPeer(pubkey);
  };
  
  return (
    <>
      <div className="p-3">
          <input type="text" placeholder="Search..." className="rounded-sm w-full bg-neutral-800 px-2"/>
      </div>
      <div className="overflow-scroll h-full">
          {message_list.map((user) => (
              <div onClick={() => handleClick(user.public_key)} className={"p-3 flex flex-row border-indigo-600 cursor-pointer transition duration-100 " + (user.public_key === peer ? "bg-neutral-900 border-r-2" : "hover:bg-neutral-900")}>
                <MessagesNavListItem key={user.id} {...user}/>
              </div>
          ))}
      </div>
    </>
  );
};

export default MessagesNavList;