# K2 Diagnostics Task

Tracking uptime on decentralized networks is hard to do reliably, and harder to verify independantly.

This [koii task](https://docs.koii.network/microservices-and-tasks) queries all active K2 nodes once every 18,000 slots to verify if they are online. 

Health checks track:
1. Current slot
2. The leader node
3. The current epoch, along with it's start and end slot
4. A list of all healthy nodes

The results are cached on the Task Node's REST API at `http://node_ip/task_id/`

# TODO:
This is just the first draft of the repo, and there are a number of features missing:

1. Add proof generation by signing over the node bundles in corelogic.js
2. Add fetching of full node list over RPC endpoint in corelogic.js (done with connection.getClusterNodes() )
3. Fetch k2 node IPs in corelogic.js 
4. Add rate limit middleware to REST APIs in init.js
5. Fix hardcoded k2-web3-js address field for new connections to support direct calls to each k2 node in corelogic.js
6. Expand testing to support non-node environments. Currently running `tests/testReportGeneration.js` leads to 
```
SETTING UP EXPRESS undefined
(node:35505) Warning: Accessing non-existent property 'namespaceWrapper' of module exports inside circular dependency
(Use `node --trace-warnings ...` to show where the warning was created)
undefined listening on port undefined
/home/al/koii/k2-diagnostics/coreLogic.js:7
  if (!connection.getAccountInfo) connection = new web3.Connection(
                  ^

TypeError: Cannot read properties of undefined (reading 'getAccountInfo')
    at Object.task (/home/al/koii/k2-diagnostics/coreLogic.js:7:19)
    at Object.<anonymous> (/home/al/koii/k2-diagnostics/tests/testReportGeneration.js:3:6)
    at Module._compile (node:internal/modules/cjs/loader:1126:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1180:10)
    at Module.load (node:internal/modules/cjs/loader:1004:32)
    at Function.Module._load (node:internal/modules/cjs/loader:839:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:17:47
```
This can be resolved by adding a shim for the namespace object when running outside the node env
