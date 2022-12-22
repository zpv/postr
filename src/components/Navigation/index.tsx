import NavigationHead from "../NavigationHead";
import NavigationButton from "../NavigationButton";
import activity from "../../assets/nav_activity.png";
import message from "../../assets/nav_message.png";

const Navigation = ({ user_profile, tab }) => {
  const { picture, name, pubkey } = user_profile;
  const buttons = [
    {
      name: "Messages",
      icon: message,
      href: "/messages?pubkey=" + pubkey,
    },
    {
      name: "Feed",
      icon: activity,
      href: "/feed?pubkey=" + pubkey,
    },
  ]

  return (
    <>
        <div className="bg-black border-gray-600 border-r h-[100vh]">
            <NavigationHead {...{picture, pubkey, name}}/>
            {buttons.map((button) => (
                <NavigationButton {...button} {...{tab}}/>
            ))}
        </div>
    </>
  );
};

export default Navigation;