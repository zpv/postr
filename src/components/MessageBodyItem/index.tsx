  // ASSUMING FORMAT OF SINGLE MESSAGE IS
  // {
  //   "author": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d"
  //   "content": "Hello",
  //   "timestamp": 1671705410
  // }

const MessageBody = ({ author, content, timestamp, user_profile }) => {
    return (
      <>
        <div className={"w-full flex " + (author === user_profile.pubkey ? "justify-end" : "")}>
          <p className={"my-[0.5px] mx-5 py-1 px-4 rounded-md break-all max-w-xs lg:max-w-lg " + (author === user_profile.pubkey ? "bg-indigo-800" : "bg-neutral-800")}>{content}</p>
        </div>
      </>
    );
  };
  
  export default MessageBody;
