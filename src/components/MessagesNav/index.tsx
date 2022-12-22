import MessagesNavHead from "../MessagesNavHead";
import MessagesNavList from "../MessagesNavList";

const MessagesNav = () => {
    
    return (
      <>
        <div className="w-[300px] h-[100vh] grid row-span-3 bg-black border-gray-600 border-r">
            <MessagesNavHead/>
            <MessagesNavList />
        </div>
      </>
    );
  };
  
export default MessagesNav;