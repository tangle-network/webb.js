export const fetchTornadoCircuitData = async () => {
  const IPFSUrl = `https://ipfs.io/ipfs/QmbX8PzkcU1SQwUis3zDWEKsn8Yjgy2vALNeghVM2uh31B`;
  const ipfsRequest = await fetch(IPFSUrl);
  const circuitData = await ipfsRequest.json();
  return circuitData;
};

export const fetchTornadoProvingKey = async () => {
  const IPFSUrl = `https://ipfs.io/ipfs/QmQwgF8aWJzGSXoe1o3jrEPdcfBysWctB2Uwu7uRebXe2D`;
  const ipfsRequest = await fetch(IPFSUrl);
  const provingKey = await ipfsRequest.arrayBuffer();
  return provingKey;
};
