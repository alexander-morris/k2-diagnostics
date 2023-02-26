const { namespaceWrapper } = require("./namespaceWrapper");

let connection;

async function task() {
  // open RPC connection to get node list
  if (!connection.getAccountInfo) connection = new web3.Connection(
    web3.clusterApiUrl('devnet'),
    'confirmed',
  );

  // fetch node list
  // let nodeList = connection.; // TODO - add web3.js call to fetch validator list here
  let nodeList = [{ id : "laksjdlsaksljdklaskj", address : "123.543.222.234" }]
  namespaceWrapper.storeSet('nodes', nodeList)

  nodeList.forEach( async (node) => {
    /* ping each node and check 
      balance of this task account
      slot #
      epoch #
    */
  
    // get account info
    let nodeData = {
      account : await connection.getAccountInfo(namespaceWrapper.publicKey),
      slot_id : await connection.getSlot(),
      timestamp : await connection.getBlockTime(slot),
      epoch : await connection.getEpochInfo()
    }

    // generate proof using local signature and add it to the node object
    nodeData.signature = "signature"; // TODO - add signature + hash with slot # 

    // update levelDb for the node
    namespaceWrapper.storeSet(node.id, nodeData);
  })
  
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
      console.log("No submisssions found in N-2 round");
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
