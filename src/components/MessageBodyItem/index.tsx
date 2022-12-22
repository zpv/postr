const MessageBody = ({ message, sender, receiver, user_profile }) => {
    return (
      <>
        <div className={"w-full flex " + (sender === user_profile.pubkey ? "justify-end" : "")}>
          <p className={"my-[0.5px] mx-5 py-1 px-4 rounded-md break-all max-w-xs lg:max-w-lg " + (sender === user_profile.pubkey ? "bg-indigo-800" : "bg-neutral-800")}>{message}</p>
        </div>
      </>
    );
  };
  
  export default MessageBody;
