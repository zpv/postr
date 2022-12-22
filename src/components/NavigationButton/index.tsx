import Link from 'next/link';

const NavigationButton = ({ name, icon, tab, href }) => {
    
    return (
      <>
        <div className={"cursor-pointer transition duration-200 border-indigo-600 " + (name === tab ? " bg-neutral-900 border-r" : " hover:bg-neutral-900")}>
            <Link href={href}>
            <div className="flex flex-row px-4 py-4">
                <img src={icon.src} className="h-7 align-middle" />
                <div className="text-start gap-y-0 align-middle">
                    <h2 className="text-xl mx-2">{name}</h2>
                </div>
            </div>
            </Link>
        </div>
      </>
    );
  };
  
export default NavigationButton;