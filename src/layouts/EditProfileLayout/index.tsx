import EditProfile from "../../components/EditProfile";
import { ConversationsListItem, Profile, Profiles, SetConversationsListState, SetListenFuncState, SetNumberState, SetProfilesState, SetStringState } from "../../lib/types";

interface EditProfileLayoutProps {
  user_profile: Profile;
  setProfiles: SetProfilesState;
  setLastRefresh: SetNumberState;
  setPeer: SetStringState;
  setMessageList: SetConversationsListState;
  setListenFunc: SetListenFuncState;
  listenFunc: Promise<void>;
}

const EditProfileLayout: React.FC<EditProfileLayoutProps> = ({
  user_profile,
  setProfiles,
  setLastRefresh,
  setPeer,
  setMessageList,
  listenFunc,
  setListenFunc,
}) => {
  return (
    <div className="px-3 pt-3 overflow-y-scroll max-h-[100vh]">
      <EditProfile
        {...{
          user_profile,
          setProfiles,
          setLastRefresh,
          setPeer,
          setMessageList,
          listenFunc,
          setListenFunc,
        }}
      />
    </div>
  );
};

export default EditProfileLayout;
