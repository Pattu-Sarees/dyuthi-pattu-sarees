const heicConvert = require('heic-convert')
const { readFileSync, writeFileSync } = require('fs')
;(async()=>{
  const buf = readFileSync('/sessions/loving-keen-dijkstra/mnt/uploads/IMG_4084.HEIC')
  for (const q of [0.4, 0.5, 0.6]) {
    const out = await heicConvert({ buffer: buf, format:'JPEG', quality:q })
    console.log(`quality ${q}: ${(out.byteLength/1024/1024).toFixed(2)} MB`)
    if (q===0.5) writeFileSync('/sessions/loving-keen-dijkstra/mnt/outputs/hc_q50.jpg', Buffer.from(out))
  }
})().catch(e=>console.log('ERR', e.message))
