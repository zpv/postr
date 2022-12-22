const NavigationHead = ({ icon, public_key, display_name }) => {
    return (
      <>
        <div className="flex flex-row p-4 cursor-pointer border-b border-gray-500">
            <img src={icon} className="rounded-lg h-12" />
            <div className="grid grid-rows-2 text-start gap-y-0 items-center">
                {/* <h1 className="text-xl mx-2 truncate overflow-hidden">{display_name ? display_name : "no name"}</h1> */}
                <h1 className="text-xl rounded-lg mx-1 px-1 truncate overflow-hidden hover:text-clip hover:bg-neutral-500 transition duration-300">{public_key}</h1>
                <h2 className="mx-2 text-neutral-600">View profile</h2>
            </div>
        </div>
      </>
    );
  };
  
export default NavigationHead;