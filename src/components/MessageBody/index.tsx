import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useRef, useState } from "react";
import MessageBodyItem from "../MessageBodyItem";

const MessageBody = ({ conversation, user, setConversation, peer }) => {
  const messageRef = useRef();
  const [isFirstLoad, setFirstLoad] = useState(true);
  const [current_scroll, setCurrentScroll] = useState(0);
  const [loadedMore, setLoadedMore] = useState(false);

  // useEffect(() => {
  //   // Set up a timer to check for new messages every 5 seconds
  //   const interval = setInterval(() => {
  //     // Check if the element has a scrollbar
  //     const element = messageRef.current as HTMLDivElement;
  //     if (element.scrollHeight > element.clientHeight) {
  //       // If the element has a scrollbar, do nothing
  //       return;
  //     }

  //     // If the element does not have a scrollbar, fetch new messages
  //     const until = conversation[0].timestamp;
  //     invoke("user_dms", {
  //       peer,
  //       until: until,
  //       limit: 50,
  //     }).then((r) => {
  //       setConversation((prev) => [...r, ...prev]);
  //     });
  //   }, 5000);

  //   // Clean up the timer when the component unmounts
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [conversation]);

  useEffect(() => {
    
    // if first load, scroll to bottom
    if (isFirstLoad) {
      setFirstLoad(false);
      const element = messageRef.current as HTMLDivElement;
      element.scrollTop = element.scrollHeight;
    }

    // Set a flag to indicate whether a load is in progress
    let isFetching = false;

    if (conversation.length === 0) {
      return;
    }

    const element = messageRef.current as HTMLDivElement;
    const until = conversation[0].timestamp;
    const scrollHandler = () => {
      // if scroll to bottom, setCurrentScroll so that we can stay at bottom if messages are added
      if (element.scrollTop + element.clientHeight === element.scrollHeight) {
        setCurrentScroll(element.scrollHeight);
      }
      // if scroll to top, load more messages
      else if (element.scrollTop === 0 && !isFetching) {
        console.log("fetching more")
        isFetching = true;
        setCurrentScroll(element.scrollHeight);
        invoke("user_dms", {
          peer,
          until: until,
          limit: 20,
        }).then((r: any) => {
          // wait 5 secs to simulate lag
          // setTimeout(() => {
          setConversation((prev) => {
            console.log("fetching done")
            // check if prev is the same peer or last timestamp is behind of r[0] timestamp
            if (!r[0] || !prev[0] || (prev[0].author !== peer && prev[0].recipient !== peer)
              || prev[0].timestamp < r[0].timestamp) {
              console.log("no more or not same peer");
              return [...prev];
            }
            setLoadedMore(true);
            return [...r, ...prev];
          });
          // }, 5000);
        });
      }
    };

    // requestAnimationFrame to wait for DOM to update before scrolling
    requestAnimationFrame(() => {
      // if at bottom, stay at bottom
      if (element.scrollTop + element.clientHeight === current_scroll) {
        element.scrollTop = element.scrollHeight;
      }
      // if loaded more, scroll to previous position
      else if (loadedMore) {
        element.scrollTop = element.scrollHeight - current_scroll;
        setLoadedMore(false);
        isFetching = false;
      }
    });
    element.addEventListener("scroll", scrollHandler);
    return () => {
      element.removeEventListener("scroll", scrollHandler);
    };
  }, [conversation]);

  return (
    <>
      <div
        ref={messageRef}
        className="py-5 w-full overflow-y-auto overflow-x-hidden h-full">
        {conversation.map((message_content) => {
          return <MessageBodyItem {...message_content} {...{ user }} />;
        })}
      </div>
    </>
  );
};

export default MessageBody;
