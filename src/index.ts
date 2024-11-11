import puppeteer from 'puppeteer'
import { logErr, logInfo } from './utils'
import path from 'path'
import fs from 'fs'

logInfo('clear dist file')
// child_process.exec('mkdir -p dist && rm -rf dist/* ')
const outputDir = path.resolve(__dirname, '../dist')
try {
  fs.rmSync(outputDir)
} catch {}

fs.mkdir(outputDir, err => {
  if (err) {
    logErr(err, '创建文件夹失败')
  }
})

// logInfo(' fetch file from  https://github.com/ZYFXS/ZYFXS001 ')
// child_process.execSync(
//   'git subtree pull git@github.com:ZYFXS/ZYFXS001.git main --prefix=src/sub',
// )

// logInfo('install chrome')
// child_process.execSync('bunx puppeteer browsers install')
;(async () => {
  const randomNumber = Date.now().toString().slice(-4)
  logInfo('start puppeteer')
  const browser = await puppeteer
    .launch({
      headless: true,
      args: [
        `--user-agent=Mozilla/5.0 (Windows NT 111; Win64; x64) AppleWebKit/536 (KHTML, like Gecko) Chrome/12${randomNumber[0]}.${randomNumber[1]}.${randomNumber[2]}.${randomNumber[3]} Safari/537.00`,
      ],
    })
    .catch(err => {
      logErr(err, 'launch chrome error')
      process.exit(-1)
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

    const moveFile = async (filename?: string) => {
      if (filename) {
        const to = path.resolve(__dirname, '../dist/index')
        logInfo(`download file ${filename}`)
        await fetch(
          `https://raw.githubusercontent.com/ZYFXS/ZYFXS001/refs/heads/main/${filename}`,
        ).then(r => {
          logInfo('fetch file success')
          return r.text().then(text => {
            fs.writeFileSync(to, text, 'utf-8')
          })
        })
        logInfo('move index.html')
        fs.cpSync(
          path.resolve(__dirname, 'index.html'),
          `${outputDir}/index.html`,
        )
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
