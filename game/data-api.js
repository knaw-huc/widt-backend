import {redisPubClient} from './redisconnection.js'
import {l1,l2,l3,l4} from './log.js'


export async function getUser({ userid, groupid, name }) {
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
  if (user) { return user }
  // create user if no redis && no mysql: 
  const emptyUser = {
    userid,
    name,
    answers: []
  }
  await writeUser(emptyUser)
  return emptyUser
}

export async function removeUser({ groupid, userid }) {
  
  // remove from group
  const group = await getGroup(groupid)
  group.users = group.users.filter(x => {
    return x !== userid
  })

  if (group) {
    await writeGroup(group)
  }

}

export async function getGroup(groupid) {
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
  if (group) { return group }

  // create group if no redis && no mysql: 
  const emptyGroup = {
    groupid,
    position: 0,
    users: []
  }
  await writeGroup(emptyGroup)
  return emptyGroup
}

export async function getGroupUserData(groupid) {
  const data = []
  const group = await getGroup(groupid)
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

export async function addToGroup ({groupid, userid}) {

  const group = await getGroup(groupid)
  
  if (!group.users.includes(userid)) {
    group.users.push(userid)
  }
  // l1('add to group')
  // l3(group)
  await writeGroup(group)

  return true
}

export async function writeUser(user, service) {
  // redis
  if (!service || service === 'redis') {
    await redisPubClient.set(`user-${user.userid}`, JSON.stringify(user))
  }
  // sql
  if (!service || service === 'sql') {
    // await sql.create(emptyGroup)
  }
}

export async function writeGroup(group, service) {
  // redis
  if (!service || service === 'redis') {
    l4('write group redis', group)
    await redisPubClient.set(`group-${group.groupid}`, JSON.stringify(group))
  }
  // sql
  if (!service || service === 'sql') {
    // await sql.create(emptyGroup)
  }
}

export async function writeAnswer({ groupid, userid, chapter, k, answer, name }, service) {
  // redis
  if (!service || service === 'redis') { 
    const user = await getUser({ userid, groupid, name })
    // await redisPubClient.set(`user-${user.userid}`, JSON.stringify(user))
  }
}

export async function setFinished({groupid, name}) {
  const group = await getGroup(groupid)
  if (!group.finished) { group.finished = [] }
  if (!group.finished.includes(name)) { group.finished.push(name) }
}
export async function setUnFinished(groupid, name) {
  const group = await getGroup(groupid)
  if (!group.finished) { group.finished = [] }
  if (group.finished.includes(name)) { group.finished.splice(group.finished.indexOf(name), 1) }
}

export async function setStartChapter({groupid, name}) {
  const group = await getGroup(groupid)
  if (!group.started) { group.started = [] }
  if (!group.started.includes(name)) { group.started.push(name) }
}
export async function setUnStartChapter(groupid, name) {
  const group = await getGroup(groupid)
  if (!group.started) { group.started = [] }
  if (group.started.includes(name)) { group.started.splice(group.started.indexOf(name), 1) }
}