import { Dispatch, SetStateAction } from "react";

export type Profile = {
  pubkey: string;
  name?: string;
  about?: string;
  nip05?: string;
  picture?: string;
  failed?: boolean;
};

export type Profiles = {
  pubkey?: Profile;
};

export type SingleMessage = {
  author: string;
  recipient: string;
  content: string;
  timestamp: number;
};

export type ConversationsListItem = {
  peer: string;
  last_message: number; // temporarily? a unix timestamp
};

export type SetProfilesState = Dispatch<SetStateAction<Profiles>>;
export type SetNumberState = Dispatch<SetStateAction<number>>;
export type SetConversationsListState = Dispatch<
  SetStateAction<ConversationsListItem[]>
>;
export type SetListenFuncState = Dispatch<SetStateAction<Promise<void>>>;
export type SetBooleanState = Dispatch<SetStateAction<boolean>>;
export type SetStringState = Dispatch<SetStateAction<string>>;
export type SetMessagesState = Dispatch<SetStateAction<SingleMessage[]>>;
export type SetStringListState = Dispatch<SetStateAction<string[]>>;

export type DmEvent = {
  event: string;
  id: number;
  payload: SingleMessage;
  windowLabel: any;
};
