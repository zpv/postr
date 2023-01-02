import { SetStringListState } from "../../lib/types";

interface RelaysListProps {
    relays: string[];
    setRelays: SetStringListState;
    inputRef: any;
}

const RelaysList: React.FC<RelaysListProps> = ({ relays, setRelays, inputRef }: any) => {
  return (
    <div className="relative p-6 flex-auto">
      <div className="flex flex-col">
        <div className="flex flex-col">
          {relays.map((relay, i) => (
            <div className="flex flex-row items-center" key={`${relay}-${i}`}>
              <input
                type="text"
                className="border border-neutral-700 w-full bg-opacity-0 bg-neutral-700 rounded-tl-full rounded-bl-full px-3 py-1 mr-1 mb-1 text-gray-200"
                placeholder="Relay"
                readOnly
                defaultValue={relay}
              />
              <button
                className="border-red-600 border text-white hover:bg-red-600 active:bg-opacity-70 transition font-medium px-3 py-1 mb-1 w-9"
                type="button"
                onClick={() => {
                  const newRelays = [...relays];
                  newRelays.splice(i, 1);
                  setRelays(newRelays);
                }}>
                -
              </button>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value: string = inputRef.current.value.trim().toLowerCase();
              inputRef.current.value = "";
              const newRelays = relays.map((relay) => relay.toLowerCase());

              if (value === "") return;

              newRelays.push(value);
              setRelays(newRelays);
            }}
            key="add-relay-form">
            <div
              className="flex flex-row items-center justify-between"
              key="add-relay">
              <input
                type="text"
                className="border border-neutral-700 w-full bg-opacity-0 bg-neutral-700 rounded-tl-full rounded-bl-full px-3 py-1 mr-1 mb-1 text-gray-200 focus:placeholder-transparent"
                placeholder="Enter a relay..."
                autoComplete="off"
                autoFocus={true}
                ref={inputRef}
              />
              <button
                className="border-green-600 border text-white hover:bg-green-600 active:bg-opacity-70 font-medium px-3 py-1 mb-1 w-9"
                type="submit"
                key="add-relay-button">
                +
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RelaysList;
