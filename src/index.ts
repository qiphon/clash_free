import puppeteer from 'puppeteer'
import child_process from 'child_process'
import { logErr, logInfo } from './utils'
import path from 'path'

logInfo('clear dist file')
child_process.exec('mkdir -p dist && rm -rf dist/* ')

logInfo(' fetch file from  https://github.com/ZYFXS/ZYFXS001 ')
child_process.execSync(
  'git subtree pull git@github.com:ZYFXS/ZYFXS001.git main --prefix=src/sub',
)

logInfo('install chrome')
child_process.execSync('bunx puppeteer browsers install')
;(async () => {
  const randomNumber = Date.now().toString().slice(-4)
  logInfo('start puppeteer')
  const browser = await puppeteer
    .launch({
      headless: false,
      args: [
        `--user-agent=Mozilla/5.0  (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/12${randomNumber[0]}.${randomNumber[1]}.${randomNumber[2]}.${randomNumber[3]} Safari/537.36`,
      ],
    })
    .catch(err => {
      logErr(err, 'launch chrome error')
    })

  if (!browser) return
  const page = await browser.newPage()
  const targetRepo = 'https://github.com/ZYFXS/ZYFXS001/'

  await page.goto(`${targetRepo}commits/main/`)

  page.on('response', async response => {
    const commitsApi =
      'https://github.com/ZYFXS/ZYFXS001/commits/deferred_commit_data/main?original_branch=main'
    logInfo(response.url())
    let lastestCommit = ''
    if (response.url() === commitsApi) {
      logInfo('get lastest commit ')
      const content = await response.json()

      lastestCommit = content?.deferredCommits?.[0]?.oid
      if (lastestCommit) {
        page.goto(`${targetRepo}commit/${lastestCommit}/`)
      }
    }

    const moveFile = (filename?: string) => {
      if (filename) {
        const source = path.resolve(__dirname, './sub/', filename)
        const target = path.resolve(__dirname, '../dist/index')
        child_process.execSync(`cp ${source} ${target}`)
      } else {
        logErr(new Error('get filename error'), '没有找到最新的文件')
      }
      browser.close()
    }

    // 查看 diff 文件
    if (
      response
        .url()
        .startsWith('https://github.com/ZYFXS/ZYFXS001/diffs?bytes=0&commit=')
    ) {
      logInfo('get modify file')
      const content = await response.text()
      if (content) {
        const filenameArr = /data-file-path=\"(.*)\"/g.exec(content)
        moveFile(filenameArr?.[1])
      }
    }

    // 查看 diff 文件， 登录后是这个
    if (
      response.url() ===
      `https://github.com/ZYFXS/ZYFXS001/commit/${lastestCommit}/remaining_diff_entries?start_entry=0&bytes=0&lines=0`
    ) {
      logInfo('get modify file ....')
      const content = await response.json()
      const filename = content?.extraDiffEntries?.[0]?.path

      moveFile(filename)
    }
  })
})()