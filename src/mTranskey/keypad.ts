import Seed from "./seed.js";

const specialChars = ["`", "~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+", "[", "{", "]", "}", "\\", "|", ";", ":", "/", "?", ",", "<", ".", ">", "'", "\"", "+", "-", "*", "/"];
const lowerChars = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "a", "s", "d", "f", "g", "h", "j", "k", "l", "z", "x", "c", "v", "b", "n", "m"];

export default class Keypad {
    public constructor(
        public keys: number[][],
        public keyboardType: "qwerty" | "number",
        public skipData: string[],
        public sessionKey: number[],
        public fieldType: string
    ) { }

    public encryptPassword(pw: string) {
        // 빈 칸을 키패드 배열에 추가함
        const lowerWithBlank = lowerChars.slice(); // 소문자 키패드 배열 복사
        const specialWithBlank = specialChars.slice(); // 특수문자 키패드 배열 복사
        if (this.keyboardType === "qwerty") { // qwerty 키보드라면
            for (const blankIndex of this.skipData.map(c => parseInt(c))) {
                lowerWithBlank.splice(blankIndex, 0, ""); // 빈 칸
                specialWithBlank.splice(blankIndex, 0, ""); // 빈 칸
            }
        }

        var encrypted = "";
        for (const val of pw.split("")) {
            let geo: number[] | undefined = undefined;
            if (this.keyboardType === "qwerty") {
                // qwerty 키패드에서는 빈 칸의 index를 skipData로 반환
                // 해당 키의 키패드에서의 위치 (빈 칸 제외)
                let charIndex = -1;

                // 글자의 빈 칸을 고려한 index 가져오기
                if (specialChars.includes(val)) { // 특수문자라면
                    charIndex = specialWithBlank.indexOf(val);
                }
                else if (lowerChars.includes(val.toLowerCase())) { // 대/소문자 or 숫자라면
                    charIndex = lowerWithBlank.indexOf(val.toLowerCase());
                }

                // 키패드에서 charIndex번째 키의 좌표 가져오기
                geo = this.keys[charIndex];
            }
            else if (this.keyboardType === "number") {
                // 숫자 키패드에서는 키패드 배열은 그대로, 빈 칸은 =로 skipData를 반환
                // =,1,2,3,4,5,=,6,7,8,9,0,b,c
                geo = this.keys[this.skipData.indexOf(val)];
            }

            if (!geo) throw new Error("ERROR_GEO_NOT_FOUND");

            let geoString = geo.join(" ");
            if (this.keyboardType === "qwerty") {
                if (specialChars.includes(val)) geoString = "s " + geo.join(" ");
                else if (val === val.toLowerCase()) geoString = "l " + geo.join(" ");
                else geoString = "u " + geo.join(" ");
            }

            encrypted += "$" + Seed.SeedEnc(geoString, this.sessionKey);
        }

        return encrypted;
    }
}