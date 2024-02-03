import Seed from "./seed.js";

const specialChars = ["`", "~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+", "[", "{", "]", "}", "\\", "|", ";", ":", "/", "?", ",", "<", ".", ">", "'", "\"", "+", "-", "*", "/"];

class KeyPad {
    public constructor(
        public keys: number[][],
        public keyboardType: "qwerty" | "number",
        public skipData: string[],
        public sessionKey: number[],
        public fieldType: string
    ) { }

    public encryptPassword(pw: string) {
        var encrypted = "";
        for (const val of pw.split("")) {
            const geo = this.keys[this.skipData.indexOf(val)];
            if (!geo) throw new Error("ERROR_GEO_NOT_FOUND");

            let geoString = geo.join(" ");
            if (this.keyboardType === "qwerty") {
                if (specialChars.includes(val)) geoString = "s " + geo.join(" ");
                else if (val === val.toUpperCase()) geoString = "u " + geo.join(" ");
                else geoString = "l " + geo.join(" ");
            }

            encrypted += "$" + Seed.SeedEnc(geoString, this.sessionKey);
        }

        return encrypted;
    }
}

export default KeyPad;