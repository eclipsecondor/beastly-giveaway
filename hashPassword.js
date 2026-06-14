//hashPassword.js
import bcrypt from "bcrypt";

const password = "@Beastadmin2026";

const hash = await bcrypt.hash(password, 10);

console.log(hash);