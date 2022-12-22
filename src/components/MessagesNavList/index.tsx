import MessagesNavListItem from "../MessagesNavListItem";

const MessagesNavList = () => {
    
    const users = [
        {
            id: 1,
            icon: "https://avatars.githubusercontent.com/u/71356404?v=4",
            public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
            last_message: "Hello",
            last_message_time: "2021-07-01T00:00:00.000Z",
        },
        {
            id: 2,
            icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
            display_name: "kelvin",
            public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
            last_message: "Hello",
            last_message_time: "2021-06-04T00:00:00.000Z",
        },
        {
            id: 2,
            icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
            display_name: "kelvin",
            public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
            last_message: "Hello",
            last_message_time: "2021-06-04T00:00:00.000Z",
        },
        {
            id: 2,
            icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
            display_name: "kelvin",
            public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
            last_message: "Hello",
            last_message_time: "2021-06-04T00:00:00.000Z",
        },
        {
            id: 2,
            icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
            display_name: "kelvin",
            public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
            last_message: "Hello",
            last_message_time: "2021-06-04T00:00:00.000Z",
        },
        {
            id: 2,
            icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
            display_name: "kelvin",
            public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
            last_message: "Hello",
            last_message_time: "2021-06-04T00:00:00.000Z",
        },
        {
            id: 2,
            icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
            display_name: "kelvin",
            public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
            last_message: "Hello",
            last_message_time: "2021-06-04T00:00:00.000Z",
        },
        {
            id: 2,
            icon: "https://avatars.githubusercontent.com/u/24833484?v=4",
            display_name: "kelvin",
            public_key: "da43ff28ba49aad308de30426c16c106beb25a4b381b36e2e72c64f3e6b8a3ee",
            last_message: "Hello",
            last_message_time: "2021-06-04T00:00:00.000Z",
        }
    ]

    return (
      <>
        <div className="p-4">
            <input type="text" placeholder="Search..." className="rounded-full w-full bg-gray-800 px-2"/>
        </div>
        <div className="overflow-scroll h-full border-r border-neutral-600">
            {users.map((user) => (
                <MessagesNavListItem key={user.id} {...user} />
            ))}
        </div>
      </>
    );
  };
  
export default MessagesNavList;