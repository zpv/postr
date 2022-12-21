const NavigationButton = (props) => {
    const { name, icon } = props;
    console.log("12312",icon)
    return (
      <>
        <div className="cursor-pointer hover:bg-neutral-700 transition duration-100">
            <div className="flex flex-row px-4 py-4">
                <img src={icon.src} className="h-7 align-middle" />
                <div className="text-start gap-y-0 align-middle">
                    <h2 className="text-xl mx-2">{name}</h2>
                </div>
            </div>
        </div>
      </>
    );
  };
  
export default NavigationButton;