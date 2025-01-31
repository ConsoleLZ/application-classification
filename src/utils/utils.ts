export const generateHash = async (data: string) => {
  // 将数据编码为 Uint8Array
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  // 使用 Web Crypto API 计算哈希
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);

  // 将哈希结果转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};
