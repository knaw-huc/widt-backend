import {Model, InferAttributes, InferCreationAttributes} from 'sequelize'

// INTERFACES

export interface GROUP {
  version: string,
  groupid: string,
  position: number,
  started: Array<string>,
  users: Array<string>,
  finished: Array<string>,
  showResults: Array<string>
}

export interface USER {
  userid: string,
  groupid: string,
  name: string,
  answers: Answers
  done: Array<string>
}

export interface USERTABLE extends Model<Partial<USER>> {
  // Some fields are optional when calling UserModel.create() or UserModel.build()
  // userid: CreationOptional<number>;
  // name: string;
}
export interface GROUPTABLE extends Model<Partial<GROUP>> {
  // Some fields are optional when calling UserModel.create() or UserModel.build()
  // userid: CreationOptional<number>;
  // name: string;
}

export interface Answers {
  [chapter:string]: Array<Answer>
}

export type Answer = any

// STATES

export interface GroupState {
  mounted: boolean,
  loading: boolean,
  groupid: string,
  position: number,
  connected: boolean,
  users: Array<USER>,
  finished: Array<string>,
  started: Array<string>,
  showResults: Array<string>,
}

export interface UserState {
  mounted: boolean,
  loading: boolean,
  groupid: string,
  userid: string,
  position: number,
  name: string,
  connected: boolean,
  creating: boolean,
  users: Array<USER>
  answers: Answers,
  done: Array<string>,
  finished: Array<string>,
  started: Array<string>,
  showResults: Array<string>
}

// EVENTS

export interface ServerToClientEvents {
  // defaults
  error: (data: any) => void;
  ping: (data: any) => void;
  reconnect: (data: any) => void;
  reconnect_attempt: (data: any) => void;
  reconnect_error: (data: any) => void;
  reconnect_failed: (data: any) => void;
  disconnect: (data: any) => void;
  // custom
  goto: (data: any) => void;
  addUser: (data: any) => void;
  setUserData: (data: USER) => void;
  groupUserData: (data: Array<USER>) => void;
  loadGroupData: (data: GROUP) => void;
  setStartChapter: (object: {groupid:string, chapter:string}) => void;
  setUnStartChapter: (object: {groupid:string, chapter:string}) => void;
  setFinished: (data: { groupid: string, chapter: string }) => void;
  setUnFinished: (data: { groupid: string, chapter: string }) => void;
  setShowResults: (data: { groupid: string, chapter: string}) => void
  setUnShowResults: (data: { groupid: string, chapter: string}) => void
  updateAnswer: (data: any) => void;
  setDone: (data: { groupid: string, userid: string, chapter: string }) => void;
  setUnDone: (data: { groupid: string, userid: string, chapter: string }) => void;
}

export interface ClientToServerEvents {
  // init
  joinRoom: (Object: { groupid: string, userid?: string}) => void;
  getAllUserData: (Object: { groupid: string }) => void;
  getGroupData: (Object: { groupid: string }) => void;
  getUserData: (Object: { userid: string, groupid: string, name: string }, cb?: (user?: USER) => void) => void;
  storeVersion: ({ groupid, version }: { groupid: string, version: string }) => void
  // continue
  next: (Object: {groupid: string, position?: number}, cb?: () => void) => void;
  prev: (Object: {groupid: string},  cb?: () => void) => void;
  startChapter: (Object: {groupid: string, chapter: string}) => void;
  unStartChapter: (Object: { groupid: string, chapter: string }) => void;
  finish: (Object: { groupid: string, chapter: string }) => void;
  unFinish: (Object: { groupid: string, chapter: string }) => void;
  setShowResults: (data: { groupid: string, chapter: string}) => void;
  setUnShowResults: (data: { groupid: string, chapter: string}) => void;
  setAnswer: (Object: { groupid: string, userid: string, chapter: string, k: number, answer: any, name: string }) => void;
  createUser: (Object: { groupid: string, userid: string, name:string }, cb?: (success: boolean) => void) => void;
  removeUser: (Object: { groupid: string, userid: string }, cb?: (parameter?: boolean) => void) => void;
  test: (data?: any) => void;
  setDone: (Object: { groupid: string, userid: string, chapter: string }) => void;
  setUnDone: (Object: { groupid: string, userid: string, chapter: string }) => void;
}