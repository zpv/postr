import MessagesNavHead from "../MessagesNavHead";
import MessagesNavList from "../MessagesNavList";

const MessagesNav = ({ message_list, peer, setPeer }) => {
    return (
      <>
        <div style={{ gridTemplateRows: "min-content min-content 1fr" }} className="grid h-[100vh] bg-black border-neutral-600 border-r">
            <MessagesNavHead/>
            <MessagesNavList {...{message_list, peer, setPeer}}/>
        </div>
      </>
    );
  };
  
export default MessagesNav;