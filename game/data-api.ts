import {redisPubClient} from './redisconnection'
import { l1, l2, l3, l4 } from './log'

interface GROUP {
  groupid: string,
  position: number,
  started: Array<string>,
  users: Array<string>
}

interface USER {
  userid: string,
  groupid: string,
  name: string,
  answers: { [chapter: string]: Array<any>; }
}

export async function getUser({ userid, groupid, name }: {userid: string, groupid: string, name?: string}) {
  /*
  get or create
  */
  let user = false
  // get redis user
  const redisUser = await redisPubClient.get(`user-${userid}`)
  // if not, get sqlgroup
  if (!redisUser) {
    // get sqlgroup
    // user = await sql.getUser(id)

    // set redisgroup
    if (user) {
      // fill with group data
      await writeUser(user, 'redis')
    }
  } else {
    user = JSON.parse(redisUser)
  }
  // return group if found
  if (user !== false) { return user }
  // create user if no redis && no mysql: 
  const emptyUser:USER = {
    userid,
    groupid,
    name,
    answers: {}
  }
  await writeUser(emptyUser)
  return emptyUser
}

export async function removeUser({ groupid, userid }:{groupid:string, userid:string}) {
  
  // remove from group
  const group = await getGroup(groupid)
  if (!group) {
    return false
  }
  group.users = group.users.filter(x => {
    return x !== userid
  })

  if (group) {
    await writeGroup(group)
  }

}

export async function getGroup(groupid:string) {
  /*
  get or create
  */
  let group = false
  // get redis group
  const redisGroup = await redisPubClient.get(`group-${groupid}`)
  // if not, get sqlgroup
  if (!redisGroup) {
    // get sqlgroup
    // group = await sql.get(id)

    // set redisgroup
    if (group) {
      // fill with group data
      await writeGroup(group, 'redis')
    }
  } else {
    group = JSON.parse(redisGroup)
  }
  // return group if found
  if (typeof group === 'object') { return group }

  // create group if no redis && no mysql: 
  const emptyGroup:GROUP = {
    groupid,
    position: 0,
    started: [],
    users: []
  }
  await writeGroup(emptyGroup)
  return emptyGroup
}

export async function getGroupUserData(groupid:string) {
  const data = []
  const group = await getGroup(groupid)
  if (!group) {
    return false
  }
  // l1('group data:')
  for (let i in group.users) {
    const userid = group.users[i]
    const userdata = await getUser({ groupid, userid })
    if (userdata) {
      data.push(userdata)
    }
  }
  return data
}

export async function addToGroup ({groupid, userid}:{groupid:string, userid: string}) {

  const group = await getGroup(groupid)

  if (!group) {
    throw Error(`Group does not exist. (groupid: ${groupid}, addToGroup)`)
  }
  
  if (!group.users.includes(userid)) {
    group.users.push(userid)
  }
  // l1('add to group')
  // l3(group)
  await writeGroup(group)

  return true
}

export async function writeUser(user:USER, service?:string) {
  // redis
  if (!service || service === 'redis') {
    await redisPubClient.set(`user-${user.userid}`, JSON.stringify(user))
  }
  // sql
  if (!service || service === 'sql') {
    // await sql.create(emptyGroup)
  }
}

export async function writeGroup(group:GROUP, service?:string) {
  // redis
  if (!service || service === 'redis') {
    // l4('write group redis', group)
    await redisPubClient.set(`group-${group.groupid}`, JSON.stringify(group))
  }
  // sql
  if (!service || service === 'sql') {
    // await sql.create(emptyGroup)
  }
  console.log('write group', group)
}

export async function writeAnswer({ groupid, userid, chapter, k, answer, name }:{groupid:string, userid:string, chapter:string, k:number, answer:any, name:string}, service?:string) {
  // redis
  if (!service || service === 'redis') { 
    const user = await getUser({ userid, groupid, name })
    if (!user || user === true) {
      throw Error(`Can't find user ${userid} to write answer ${k}, ${answer}`)
    }
    if (!(chapter in user.answers)) { user.answers[chapter] = [] }
    user.answers[chapter][k] = answer
    // console.log(JSON.stringify(user))
    await redisPubClient.set(`user-${user.userid}`, JSON.stringify(user))
  }
}

export async function setFinished({groupid, userid, name}:{groupid:string, userid:string, name?:string}) {
  // const group = await getGroup(groupid)
  // if (!group.finished) { group.finished = {} }
  // if (!group.finished[name]) { group.finished[name] = [] }
  // if (group.finished && !group.finished[name].includes(userid)) { group.finished[name].push(userid) }
  // await writeGroup(group)
}
export async function setUnFinished({ groupid, userid, name }:{groupid:string, userid:string, name?:string}) {
  // const group = await getGroup(groupid)
  // if (!group.finished) { group.finished = {} }
  // if (!group.finished[name]) { group.finished[name] = [] }
  // if (group.finished && group.finished[name].includes(userid)) { group.finished[name].splice(group.finished[name].indexOf(userid), 1) }
  // await writeGroup(group)
}

export async function setStartChapter({groupid, name}:{groupid:string,name:string}) {
  const group = await getGroup(groupid)
  if (typeof group !== 'object') {
    throw Error(`Group does not exist. Can not unstart chapter ${groupid}, ${name}`)
  }
  if (!group.started) { group.started = [] }
  if (!group.started.includes(name)) { group.started.push(name) }
  await writeGroup(group)
}
export async function setUnStartChapter({ groupid, name }:{groupid:string,name:string}) {
  const group = await getGroup(groupid)
  if (typeof group !== 'object') {
    throw Error(`Group does not exist. Can not unstart chapter ${groupid}, ${name}`)
  }
  if (!group.started) { group.started = [] }
  if (group.started.includes(name)) { group.started.splice(group.started.indexOf(name), 1) }
  await writeGroup(group)
}