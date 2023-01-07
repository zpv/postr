import { sha256 } from "@noble/hashes/sha256";
import { nip19 } from "nostr-tools";

// all pubkeys should be rendered as bech32 encoded strings
export const toNpub = (pubkey: string) => {
  if (!pubkey) return "";
  return nip19.npubEncode(pubkey);
};

export const fromNpub = (npub: string) => {
  let { type, data } = nip19.decode(npub);
  if (type !== "npub") throw new Error("invalid npub");

  return data as string;
};

export const toPubkeyOrNone = (pubkeyOrNpub: string): string => {
  if (
    pubkeyOrNpub.length === 64 &&
    pubkeyOrNpub.match(/^[0-9A-Fa-f]+$/i) !== null
  )
    return pubkeyOrNpub;
  try {
    return fromNpub(pubkeyOrNpub);
  } catch (e) {
    return "";
  }
};

export const randomPubkey = (): string => {
  return Buffer.from(sha256(Math.random().toString())).toString("hex");
};
