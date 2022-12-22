const MessagesNavListItem = (props) => {
    const { public_key, last_message, display_name, icon } = props;
    const name = display_name || public_key;
    return (
      <>
          <img src={icon} className="rounded-lg h-12 mr-2" />
          <div className="grid grid-rows-2">
              <h1 className="truncate overflow-hidden">{name}</h1>
              <p className="text-neutral-500 truncate overflow-hidden">{last_message}</p>
          </div>
      </>
    );
  };
  
export default MessagesNavListItem;