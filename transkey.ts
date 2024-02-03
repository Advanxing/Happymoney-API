import axios from "axios";
import { HttpCookieAgent, HttpsCookieAgent } from "http-cookie-agent/http";
import { CookieJar } from "tough-cookie";
import Crypto from "./crypto.js";
import KeyPad from "./keypad.js";

class mTransKey {
    public crypto: Crypto;
    public token: string;
    public qwerty: number[][];
    public number: number[][];

    public constructor(public jar: CookieJar) {
        this.crypto = new Crypto();
        this.token = "";
        this.qwerty = [];
        this.number = [];
    }

    public async getServletData() {
        const options = {
            httpAgent: new HttpCookieAgent({ cookies: { jar: this.jar } }),
            httpsAgent: new HttpsCookieAgent({ cookies: { jar: this.jar } }),
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Connection": "keep-alive"
            }
        };
        const requestToken = await axios.get("https://m.happymoney.co.kr/svc/transkeyServlet?op=getToken&" + new Date().getTime(), options).then(res => res.data);

        this.token = String(new Function(requestToken + "return TK_requestToken")());
    }

    public async getKeyData() {
        const options = {
            httpAgent: new HttpCookieAgent({ cookies: { jar: this.jar } }),
            httpsAgent: new HttpsCookieAgent({ cookies: { jar: this.jar } }),
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Connection": "keep-alive"
            }
        };
        const keyPositions = await axios.post("https://m.happymoney.co.kr/svc/transkeyServlet", new URLSearchParams({
            "op": "setSessionKey",
            "key": this.crypto.encSessionKey,
            "transkeyUuid": this.crypto.transkeyUuid,
            "useCert": "true",
            "TK_requestToken": this.token,
            "mode": "Mobile"
        }).toString(), options).then(res => res.data);

        const [qwerty, num] = keyPositions.split("var numberMobile = new Array();");

        this.qwerty = [];
        this.number = [];

        const _q = qwerty.split("qwertyMobile.push(key);");
        _q.pop();
        for (const p of _q) {
            const points = p.matchAll(/key\.addPoint\((\d+), (\d+)\);/g);
            const key = [...points][0];
            this.qwerty.push([key[1], key[2]]);
        }

        const _n = num.split("numberMobile.push(key);");
        _n.pop();
        for (const p of _n) {
            const points = p.matchAll(/key\.addPoint\((\d+), (\d+)\);/g);
            const key = [...points][0];
            this.number.push([key[1], key[2]]);
        }
    }

    public async createKeypad(keyboardType: "qwerty" | "number", name: string, inputName: string, fieldType = "password") {
        const options = {
            httpAgent: new HttpCookieAgent({ cookies: { jar: this.jar } }),
            httpsAgent: new HttpsCookieAgent({ cookies: { jar: this.jar } }),
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Connection": "keep-alive"
            }
        };

        const skipData = await axios.post("https://m.happymoney.co.kr/svc/transkeyServlet", new URLSearchParams({
            "op": "allocation",
            "name": name,
            "keyType": "",
            "keyboardType": `${keyboardType}Mobile`,
            "fieldType": fieldType,
            "inputName": inputName,
            "transkeyUuid": this.crypto.transkeyUuid,
            "TK_requestToken": this.token,
            "dummy": "undefined",
            "talkBack": "true"
        }).toString(), options).then(res => res.data);

        return new KeyPad(keyboardType === "qwerty" ? this.qwerty : this.number, keyboardType, skipData.split(","), this.crypto.sessionKey, fieldType);
    }
}

export default mTransKey;