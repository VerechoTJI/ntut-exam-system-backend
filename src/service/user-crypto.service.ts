import fs from "fs";
import path from "path";
import { UserCryptoKey } from "../models/UserCryptoKey";
import { ErrorHandler } from "../middlewares/error-handler";
import systemSettigs from "./sys-settings.service";
import crypto from "crypto";
import { ExpressValidator } from "express-validator";

interface UserAccessTokenPayload {
  studentID: string;
  timestamp: number;
  userSessionID: string;
  randomString: string;
}

interface UserCryptoKeyModel {
  aesKey: string;
  userSessionID: string;
  ipAddress: string;
}

interface RegisterUserCryptoPayload {
  studentID: string;
  aesKey: string;
  userSessionID: string;
  ipAddress: string;
}

// Read RSA keys from files and make sure they are loaded correctly
let publicKey: string;
let privateKey: string;
try {
  publicKey = fs.readFileSync(
    path.join(__dirname, "../../keys", "public.pem"),
    "utf8",
  );
  privateKey = fs.readFileSync(
    path.join(__dirname, "../../keys", "private.pem"),
    "utf8",
  );
} catch (error) {
  throw new Error(
    "Failed to read RSA key files. Please ensure keys/private.pem and keys/public.pem exist and are accessible.",
  );
}

const systemAESKey =
  process.env.SYSTEM_AES_KEY ||
  (() => {
    throw new Error("SYSTEM_AES_KEY not found in environment variables");
  })();

if (!systemAESKey)
  throw new Error("SYSTEM_AES_KEY not found in environment variables");
if (!privateKey)
  throw new Error(
    "Private key not found in environment variables, please make sure keys/private.pem exists and is accessible",
  );
if (!publicKey)
  throw new Error(
    "Public key not found in environment variables, please make sure keys/public.pem exists and is accessible",
  );

export const getPublicKey = (): string => publicKey;
export const getSystemAESKey = (): string => systemAESKey;

async function getUserRecord(studentID: string): Promise<UserCryptoKeyModel> {
  const record = await UserCryptoKey.findOne({ where: { studentID } });
  if (!record) {
    throw new ErrorHandler(
      404,
      "User AES key not found, Have you registered it yet?",
    );
  }
  return {
    aesKey: decryptWithSystemAES(record.aesKey),
    userSessionID: record.userSessionID,
    ipAddress: record.ipAddress,
  };
}

function decryptWithAES(encryptedData: string, aesKey: string): string {
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new ErrorHandler(400, "Invalid encrypted data format");
    }
    // ＡES-GCM 解密 key 256 bits = 32 bytes
    const key = Buffer.from(aesKey, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encryptedText = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new ErrorHandler(
      400,
      "AES Decryption failed: " + (error as Error).message,
    );
  }
}

function decryptWithSystemAES(encryptedData: string): string {
  return decryptWithAES(encryptedData, systemAESKey);
}

function encryptWithSystemAES(data: string): string {
  // AES-GCM 加密 key 256 bits = 32 bytes
  const key = Buffer.from(systemAESKey, "hex");
  const iv = crypto.randomBytes(12); // GCM 建議使用 12 bytes 的 IV
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(data, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  // 將 iv、authTag 和加密後的資料一起返回，使用 ':' 分隔
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptWithSystemRSA(encryptedData: string): string {
  try {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encryptedData, "base64"),
    );
    return decrypted.toString("utf8");
  } catch (error) {
    throw new ErrorHandler(
      400,
      "RSA Decryption failed: " + (error as Error).message,
    );
  }
}

async function createUserCryptoInfo(
  payload: RegisterUserCryptoPayload,
): Promise<void> {
  await UserCryptoKey.create({
    studentID: payload.studentID,
    aesKey: encryptWithSystemAES(payload.aesKey),
    ipAddress: payload.ipAddress,
    userSessionID: payload.userSessionID,
  } as any);
}

export async function registerUserCryptoInfo(
  encryptedPayload: string,
): Promise<RegisterUserCryptoPayload> {
  // 先 RSA 解密
  const decryptedStr = decryptWithSystemRSA(encryptedPayload);

  let payload: RegisterUserCryptoPayload;
  try {
    payload = JSON.parse(decryptedStr);
    const studentID = payload.studentID;
    const studentInfo = await systemSettigs.getStudentInfo(studentID);
    if (!studentInfo) {
      throw new ErrorHandler(
        404,
        "Student info not found for ID: " + studentID,
      );
    }
  } catch (error) {
    throw new ErrorHandler(
      400,
      "Invalid register payload JSON: " + (error as Error).message,
    );
  }

  // 驗證是否已註冊
  const existing = await UserCryptoKey.findOne({
    where: { studentID: payload.studentID },
  });
  if (existing) {
    throw new ErrorHandler(409, "User AES key already registered");
  }

  // 存入資料庫
  await createUserCryptoInfo(payload);
  return payload;
}

export async function decryptToken(
  encryptedToken: string,
  studentID: string,
  userAESKey: string,
): Promise<UserAccessTokenPayload> {
  const decryptedTokenStr = decryptWithAES(encryptedToken, userAESKey);
  try {
    const payload: UserAccessTokenPayload = JSON.parse(decryptedTokenStr);
    return payload;
  } catch (error) {
    throw new ErrorHandler(
      400,
      "Failed to parse decrypted token JSON: " + (error as Error).message,
    );
  }
}

export function verifyUserAccessToken(
  studentID: string,
  userToken: UserAccessTokenPayload,
  userRecord: UserCryptoKeyModel,
): boolean {
  if (!userRecord) {
    throw new ErrorHandler(404, "User crypto record not found");
  }

  if (studentID != userToken.studentID) {
    return false;
  }

  // 驗證 userSessionID 是否匹配
  if (userToken.userSessionID !== userRecord.userSessionID) {
    return false;
  }

  if (userToken.studentID !== studentID) {
    return false;
  }

  const currentTime = Date.now();
  const tokenAge = Math.abs(currentTime - userToken.timestamp);
  const maxTokenAge = 60 * 60 * 1000; // 1 分鐘

  if (tokenAge > maxTokenAge) {
    return false; // Token 已過期
  }

  return true;
}

export async function decryptNVerrifyUserAccessToken(
  studentID: string,
  encryptedToken: string,
): Promise<boolean> {
  const userRecord = await getUserRecord(studentID);

  const decryptedToken = await decryptToken(
    encryptedToken,
    studentID,
    userRecord.aesKey,
  );

  const isVerified = verifyUserAccessToken(
    studentID,
    decryptedToken,
    userRecord,
  );
  if (!isVerified) {
    throw new ErrorHandler(401, "User access token verification failed");
  }
  return true;
}

export function encryptDataWithAES(data: string, aesKey: string): string {
  const key = Buffer.from(aesKey, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(data, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 將 iv、authTag 和加密後的資料一起返回，使用 ':' 分隔
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export async function encryptDataWithUserAES(
  data: string,
  studentID: string,
): Promise<string> {
  const userRecord = await UserCryptoKey.findOne({ where: { studentID } });
  if (!userRecord) {
    throw new ErrorHandler(404, "User crypto record not found");
  }
  if (!userRecord.aesKey) {
    throw new ErrorHandler(404, "User AES key not found");
  }
  const userAESKey = decryptWithSystemAES(userRecord.aesKey);
  return encryptDataWithAES(data, userAESKey);
}


export async function deleteUserCryptoInfo(studentID: string): Promise<boolean> {
  const deletedCount = await UserCryptoKey.destroy({ where: { studentID } });
  return deletedCount > 0;
}

export async function isUserCryptoExist(studentID: string): Promise<boolean> {
  const record = await UserCryptoKey.findOne({ where: { studentID } });
  return !!record;
}