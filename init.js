const express = require('express');
const { namespaceWrapper } = require('./namespaceWrapper');
const TASK_NAME = process.argv[2];
const TASK_ID = process.argv[3];
const EXPRESS_PORT = process.argv[4];
const NODE_MODE = process.argv[5];
const MAIN_ACCOUNT_PUBKEY = process.argv[6];
const SECRET_KEY = process.argv[7];
const K2_NODE_URL = process.argv[8];
const SERVICE_URL = process.argv[9];
const STAKE = Number(process.argv[10]);

const app = express();

console.log('SETTING UP EXPRESS', NODE_MODE);
app.get('/', async (req, res) => {
  let k2_diagnostics_report = await generateReport();
  res.status(200).send(k2_diagnostics_report);
});

app.listen(EXPRESS_PORT, () => {
  console.log(`${TASK_NAME} listening on port ${EXPRESS_PORT}`);
});

const generateReport = async () => {
  // fetch last N periods of historical data

  let report = {
    nodes : namespaceWrapper.storeGet('nodes'),
    leader : {}, // contains leader info
    healthChecks : [],
    roundData : await getRoundData(),
    reportTime : new Date ()
  }

  report.nodes.forEach( async (node) => {
    let nodeData = await namespaceWrapper.storeGet(node.id)
    if (nodeData.is_leader) report.leader = {
      pubkey : nodeData.pubkey,
      rpc : nodeData.rpc,
      epoch : nodeData.epoch,
      time : nodeData.timestamp,
      last_slot : nodeData.slot_id
    }
    report.healthChecks.push(nodeData)
  })

  return report;
}

async function getRoundData () {
  let currentRound = namespaceWrapper.getRound();
  let pastRounds = [];

  // roundData is being stored every time there's a call to submissionOnChain or uploadDistributionList in the namespacewrapper
  for ( var i = currentRound - 5; i < currentRound; i++) {
    if (i >= 0) {
      let roundI = {
        submission : await namespaceWrapper.storeGet(`round-${i}-submission`),
        distribution : await namespaceWrapper.storeGet(`round-${i}-distribution`)
      }
      pastRounds.push(roundI)
    }
  }
  return {
    currentRound : currentRound,
    pastRounds : pastRounds
  }
}

module.exports = {
  app,
  NODE_MODE,
  TASK_ID,
  MAIN_ACCOUNT_PUBKEY,
  SECRET_KEY,
  K2_NODE_URL,
  SERVICE_URL,
  STAKE
};
