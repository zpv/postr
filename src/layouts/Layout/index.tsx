import Navigation from "../../components/Navigation";

const Layout = ({ user_profile, tab, children }) => {
  return (
    <>
      <Navigation {...{ user_profile, tab }} />
      {children}
    </>
  );
};

export default Layout;
