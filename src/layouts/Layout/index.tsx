import Navigation from "../../components/Navigation";
import { Profile } from "../../lib/types";

interface LayoutProps {
  user_profile: Profile;
  tab: string;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user_profile, tab, children }) => {
  return (
    <>
      <Navigation {...{ user_profile, tab }} />
      {children}
    </>
  );
};

export default Layout;
