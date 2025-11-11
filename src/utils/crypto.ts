/**
 * MD5加密工具
 * 用于百度翻译API签名生成
 */

/**
 * 计算字符串的MD5哈希值
 * @param str 输入字符串
 * @returns MD5哈希值（小写十六进制）
 */
export function md5(str: string): string {
  // 使用Web Crypto API的替代方案
  // 因为浏览器扩展中可以使用crypto-js或自己实现
  // 这里使用简单的实现（实际项目中应使用crypto-js库）
  
  // 简单的MD5实现
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function md5cmn(
    q: number,
    a: number,
    b: number,
    x: number,
    s: number,
    t: number
  ): number {
    return addUnsigned(rotateLeft(addUnsigned(a, addUnsigned(addUnsigned(q, x), t)), s), b);
  }

  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function convertToWordArray(str: string): number[] {
    const wordArray: number[] = [];
    const strlen = str.length;
    
    for (let i = 0; i < strlen; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode < 128) {
        wordArray.push(charCode);
      } else if (charCode < 2048) {
        wordArray.push((charCode >> 6) | 192);
        wordArray.push((charCode & 63) | 128);
      } else if (charCode < 55296 || charCode >= 57344) {
        wordArray.push((charCode >> 12) | 224);
        wordArray.push(((charCode >> 6) & 63) | 128);
        wordArray.push((charCode & 63) | 128);
      } else {
        i++;
        const surrogate = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        wordArray.push((surrogate >> 18) | 240);
        wordArray.push(((surrogate >> 12) & 63) | 128);
        wordArray.push(((surrogate >> 6) & 63) | 128);
        wordArray.push((surrogate & 63) | 128);
      }
    }
    
    return wordArray;
  }

  function wordArrayToMd5(wordArray: number[]): string {
    const messageLength = wordArray.length;
    const numberOfWords = ((messageLength + 8) >> 6) + 1;
    const messageWords = new Array(numberOfWords * 16);
    
    for (let i = 0; i < numberOfWords * 16; i++) {
      messageWords[i] = 0;
    }
    
    for (let i = 0; i < messageLength; i++) {
      messageWords[i >> 2] |= wordArray[i] << ((i % 4) * 8);
    }
    
    messageWords[messageLength >> 2] |= 0x80 << ((messageLength % 4) * 8);
    messageWords[numberOfWords * 16 - 2] = messageLength * 8;

    let a = 0x67452301;
    let b = 0xefcdab89;
    let c = 0x98badcfe;
    let d = 0x10325476;

    for (let i = 0; i < numberOfWords * 16; i += 16) {
      const prevA = a;
      const prevB = b;
      const prevC = c;
      const prevD = d;

      a = md5ff(a, b, c, d, messageWords[i + 0], 7, 0xd76aa478);
      d = md5ff(d, a, b, c, messageWords[i + 1], 12, 0xe8c7b756);
      c = md5ff(c, d, a, b, messageWords[i + 2], 17, 0x242070db);
      b = md5ff(b, c, d, a, messageWords[i + 3], 22, 0xc1bdceee);
      a = md5ff(a, b, c, d, messageWords[i + 4], 7, 0xf57c0faf);
      d = md5ff(d, a, b, c, messageWords[i + 5], 12, 0x4787c62a);
      c = md5ff(c, d, a, b, messageWords[i + 6], 17, 0xa8304613);
      b = md5ff(b, c, d, a, messageWords[i + 7], 22, 0xfd469501);
      a = md5ff(a, b, c, d, messageWords[i + 8], 7, 0x698098d8);
      d = md5ff(d, a, b, c, messageWords[i + 9], 12, 0x8b44f7af);
      c = md5ff(c, d, a, b, messageWords[i + 10], 17, 0xffff5bb1);
      b = md5ff(b, c, d, a, messageWords[i + 11], 22, 0x895cd7be);
      a = md5ff(a, b, c, d, messageWords[i + 12], 7, 0x6b901122);
      d = md5ff(d, a, b, c, messageWords[i + 13], 12, 0xfd987193);
      c = md5ff(c, d, a, b, messageWords[i + 14], 17, 0xa679438e);
      b = md5ff(b, c, d, a, messageWords[i + 15], 22, 0x49b40821);

      a = md5gg(a, b, c, d, messageWords[i + 1], 5, 0xf61e2562);
      d = md5gg(d, a, b, c, messageWords[i + 6], 9, 0xc040b340);
      c = md5gg(c, d, a, b, messageWords[i + 11], 14, 0x265e5a51);
      b = md5gg(b, c, d, a, messageWords[i + 0], 20, 0xe9b6c7aa);
      a = md5gg(a, b, c, d, messageWords[i + 5], 5, 0xd62f105d);
      d = md5gg(d, a, b, c, messageWords[i + 10], 9, 0x02441453);
      c = md5gg(c, d, a, b, messageWords[i + 15], 14, 0xd8a1e681);
      b = md5gg(b, c, d, a, messageWords[i + 4], 20, 0xe7d3fbc8);
      a = md5gg(a, b, c, d, messageWords[i + 9], 5, 0x21e1cde6);
      d = md5gg(d, a, b, c, messageWords[i + 14], 9, 0xc33707d6);
      c = md5gg(c, d, a, b, messageWords[i + 3], 14, 0xf4d50d87);
      b = md5gg(b, c, d, a, messageWords[i + 8], 20, 0x455a14ed);
      a = md5gg(a, b, c, d, messageWords[i + 13], 5, 0xa9e3e905);
      d = md5gg(d, a, b, c, messageWords[i + 2], 9, 0xfcefa3f8);
      c = md5gg(c, d, a, b, messageWords[i + 7], 14, 0x676f02d9);
      b = md5gg(b, c, d, a, messageWords[i + 12], 20, 0x8d2a4c8a);

      a = md5hh(a, b, c, d, messageWords[i + 5], 4, 0xfffa3942);
      d = md5hh(d, a, b, c, messageWords[i + 8], 11, 0x8771f681);
      c = md5hh(c, d, a, b, messageWords[i + 11], 16, 0x6d9d6122);
      b = md5hh(b, c, d, a, messageWords[i + 14], 23, 0xfde5380c);
      a = md5hh(a, b, c, d, messageWords[i + 1], 4, 0xa4beea44);
      d = md5hh(d, a, b, c, messageWords[i + 4], 11, 0x4bdecfa9);
      c = md5hh(c, d, a, b, messageWords[i + 7], 16, 0xf6bb4b60);
      b = md5hh(b, c, d, a, messageWords[i + 10], 23, 0xbebfbc70);
      a = md5hh(a, b, c, d, messageWords[i + 13], 4, 0x289b7ec6);
      d = md5hh(d, a, b, c, messageWords[i + 0], 11, 0xeaa127fa);
      c = md5hh(c, d, a, b, messageWords[i + 3], 16, 0xd4ef3085);
      b = md5hh(b, c, d, a, messageWords[i + 6], 23, 0x04881d05);
      a = md5hh(a, b, c, d, messageWords[i + 9], 4, 0xd9d4d039);
      d = md5hh(d, a, b, c, messageWords[i + 12], 11, 0xe6db99e5);
      c = md5hh(c, d, a, b, messageWords[i + 15], 16, 0x1fa27cf8);
      b = md5hh(b, c, d, a, messageWords[i + 2], 23, 0xc4ac5665);

      a = md5ii(a, b, c, d, messageWords[i + 0], 6, 0xf4292244);
      d = md5ii(d, a, b, c, messageWords[i + 7], 10, 0x432aff97);
      c = md5ii(c, d, a, b, messageWords[i + 14], 15, 0xab9423a7);
      b = md5ii(b, c, d, a, messageWords[i + 5], 21, 0xfc93a039);
      a = md5ii(a, b, c, d, messageWords[i + 12], 6, 0x655b59c3);
      d = md5ii(d, a, b, c, messageWords[i + 3], 10, 0x8f0ccc92);
      c = md5ii(c, d, a, b, messageWords[i + 10], 15, 0xffeff47d);
      b = md5ii(b, c, d, a, messageWords[i + 1], 21, 0x85845dd1);
      a = md5ii(a, b, c, d, messageWords[i + 8], 6, 0x6fa87e4f);
      d = md5ii(d, a, b, c, messageWords[i + 15], 10, 0xfe2ce6e0);
      c = md5ii(c, d, a, b, messageWords[i + 6], 15, 0xa3014314);
      b = md5ii(b, c, d, a, messageWords[i + 13], 21, 0x4e0811a1);
      a = md5ii(a, b, c, d, messageWords[i + 4], 6, 0xf7537e82);
      d = md5ii(d, a, b, c, messageWords[i + 11], 10, 0xbd3af235);
      c = md5ii(c, d, a, b, messageWords[i + 2], 15, 0x2ad7d2bb);
      b = md5ii(b, c, d, a, messageWords[i + 9], 21, 0xeb86d391);

      a = addUnsigned(a, prevA);
      b = addUnsigned(b, prevB);
      c = addUnsigned(c, prevC);
      d = addUnsigned(d, prevD);
    }

    const temp = [a, b, c, d];
    let result = '';
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result += ((temp[i] >> (j * 8)) & 0xff).toString(16).padStart(2, '0');
      }
    }
    
    return result;
  }

  return wordArrayToMd5(convertToWordArray(str));
}

