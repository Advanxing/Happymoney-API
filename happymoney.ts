import axios from "axios";
import { HttpCookieAgent, HttpsCookieAgent } from "http-cookie-agent/http";
import { CookieJar } from "tough-cookie";
import mTransKey from "./transkey.js";

export default class Happymoney {
    private jar;
    private client;

    constructor() {
        this.jar = new CookieJar();
        this.client = axios.create({
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Connection": "keep-alive"
            },
            httpAgent: new HttpCookieAgent({ cookies: { jar: this.jar } }),
            httpsAgent: new HttpsCookieAgent({ cookies: { jar: this.jar } })
        });
    }

    /**
     * 해피머니 모바일웹에 로그인합니다.
     * @param id 해피머니 아이디
     * @param password 해피머니 비밀번호
     * @returns 로그인 성공 여부, 로그인 결과 메시지
     */
    async login(id: string, password: string) {
        const payload = new URLSearchParams({
            memberId: id,
            memberPwd: password,
            autoLoginYn: "N"
        });

        const loginResult: LoginResponse = await this.client.post(
            "https://m.happymoney.co.kr/svc/api/member/login",
            payload.toString(),
            { validateStatus: () => true }
        ).then(res => res.data).catch(err => { throw err; });

        if (!loginResult.success) {
            throw new Error("예기치 못한 오류가 발생하였습니다.");
        }

        return {
            success: loginResult.result.success === "Y",
            message: loginResult.result.messageText
        };
    }

    /**
     * 해피머니 핀번호를 충전합니다.
     * @param pin - 상품권의 핀번호
     * @param issuedDate - 상품권의 발행일
     * @return 충전 결과 (interface ChargeResponse)
     */
    async charge(pin: string, issuedDate: string) {
        const pinParts = pin.split("-"); // 상품권의 핀번호를 '-'로 나누기

        const transKey = new mTransKey(this.jar);
        await transKey.getServletData();
        await transKey.getKeyData();

        const keypad = await transKey.createKeypad("number", "pinNo1_0", "", "password");
        const encryptedPin = keypad.encryptPassword(pinParts[0]);

        const chargeResult: ChargeResponse = await this.client.post(
            "https://m.happymoney.co.kr/svc/v2/giftcard/charge",
            {
                giftCardList: [
                    {
                        pinNo1: encryptedPin,
                        pinNo2: pinParts[1],
                        pinNo3: pinParts[2],
                        pinNo4: pinParts[3],
                        issuedDate,
                        hmPinNo1: transKey.crypto.hmacDigest(encryptedPin),
                        transkeyUuid: transKey.crypto.transkeyUuid
                    }
                ]
            },
            { maxRedirects: 0, validateStatus: () => true }
        ).then(res => res.data).catch(err => { throw err; });

        return chargeResult;
    }

    /**
     * 다량의 해피머니 핀번호를 한 번에 충전합니다.
     * @param pins - 상품권들의 핀번호 및 발행일
     * @param pins[][0] - 상품권의 핀번호
     * @param pins[][1] - 상품권의 발행일
     * @return 충전 결과 (interface ChargeResponse)
     */
    async bulkCharge(pins: string[][]) {
        const transKey = new mTransKey(this.jar);
        await transKey.getServletData();
        await transKey.getKeyData();

        const giftCardList = [];
        for (let i = 0; i < pins.length; i++) {
            const pin = pins[i];
            const pinParts = pin[0].split("-"); // 상품권의 핀번호를 '-'로 나누기
            const issuedDate = pin[1]; // 상품권의 발행일

            const keypad = await transKey.createKeypad("number", "pinNo1_" + i, "", "password");
            const encryptedPin = keypad.encryptPassword(pinParts[0]);

            giftCardList.push({
                pinNo1: encryptedPin,
                pinNo2: pinParts[1],
                pinNo3: pinParts[2],
                pinNo4: pinParts[3],
                issuedDate,
                hmPinNo1: transKey.crypto.hmacDigest(encryptedPin),
                transkeyUuid: transKey.crypto.transkeyUuid
            });
        }

        const chargeResult: ChargeResponse = await this.client.post(
            "https://m.happymoney.co.kr/svc/v2/giftcard/charge",
            { giftCardList },
            { maxRedirects: 0, validateStatus: () => true }
        ).then(res => res.data).catch(err => { throw err; });

        return chargeResult;
    }
}

// 타입 선언
export interface LoginResponse {
    success: boolean;
    description: string;
    result: {
        tempOutYn?: "Y" | "N";
        messageText: string;
        memberMobileNoMask?: string;
        redirectUrl: string;
        protectServiceYn?: "Y" | "N";
        memberName?: string;
        dormancyDate?: string;
        pwdChangeYn?: "Y" | "N";
        memberEmail?: string;
        memberBizYn?: "Y" | "N";
        fail?: string;
        dormancyYn?: "Y" | "N";
        lastPassChangeDate?: string;
        success: "Y" | "N";
        memberEmailMask?: string;
        ipLockYn?: "Y" | "N";
        memberType?: string;
        memberMobileNo?: string;
        idPwdDisCnt?: string;
        idLockYn?: "Y" | "N";
        mainUrl?: string;
        memberId?: null;
    };
    array: boolean;
}

export interface ChargeResponse {
    success: "Y" | "N";
    message?: "충전실패" | "충전완료";
    messageText?: string; // 오류가 발생하였을 때
    messageCode?: string; // 오류가 발생하였을 때
    redirectURL?: string; // 오류가 발생하였을 때 (리다이렉션)
    successCount?: number;
    chargedAmount?: number;
    addAmount?: number;
    results?: {
        index: number;
        pinNo: string;
        issuedDate: string;
        orderNo: string;
        issuedAmount: number;
        chargedAmount: number;
        addAmount: number;
        success: "Y" | "N";
        message: string;
        resultCode: string;
    }[];
}