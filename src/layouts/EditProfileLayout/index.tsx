import EditProfile from "../../components/EditProfile";

const EditProfileLayout = ({
  user_profile,
  setProfiles,
  setLastRefresh,
  setPeer,
  setMessageList,
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
        }}
      />
    </div>
  );
};

export default EditProfileLayout;
