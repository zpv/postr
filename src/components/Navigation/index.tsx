import ProfileHeader from "../ProfileHeader";
import NavigationButton from "../NavigationButton";
import activity from "../../images/nav_activity.png";
import message from "../../images/nav_message.png";

const buttons = [
  {
    name: "Message",
    icon: message,
  },
  {
    name: "Feed",
    icon: activity,
  },
]

const Navigation = (props) => {
  return (
    <>
        <div className="bg-black border-gray-600 border-r">
            <ProfileHeader {...props}/>
            {buttons.map((button) => (
                <NavigationButton {...button}/>
            ))}
        </div>
    </>
  );
};

export default Navigation;