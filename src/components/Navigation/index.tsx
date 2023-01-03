import NavigationHead from "../NavigationHead";
import NavigationButton from "../NavigationButton";
import activity from "../../assets/nav_activity.png";
import message from "../../assets/nav_message.png";
import { Profile } from "../../lib/types";

interface NavigationProps {
  user_profile: Profile;
  tab: string;
}

const Navigation: React.FC<NavigationProps> = ({ user_profile, tab }) => {
  const buttons: any = [
    {
      id: 1,
      name: "Messages",
      icon: message,
      href: "/messages",
    },
    {
      id: 2,
      name: "Feed",
      icon: activity,
      href: "/feed",
    },
  ];

  return (
    <>
      <div className="h-[100vh] border-r border-neutral-600 bg-black">
        <NavigationHead {...user_profile} />
        {buttons.map((button) => (
          <NavigationButton {...button} {...{ tab }} key={button.id} />
        ))}
      </div>
    </>
  );
};

export default Navigation;
