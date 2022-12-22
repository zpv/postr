import { Kind, useNostrEvents, dateToUnix } from "@nostrgg/react";

const ProfileFeed = () => {
  const { events } = useNostrEvents({
    filter: {
      authors: [
        "73ee0c7420638fe8e01e528a6af60c272a1786a752e4249158f79ded8f0ef9c8",
      ],
      since: 0,
      kinds: [Kind.TextNote, Kind.DirectMessage],
    },
  });
  return (
    <>
      {events.map((event) => (
        <p key={event.id}>{event.pubkey} posted: {event.content}</p>
      ))}
    </>
  );
};

export default ProfileFeed;