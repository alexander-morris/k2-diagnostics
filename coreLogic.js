const { namespaceWrapper } = require("./namespaceWrapper");

let connection;
let maxHistorySize = 100; // the max number of historical levelDb records in the healthcheck list

async function task() {
  // open RPC connection to get node list
  if (!connection.getAccountInfo) connection = new web3.Connection(
    web3.clusterApiUrl('devnet'),
    'confirmed',
  );

  // initialize the history as array if not exists
  if (!namespaceWrapper.storeGet('history')) namespaceWrapper.storeSet('history', [])

  // fetch node list
  // let nodeList = connection.; // TODO - add web3.js call to fetch validator list here
  let nodeList = connection.getClusterNodes(); // [{ pubkey : "laksjdlsaksljdklaskj", rpc : "123.543.222.234" }]
  safeLevelDbUpdate('nodes', nodeList)

  nodeList.forEach( async (node) => {
    /* ping each node and check 
      a. balance of this task account
      b. slot #
      c. epoch #
    */

    // get account info
    let nodeData = {
      pubkey : node.pubkey,
      rpc : node.rpc,
      version : node.version
    }

    // establish a new connection to this particular K2 node
    if (node.rpc) {
      let newConnection = new web3.Connection(
        web3.clusterApiUrl(node.rpc), // TODO - unclear if this works
        'confirmed',
      );
    
      nodeData.account = await newConnection.getAccountInfo(namespaceWrapper.publicKey)
      nodeData.slot_id = await newConnection.getSlot()
      nodeData.timestamp = await newConnection.getBlockTime(slot)
      nodeData.epoch = await newConnection.getEpochInfo()
      nodeData.leaderSchedule = await newConnection.getLeaderSchedule()

      // TODO - parse this and set nodeData.isLeader = true for the correct node 
    }

    // generate proof using local signature and add it to the node object
    nodeData.signature = "signature"; // TODO - add signature + hash with slot # 

    // update levelDb for the node
    safeLevelDbUpdate(node.pubkey, nodeData);
  })
  
}

/*
  safelevelDbUpdate
   - Pushes old data into a 'history' array which can be retrieved for diagnostics
 */
async function safeLevelDbUpdate(key, value) {
  // get current value
  let current = namespaceWrapper.storeGet(key)

  // if current value exists, add it to the master history
  let history = namespaceWrapper.storeGet('history')
  
  // this condition truncates the history to the most recent 50 records to prevent overflow
  if (history.length > maxHistorySize) {
    history.splice(0, (history.length - 1 - maxHistorySize)) 
  }
  history.push([key, current])
  
  namespaceWrapper.storeSet('history', history)
  
  // store the new value
  namespaceWrapper.storeSet(key, value)

  return;
}

async function fetchSubmission(){
  // Write the logic to fetch the submission values here and return the cid string

  // The code below shows how you can fetch your stored value from level DB
  const cid = await namespaceWrapper.storeGet("cid"); // retrieves the cid
  return cid;
}

async function generateDistributionList(round){
  console.log("GenerateDistributionList called");
  console.log("I am selected node");

  // Write the logic to generate the distribution list here by introducing the rules of your choice


  /*  **** SAMPLE LOGIC FOR GENERATING DISTRIBUTION LIST ******/
  
  let distributionList = {};
    const taskAccountDataJSON = await namespaceWrapper.getTaskState();
    const submissions = taskAccountDataJSON.submissions[round];
    const submissions_audit_trigger =
                  taskAccountDataJSON.submissions_audit_trigger[round];
    if (submissions == null) {
      console.log("No submissions found in N-2 round");
      return distributionList;
    } else {
      const keys = Object.keys(submissions);
      const values = Object.values(submissions);
      const size = values.length;
      console.log("Submissions from last round: ", keys, values, size);
      for (let i = 0; i < size; i++) {
        const candidatePublicKey = keys[i];
        if (submissions_audit_trigger && submissions_audit_trigger[candidatePublicKey]) {
          console.log(submissions_audit_trigger[candidatePublicKey].votes, "distributions_audit_trigger votes ");
          const votes = submissions_audit_trigger[candidatePublicKey].votes;
          let numOfVotes = 0;
          for (let index = 0; index < votes.length; index++) {
            if(votes[i].is_valid)
              numOfVotes++;
            else numOfVotes--;
          }
          if(numOfVotes < 0)
            continue;
        }
        distributionList[candidatePublicKey] = 1;  
      }
    }
    console.log("Distribution List", distributionList);
    return  distributionList;  
}


async function submitDistributionList(round) {

// This function just upload your generated dustribution List and do the transaction for that 

  console.log("SubmitDistributionList called");
  
    const distributionList = await generateDistributionList(round);
    
    const decider = await namespaceWrapper.uploadDistributionList(
      distributionList, round
    );
    console.log("DECIDER", decider);
  
    if (decider) {
      const response = await namespaceWrapper.distributionListSubmissionOnChain(round);
      console.log("RESPONSE FROM DISTRIBUTION LIST", response);
    }
}


async function validateNode(submission_value) {

  /* 
    Rounds for this task are 1 minute, so we can establish consensus for very temporary data

    TODO 
    This function should verify another nodes work, there are several key checks
    1. Wallet balance should match for all nodes during the round period (no transfers are allowed for staking wallets during function)
    2. Health statuses should always match during rounds 
    3. Overall node list should match
    4. Overall epoch should match
    5. Slot # must be between the slot the round started at and the slot the round ended at

   */

  console.log("submission_value", submission_value);
  return true; // is true here "audit" or "pass"?
}

async function validateDistribution(distribution_list) {

  // Write your logic for the validation of submission value here and return a boolean value in response
  // this logic can be same as generation of distribution list function and based on the comparision will final object , decision can be made
  console.log("Validating Distribution Node", distribution_list);
  return true;
  
}
// Submit Address with distributioon list to K2
async function submitTask(roundNumber) {
  console.log("submitTask called with round", roundNumber);
  try {
    console.log("inside try");
    console.log(await namespaceWrapper.getSlot(), "current slot while calling submit");
    const cid = await fetchSubmission();
    await namespaceWrapper.checkSubmissionAndUpdateRound(cid, roundNumber);
    console.log("after the submission call");
  } catch (error) {
    console.log("error in submission", error);
  }
}

async function auditTask(roundNumber) {
  console.log("auditTask called with round", roundNumber);
  console.log(await namespaceWrapper.getSlot(), "current slot while calling auditTask");
  await namespaceWrapper.validateAndVoteOnNodes(validateNode, roundNumber);
}

async function auditDistribution(roundNumber) {
  console.log("auditDistribution called with round", roundNumber);
  await namespaceWrapper.validateAndVoteOnDistributionList(validateDistribution, roundNumber);
}

module.exports = {
  task,
  submitDistributionList,
  validateNode,
  validateDistribution,
  submitTask,
  auditTask,
  auditDistribution
};
