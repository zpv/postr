const getFormattedMsgRecvTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const seven_days_ago = new Date();
  seven_days_ago.setDate(seven_days_ago.getDate() - 7);

  if (date.toDateString() === today.toDateString()) {
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
      .replace(/^0/, "");
  } else if (date > seven_days_ago) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
    });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

//given unix timestamp, return only the time
const getTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  let result = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (result[0] === "0") {
    result = result.slice(1);
  }
  return result;
};

const getFormattedTimeStr = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const seven_days_ago = new Date();
  seven_days_ago.setDate(seven_days_ago.getDate() - 7);

  let timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (timeStr[0] === "0") {
    timeStr = timeStr.slice(1);
  }

  if (date.toDateString() === today.toDateString()) {
    return timeStr;
  } else if (date.toDateString() === yesterday.toDateString()) {
    timeStr = "Yesterday, " + timeStr;
  } else if (date > seven_days_ago) {
    timeStr =
      date.toLocaleDateString("en-US", {
        weekday: "short",
      }) +
      ", " +
      timeStr;
  } else {
    timeStr =
      date.toLocaleDateString([], {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }) +
      ", " +
      timeStr;
  }

  return timeStr;
};

export default getFormattedMsgRecvTime;
export { getFormattedTimeStr, getTime };
