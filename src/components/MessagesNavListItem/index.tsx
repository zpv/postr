const MessagesNavListItem = (props) => {
    const { public_key, last_message, display_name, icon } = props;
    const name = display_name || public_key;
    return (
      <>
        <div className="flex flex-row p-4 hover:bg-neutral-900 cursor-pointer transition duration-100">
            <img src={icon} className="rounded-lg h-12 mr-2" />
            <div className="grid grid-rows-2">
                <h1 className="truncate overflow-hidden">{name}</h1>
                <p className="text-neutral-500 truncate overflow-hidden">{last_message}</p>
            </div>
        </div>
      </>
    );
  };
  
export default MessagesNavListItem;