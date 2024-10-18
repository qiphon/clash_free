export const logErr = (err: Error, errMessage?: string) => {
  console.log(`-----------    ${errMessage ?? '未知错误'}    --------------`)
  console.log(err)
  console.log('============ error end ===============')
}
export const logInfo = (message: string) => {
  console.log('------------- message start ---------------')
  console.log(message)
  console.log('============ message end ===============')
}
