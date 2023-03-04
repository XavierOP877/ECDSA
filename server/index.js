const express = require("express");
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const {toHex, utf8ToBytes} = require("ethereum-cryptography/utils")

const app = express();
const cors = require("cors");

const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0424bbae9046c409103e0916995d101c81ce2d24c6baa59e2b735499f35331fa0829a91dd70d150f5e47f69bcc4c498dc9e703881094be8ca17190ebc84a2df632": 100,
  "04ef16e9c111823ade8dd9c71e4ddc964dacf0ce8291acbce05a532714cbb441037e5e1f1e7f69cd50d9f5d883665d8e61e8879009c68f8b283afd8913a3283d3c": 50,
  "04e91c3b8488a5657d46b3c8568c015fd44aa6f9ff55fd16fab8987ff761c2495a6bc70010e715e8ebd4f58393355b850e78e87f3a81630ed3b7153aafee04b934": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async (req, res) => {
  const { sender, recipient, amount, signature, recovery } = req.body;

  if(!signature) res.status(404).send({ message: "signature dont was provide" });
  if(!recovery) res.status(400).send({ message: "recovery dont was provide" });

  try {
    
    const bytes = utf8ToBytes(JSON.stringify({ sender, recipient, amount }));
    const hash = keccak256(bytes);

    const sig = new Uint8Array(signature);

    const publicKey = await secp.recoverPublicKey(hash, sig, recovery);

    if(toHex(publicKey) !== sender){
      res.status(400).send({ message: "signature no is valid" });
    }

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  } catch (error) {
    console.log(error.message)
  }
  
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}