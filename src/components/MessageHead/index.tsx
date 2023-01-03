import info from "../../assets/info.png";
import verifIcon from "../../assets/verif.png";
import { toNpub } from "../../helpers/pubkey";

interface MessageHeadProps {
  name?: string;
  picture?: string;
  nip05?: string;
  peer: string;
}

const MessageHead: React.FC<MessageHeadProps> = ({
  name,
  picture,
  nip05,
  peer,
}) => {
  const npub = toNpub(peer);
  const npub_truncated: string =
    npub && npub.slice(0, 6) + "..." + npub.slice(-6);
  const display_name: string = name || (npub && npub_truncated) || "";
  const hover_text: string = npub;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(npub);
  };

  return (
    <>
      <div className="flex min-w-0 flex-row  border-b border-neutral-800 bg-neutral-800">
        <div
          className="group flex min-w-0 flex-1 cursor-pointer flex-row hover:ripple-bg-neutral-700"
          onClick={copyToClipboard}
        >
          <img
            src={picture || `https://robohash.org/${peer}.png`}
            alt="profile"
            className="m-3 h-10 w-10 rounded-lg border border-white border-opacity-20"
          />
          <div className="my-auto overflow-hidden truncate text-neutral-200">
            <h1 className="hidden truncate text-gray-400 group-hover:inline">
              {hover_text}
            </h1>

            <div className="group-hover:hidden">
              <h1 className="truncate leading-none text-neutral-200">
                {display_name}
              </h1>

              {nip05 && (
                <div className="flex flex-row">
                  <img
                    src={verifIcon.src}
                    className="my-auto mr-1 h-3 w-3 leading-none opacity-20"
                  />
                  <div className="flex items-center">
                    <span className="text-gray-400" style={{ height: 21 }}>
                      @{nip05.split("@")[1]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="my-auto mx-3 ml-auto cursor-pointer rounded-lg p-2 opacity-50 hover:ripple-bg-neutral-700">
          <img src={info?.src || ""} alt="info" className="h-5 w-5" />
        </div>
      </div>
    </>
  );
};

export default MessageHead;
