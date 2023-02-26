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
2. Add fetching of full node list over RPC endpoint in corelogic.js
3. Fetch k2 node IPs in corelogic.js
4. Add rate limit middleware to REST APIs in init.js
5. Fix hardcoded k2-web3-js address field for new connections to support direct calls to each k2 node in corelogic.js
