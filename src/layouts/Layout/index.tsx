import React from "react"
import Navigation from "../../components/Navigation";

const Layout = ({user_profile, tab, user, children}) => {
  return (
    <>
      <div className="bg-neutral-900 w-full h-full overflow-hidden">
        <div className="grid grid-cols-[180px_200px_1fr] h-full">
          <Navigation {...{user_profile, tab, user}}/>
          {children}
        </div>
      </div>
    </>
  )
}

export default Layout