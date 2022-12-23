import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";

const MessageCompose = ({ message, setMessage, setOnSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    setOnSubmit(true);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  // <input
  //         type="text"
  //         placeholder="Type a message..."
  //         value={message}
  //         onChange={handleChange}
  //         onSubmit={handleSubmit}
  //         className="rounded-full w-full bg-neutral-900 border border-neutral-600 py-1 px-3"
  //       />

  const active = message ? "bg-indigo-800 border-indigo-900 cursor-pointer text-white" : "cursor-default border-neutral-600 text-neutral-500";

  return (
    <>
      <div className="w-full px-2 py-3 border-neutral-600 border-t">
        <form
          onSubmit={handleSubmit}
          className="flex flex-row items-center justify-between">
          <input
            type="text"
            name="message"
            value={message}
            onChange={handleChange}
            placeholder="Type a message..."
            className="rounded-tl-full rounded-bl-full w-full bg-neutral-900 border border-neutral-600 py-1 px-3"
          />
          <button
            type="submit"
           className={"border mx-1 px-3 py-1 h-full transition duration-200 " + active}>
            Send
          </button>
        </form>
      </div>
    </>
  );
};

export default MessageCompose;
