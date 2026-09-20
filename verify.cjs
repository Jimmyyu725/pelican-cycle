'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
let chromium;
try { ({chromium}=require('playwright')); } catch { ({chromium}=require('/Users/jingtianyu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
(async () => {
  const mode=process.argv[2];
  const file=path.join(__dirname, mode==='baseline'?'.checkpoints/baseline.html':mode==='rollback'?'.checkpoints/rollback-test.html':'index.html');
  const stage=mode==='modified'?'island':'baseline';
  assert(['baseline','modified','rollback'].includes(mode), 'Expected baseline, modified or rollback');
  assert(file && ['baseline', 'island'].includes(stage), 'Expected a file and stage');
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:960},offline:true});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(file)).href);
    assert.equal(await page.locator('body').getAttribute('data-stage'), stage);
    if (stage === 'baseline') {
      assert.equal(await page.locator('main').textContent(), '鹈鹕邮局 · 场景待构建');
      console.log('PASS baseline');
      return;
    }
    await page.waitForFunction(() => document.body.dataset.ready === 'true');
    assert.deepEqual(await page.evaluate(() => {
      const s=window.__pelican.getStats(); return [s.webgl,s.wheels,s.legs];
    }), [true,2,2]);
    const before=await page.evaluate(()=>window.__pelican.state.theta);
    await page.waitForTimeout(350);
    assert((await page.evaluate(()=>window.__pelican.state.theta))<before);
    await page.locator('#play').click();
    const paused=await page.evaluate(()=>window.__pelican.state.theta);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(()=>window.__pelican.state.theta),paused);
    await page.locator('#speed').fill('1.5');
    assert.equal(await page.locator('#speedValue').textContent(),'1.5×');
    assert.equal(await page.evaluate(()=>window.__pelican.state.speed),1.5);
    await page.locator('#light').click();
    assert.equal(await page.evaluate(()=>window.__pelican.state.sunset),true);
    assert.equal(await page.locator('#lightLabel').textContent(),'落日');
    await page.locator('#bell').click();
    assert.match(await page.locator('#toast').textContent(),/叮铃/);
    await page.locator('#world').click();
    assert.equal(await page.locator('#journal').evaluate(e=>e.open),true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#journal').evaluate(e=>e.open),false);
    await page.locator('#birdView').click();
    assert.equal(await page.evaluate(()=>window.__pelican.state.view),'bird');
    await page.waitForTimeout(1000);
    await page.screenshot({path:path.join(__dirname,'.checkpoints','closeup-sunset.png')});
    const yaw=await page.evaluate(()=>window.__pelican.orbit.yaw);
    await page.mouse.move(1000,500);await page.mouse.down();await page.mouse.move(1120,540,{steps:8});await page.mouse.up();
    assert.notEqual(await page.evaluate(()=>window.__pelican.orbit.yaw),yaw);
    await page.mouse.wheel(0,100);
    await page.waitForTimeout(100);
    assert((await page.evaluate(()=>window.__pelican.orbit.zoom))>1);
    await page.locator('#reset').click();
    assert.equal(await page.evaluate(()=>window.__pelican.state.view),'island');
    assert.equal(await page.evaluate(()=>window.__pelican.state.theta),1.9);
    await page.locator('#light').click();
    await page.waitForTimeout(2500);
    await page.screenshot({path:path.join(__dirname,'.checkpoints','desktop.png')});
    await page.locator('#scene').focus();await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>window.__pelican.state.paused),false);
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>window.__pelican.state.paused),true);
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(1000);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    for (const id of ['play','world','birdView','bell','light','reset']) {
      const b=await page.locator('#'+id).boundingBox();
      assert(b.x>=0 && b.y>=0 && b.x+b.width<=390 && b.y+b.height<=844, id+' is onscreen');
    }
    await page.screenshot({path:path.join(__dirname,'.checkpoints','mobile.png')});
    await page.locator('#birdView').click();await page.waitForTimeout(2500);
    await page.screenshot({path:path.join(__dirname,'.checkpoints','mobile-closeup.png')});
    const quiet=await context.newPage();
    await quiet.emulateMedia({reducedMotion:'reduce'});
    await quiet.goto(pathToFileURL(path.resolve(file)).href);
    await quiet.waitForFunction(()=>document.body.dataset.ready==='true');
    assert.equal(await quiet.evaluate(()=>window.__pelican.state.paused),true);
    assert.deepEqual(errors,[]);
    console.log('PASS modified');
  } finally { await browser.close(); }
})().catch(e=>{ console.error(e);process.exitCode=1; });
