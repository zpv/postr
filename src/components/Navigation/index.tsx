import NavigationHead from "../NavigationHead";
import NavigationButton from "../NavigationButton";
import activity from "../../assets/nav_activity.png";
import message from "../../assets/nav_message.png";

const Navigation = ({ user_profile, tab }) => {
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
  ];

  return (
    <>
      <div className="bg-black border-neutral-600 border-r h-[100vh]">
        <NavigationHead {...user_profile} />
        {buttons.map((button) => (
          <NavigationButton {...button} {...{ tab }} />
        ))}
      </div>
    </>
  );
};

export default Navigation;
