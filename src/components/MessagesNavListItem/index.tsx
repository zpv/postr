import verifIcon from "../../assets/verif.png";
import { toNpub } from "../../helpers/pubkey";
import getFormattedMsgRecvTime from "../../helpers/timeHelpers";

interface MessagesNavListItemProps {
  nip05?: string;
  last_message: number;
  picture?: string;
  name?: string;
  peer: string;
}

const MessagesNavListItem: React.FC<MessagesNavListItemProps> = ({
  nip05,
  last_message,
  picture,
  name,
  peer,
}) => {
  const npub = toNpub(peer);
  const npub_truncated: string =
    npub && npub.slice(0, 6) + "..." + npub.slice(-6);
  const display: string = name || (npub && npub_truncated) || "";

  const hover_text: string =
    (nip05 && "@" + nip05?.split("@")[1]) || npub_truncated;

  // last_message is a temporarily? a unix timestamp
  const timestamp_string: string = getFormattedMsgRecvTime(last_message);

  return (
    <>
      <img
        src={picture || `https://robohash.org/${peer}.png`}
        className="mr-2 h-12 w-12 flex-shrink-0 rounded-lg border border-neutral-700 bg-neutral-900 object-contain"
      />
      <div className="hidden w-full grid-rows-2 xs:grid">
        <div className={"group flex w-[160px] flex-row"}>
          {/* if mouse hovers over -> show */}
          <h1 className="hidden truncate text-gray-400 group-hover:inline">
            {hover_text}
          </h1>

          {/* if mouse hovers over -> hide */}
          <h1 className="truncate overflow-ellipsis group-hover:hidden">
            {display}
          </h1>
          {nip05 && (
            <img
              src={verifIcon.src}
              className="my-auto ml-1 h-3 w-3 opacity-20 group-hover:hidden"
            />
          )}
        </div>
        <p className="truncate text-xs text-neutral-500">{timestamp_string}</p>
      </div>
    </>
  );
};

export default MessagesNavListItem;
