export function _log(...messages) {

   const timestamp = new Date().toISOString();
   console.log(`[${timestamp}]`, ...messages);
}

export function _error(...messages) {

  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}]`, ...messages);
}
