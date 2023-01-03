import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import { SetBooleanState, SetStringState } from "../../lib/types";

interface MessageComposeProps {
  message: string;
  setMessage: SetStringState;
  setOnSubmit: SetBooleanState;
}

const MessageCompose: React.FC<MessageComposeProps> = ({
  message,
  setMessage,
  setOnSubmit,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    setOnSubmit(true);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const active_style: string = message
    ? "bg-indigo-800 border-indigo-900 cursor-pointer text-white active:bg-opacity-70"
    : "cursor-default border-neutral-600 text-neutral-700";

  return (
    <>
      <div className="w-full border-t border-neutral-600 px-2 py-3">
        <form
          onSubmit={handleSubmit}
          className="flex flex-row items-center justify-between"
        >
          <input
            type="text"
            name="message"
            value={message}
            onChange={handleChange}
            placeholder="Type a message..."
            className="w-full rounded-tl-full rounded-bl-full border border-neutral-600 bg-neutral-900 py-1 px-3 outline-none focus:placeholder-transparent"
          />
          <button
            type="submit"
            className={
              "mx-1 h-full border px-3 py-1 transition duration-200 " +
              active_style
            }
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
};

export default MessageCompose;
