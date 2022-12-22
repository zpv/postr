import info from '../../assets/info.png';

const MessageHead = ({ pubkey, name, picture }) => {
  const display_name = name || pubkey;
  return (
    <>
      <div className="bg-neutral-800 flex flex-row border-b border-neutral-800">
          <div className="cursor-pointer flex flex-row hover:bg-neutral-700 transition duration-100 rounded-sm">
            <img src={picture} alt="profile" className="rounded-lg w-10 h-10 m-3" />  
            <h1 className="text-neutral-200 truncate overflow-hidden w-64 my-auto">{display_name}</h1>
          </div>
          <div className="flex flex-row w-full justify-end">
            <div className="my-auto p-2 mx-3 cursor-pointer hover:bg-neutral-700 transition duration-100 rounded-lg">
              <img src={info.src} alt="info" className="w-5 h-5" />
            </div>
          </div>
      </div>
    </>
  );
};
  
export default MessageHead;