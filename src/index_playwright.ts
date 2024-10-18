import child_process from 'child_process'
import { chromium } from 'playwright'

console.log('clear dist file')
child_process.exec('mkdir -p dist && rm -rf dist/* ')

console.log(' fetch file from  https://github.com/ZYFXS/ZYFXS001 ')
child_process.execSync(
  'git subtree pull git@github.com:ZYFXS/ZYFXS001.git main --prefix=src/sub',
)

// console.log("playwright init env");
// child_process.exec("npx playwright install");

const randomNumber = Date.now().toString().slice(-4)
// console.log(randomNumber)
// process.exit()
const run = async () => {
  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    args: [
      `--user-agent=Mozilla/5.0  (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/12${randomNumber[4]}.${randomNumber[1]}.${randomNumber[2]}.${randomNumber[3]} Safari/537.36`,
    ],
  })

  const page = await browser.newPage()

  await page.goto('https://www.github.com/', {
    waitUntil: 'domcontentloaded',
  })
  await page
    .goto('https://www.github.com/ZYFXS/ZYFXS001/commits/main/', {
      waitUntil: 'domcontentloaded',
    })
    .catch(err => {
      console.log('visit github error, please retry later .')
      console.log(err)
    })

  const commit = await page.locator('li[role=listitem] a')
  const commitText = commit.innerText
  console.log(`last commit ${commitText}`)
  commit.click()

  await new Promise(r => {})
}

run()
