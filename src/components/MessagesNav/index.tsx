import { ConversationsListItem, Profiles, SetStringState } from "../../lib/types";
import MessagesNavHead from "../MessagesNavHead";
import MessagesNavList from "../MessagesNavList";

interface MessagesNavProps {
  message_list: ConversationsListItem[];
  peer: string;
  profiles: Profiles;
  setPeer: SetStringState;
}

const MessagesNav: React.FC<MessagesNavProps> = ({
  message_list,
  peer,
  profiles,
  setPeer,
}) => {
  return (
    <>
      <div
        style={{ gridTemplateRows: "min-content min-content 1fr" }}
        className="grid h-[100vh] bg-black border-neutral-600 border-r">
        <MessagesNavHead />
        <MessagesNavList {...{ message_list, peer, profiles, setPeer }} />
      </div>
    </>
  );
};

export default MessagesNav;
