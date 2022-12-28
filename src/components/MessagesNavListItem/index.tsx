import verifIcon from "../../assets/verif.png";
import getFormattedMsgRecvTime from "../../helpers/timeHelpers";

const MessagesNavListItem = ({ nip05, last_message, picture, name, peer }) => {
  const display = name || (peer && peer.slice(0, 6)) || "";
  const pubkey_truncated = peer && peer.slice(0, 6) + "..." + peer.slice(-6);
  const hover_text = (nip05 && "@" + nip05?.split("@")[1]) || pubkey_truncated;

  const verif = verifIcon;

  // last_message is a temporarily? a unix timestamp
  last_message = getFormattedMsgRecvTime(last_message);

  return (
    <>
      <img
        src={picture || `https://robohash.org/${peer}.png`}
        className="rounded-lg h-12 mr-2 border-white border border-opacity-20 bg-neutral-900"
      />
      <div className="grid grid-rows-2 w-full">
        <div
          style={{ gridTemplateRows: "1fr" }}
          className={"flex flex-row group w-[160px]"}>
          {/* if mouse hovers over -> show */}
            <h1 className="text-gray-400 truncate hidden group-hover:inline">{hover_text}</h1>

          {/* if mouse hovers over -> hide */}
          <h1 className="group-hover:hidden truncate overflow-ellipsis">
            {display}
          </h1>
          {nip05 && (
            <img
              src={verif.src}
              className="group-hover:hidden h-3 w-3 my-auto opacity-20 ml-1"
            />
          )}
        </div>
        <p className="text-neutral-500 truncate overflow-hidden text-xs">
          {last_message}
        </p>
      </div>
    </>
  );
};

export default MessagesNavListItem;
