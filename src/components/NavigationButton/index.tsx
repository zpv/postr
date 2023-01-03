import { StaticImageData } from "next/image";
import Link from "next/link";

interface NavigationButtonProps {
  name: string;
  icon: StaticImageData;
  tab: string;
  href: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  name,
  icon,
  tab,
  href,
}) => {
  return (
    <>
      <div
        className={
          "cursor-pointer border-indigo-600 transition duration-100" +
          (name === tab
            ? " border-r-2 bg-neutral-900"
            : " hover:bg-neutral-900")
        }
      >
        <Link href={href}>
          <div className="flex flex-row px-4 py-4">
            <img src={icon.src} className="h-6 align-middle" />
            <div className="gap-y-0 text-start align-middle">
              <h2 className="mx-2 text-lg">{name}</h2>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
};

export default NavigationButton;
