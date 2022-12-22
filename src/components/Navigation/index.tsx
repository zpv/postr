import NavigationHead from "../NavigationHead";
import NavigationButton from "../NavigationButton";
import activity from "../../images/nav_activity.png";
import message from "../../images/nav_message.png";

const buttons = [
  {
    name: "Messages",
    icon: message,
    href: "/messages",
  },
  {
    name: "Feed",
    icon: activity,
    href: "/feed",
  },
]

const Navigation = ({ icon, display_name, public_key, tab }) => {
  return (
    <>
        <div className="bg-black border-gray-600 border-r w-[200px] h-[100vh]">
            <NavigationHead {...{icon, public_key, display_name}}/>
            {buttons.map((button) => (
                <NavigationButton {...button} {...{tab}}/>
            ))}
        </div>
    </>
  );
};

export default Navigation;