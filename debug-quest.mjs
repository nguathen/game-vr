const ws = new WebSocket('ws://localhost:9222/devtools/page/46');
ws.addEventListener('open', () => {
  ws.send(JSON.stringify({id:1, method:'Runtime.enable'}));
  ws.send(JSON.stringify({id:2, method:'Runtime.evaluate', params:{expression:'document.title'}}));
  console.log('Connected to Quest, listening for 30s...');
});
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
  if (msg.method === 'Runtime.consoleAPICalled') {
    const args = msg.params.args.map(a => a.value || a.description || a.type).join(' ');
    console.log('[Q]', args);
  } else if (msg.id === 2) {
    console.log('Page:', msg.result?.result?.value);
  }
});
setTimeout(() => { ws.close(); process.exit(0); }, 30000);
