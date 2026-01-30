const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:9222/devtools/page/46');
ws.on('open', () => {
  ws.send(JSON.stringify({id:1, method:'Runtime.enable'}));
  ws.send(JSON.stringify({id:2, method:'Runtime.evaluate', params:{expression:'document.title'}}));
});
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    const args = msg.params.args.map(a => a.value || a.description || a.type).join(' ');
    if (args.includes('SHOOT') || args.includes('GAME')) console.log(args);
  } else if (msg.id === 2) {
    console.log('Connected:', msg.result?.result?.value);
  }
});
setTimeout(() => { ws.close(); process.exit(0); }, 30000);
