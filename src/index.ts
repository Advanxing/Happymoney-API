import Happymoney, { LoginResponse, ChargeResponse } from "./happymoney.js";

const client = new Happymoney();

(async function() {
    const login = await client.login("id", "pw");
    console.log(login);

    const charge = await client.charge("0000-0000-0000-0000", "20240101");
    console.log(charge);

    const bulkCharge = await client.bulkCharge([
        ["1111-1111-1111-1111", "20240101"],
        ["2222-2222-2222-2222", "20240101"],
        ["3333-3333-3333-3333", "20240101"],
        ["4444-4444-4444-4444", "20240101"],
        ["5555-5555-5555-5555", "20240101"]
    ]);
    console.log(bulkCharge);
})();