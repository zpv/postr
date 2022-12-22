import { useEffect, useState } from "react";
import MessageBody from "../MessageBody";
import MessageCompose from "../MessageCompose";
import MessageHead from "../MessageHead";


const Message = ({ user_profile, peer_profile, peer }) => {
  const MOCK_DATA2 = [
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    }
  ]
  
  const MOCK_DATA = [
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
    {
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },{
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },{
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },{
      "id": "2",
      "sender": user_profile.pubkey,
      "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "message": "Sup",
      "timestamp": "2021-07-01T00:01:00Z"
    },
    {
      "id": "1",
      "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
      "receiver": user_profile.pubkey,
      "message": "Hello",
      "timestamp": "2021-07-01T00:00:00Z"
    },
  ]
  const [conversation, setConversation] = useState(MOCK_DATA);
  
  // for simulating switching convos
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    // setConversation([]);       // will we need this? 
    
    // simulate switching convos
    const wait = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setConversation(toggle ? MOCK_DATA : MOCK_DATA2);
    }
    setToggle(!toggle);
    wait();
  }, [peer]);


  // Mock data
  // [
  //   {
  //     "id": "1",
  //     "sender": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
  //     "receiver": user_profile.pubkey,
  //     "message": "Hello",
  //     "timestamp": "2021-07-01T00:00:00Z"
  //   },
  //   {
  //     "id": "2",
  //     "sender": user_profile.pubkey,
  //     "receiver": "3f2a859b68e9cf09c9c7a9d7173b8a66b14557261c7b8376df100af73eb12e3d",
  //     "message": "Sup",
  //     "timestamp": "2021-07-01T00:01:00Z"
  //   },
  // ]

  // use useEffect to fetch conversation from database

  const messageBody = (
    <>
      <div style={{ gridTemplateRows: "min-content 1fr min-content" }} className="grid h-[100vh] w-full">
        <MessageHead {...peer_profile} />
        <MessageBody {...{conversation, user_profile}}/>
        <MessageCompose />
      </div>
    </>
  );

  return (
    <>
      {peer !== "" && messageBody}
    </>
  );
};
  
export default Message;