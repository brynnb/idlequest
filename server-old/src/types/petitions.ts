/**
 * Types related to player petitions
 * Based on the petitions table in the database
 */

/**
 * Represents a player petition from the database
 */
export interface Petitions {
  dib: number;
  petid: number;
  charname: string;
  accountname: string;
  lastgm: string;
  petitiontext: string;
  gmtext: string | null;
  zone: string;
  urgency: number;
  charclass: number;
  charrace: number;
  charlevel: number;
  checkouts: number;
  unavailables: number;
  ischeckedout: number;
  senttime: number;
}

/**
 * Represents a simplified view of a player petition
 */
export interface SimplePetition {
  id: number;
  petitionId: number;
  characterName: string;
  accountName: string;
  lastGM: string;
  petitionText: string;
  gmText: string | null;
  zone: string;
  urgency: number;
  characterClass: number;
  characterRace: number;
  characterLevel: number;
  checkouts: number;
  unavailables: number;
  isCheckedOut: boolean;
  sentTime: number;
}

/**
 * Converts a Petitions object to a SimplePetition object
 */
export function toSimplePetition(petition: Petitions): SimplePetition {
  return {
    id: petition.dib,
    petitionId: petition.petid,
    characterName: petition.charname,
    accountName: petition.accountname,
    lastGM: petition.lastgm,
    petitionText: petition.petitiontext,
    gmText: petition.gmtext,
    zone: petition.zone,
    urgency: petition.urgency,
    characterClass: petition.charclass,
    characterRace: petition.charrace,
    characterLevel: petition.charlevel,
    checkouts: petition.checkouts,
    unavailables: petition.unavailables,
    isCheckedOut: petition.ischeckedout === 1,
    sentTime: petition.senttime,
  };
}
