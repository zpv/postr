import {
  ConversationsListItem,
  Profiles,
  SetProfilesState,
  SetStringState,
} from "../../lib/types";
import MessagesNavHead from "../MessagesNavHead";
import MessagesNavList from "../MessagesNavList";

interface MessagesNavProps {
  message_list: ConversationsListItem[];
  peer: string;
  setProfiles: SetProfilesState;
  profiles: Profiles;
  setPeer: SetStringState;
}

const MessagesNav: React.FC<MessagesNavProps> = ({
  message_list,
  peer,
  setProfiles,
  profiles,
  setPeer,
}) => {
  return (
    <>
      <div
        className="grid xs:grid-rows-[min-content_min-content_1fr] h-[100vh] border-r border-neutral-600 bg-black"
      >
        <MessagesNavHead />
        <MessagesNavList {...{ message_list, peer, profiles, setProfiles, setPeer }} />
      </div>
    </>
  );
};

export default MessagesNav;
