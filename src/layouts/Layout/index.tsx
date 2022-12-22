import React from "react"
import Navigation from "../../components/Navigation";

const Layout = (props) => {
  return (
    <>
      <div className="bg-neutral-900 w-full h-full">
        <div className="flex flex-row h-full">
          <Navigation {...props}/>
          {props.children}
        </div>
      </div>
    </>
  )
}

export default Layout