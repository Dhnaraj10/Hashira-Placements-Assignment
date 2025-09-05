const fs = require("fs");

// A large prime modulus for Shamir operations (127-bit Mersenne prime)
const P = (1n << 127n) - 1n;

/**
 * Map a single character to its numeric digit considering the base.
 * - 0-9 -> 0..9
 * - A-Z -> 10..35
 * - a-z -> for base <= 36 -> 10..35 (same as uppercase)
 *          for base  > 36 -> 36..61
 */
function charToDigit(ch, base) {
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - "0".charCodeAt(0);
  if (ch >= "A" && ch <= "Z") return 10 + (ch.charCodeAt(0) - "A".charCodeAt(0));
  if (ch >= "a" && ch <= "z") {
    if (base <= 36) return 10 + (ch.charCodeAt(0) - "a".charCodeAt(0));
    return 36 + (ch.charCodeAt(0) - "a".charCodeAt(0));
  }
  throw new Error(`Invalid digit '${ch}'`);
}

/**
 * Manual base conversion to BigInt (no parseInt).
 */
function parseValue(base, valueStr) {
  let result = 0n;
  const b = BigInt(base);

  for (let i = 0; i < valueStr.length; i++) {
    const d = BigInt(charToDigit(valueStr[i], base));
    if (d >= b) throw new Error(`Digit '${valueStr[i]}' not valid for base ${base}`);
    result = result * b + d;
  }
  return result;
}

/**
 * Modular exponentiation
 */
function modPow(base, exp, mod) {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

/**
 * Modular inverse (Fermat's little theorem since P is prime)
 */
function modInv(a, p) {
  return modPow((a % p + p) % p, p - 2n, p);
}

/**
 * Lagrange interpolation at x=0 to get secret (constant term).
 * Works modulo P.
 */
function lagrangeAtZero(shares) {
  let secret = 0n;
  const k = shares.length;

  for (let i = 0; i < k; i++) {
    const [xi, yi] = shares[i];
    let num = 1n;
    let den = 1n;

    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const [xj] = shares[j];
      num = (num * (-xj + P)) % P;
      den = (den * (xi - xj + P)) % P;
    }

    const term = (yi % P) * (num * modInv(den, P)) % P;
    secret = (secret + term) % P;
  }

  return secret;
}

/**
 * Evaluate the reconstructed polynomial at x using the same k shares (mod P).
 */
function evalPoly(shares, x) {
  const k = shares.length;
  let val = 0n;

  for (let i = 0; i < k; i++) {
    const [xi, yi] = shares[i];
    let num = 1n;
    let den = 1n;
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const [xj] = shares[j];
      num = (num * (x - xj + P)) % P;
      den = (den * (xi - xj + P)) % P;
    }
    const term = (yi % P) * (num * modInv(den, P)) % P;
    val = (val + term) % P;
  }
  return val;
}

/**
 * Main solver:
 * - parses input
 * - reconstructs secret from first k shares
 * - flags wrong shares
 */
function solve(jsonInput) {
  const data = JSON.parse(jsonInput);
  const n = Number(data.keys.n);
  const k = Number(data.keys.k);

  // Parse all available shares as (x, y)
  const shares = [];
  for (let i = 1; i <= n; i++) {
    const key = String(i);
    if (!data[key]) continue;
    const base = Number(data[key].base);
    const valueStr = String(data[key].value);
    const y = parseValue(base, valueStr);
    shares.push([BigInt(i), y % P]);
  }

  if (shares.length < k) {
    throw new Error(`Need at least k=${k} shares, found ${shares.length}.`);
  }

  // Reconstruct polynomial from the first k shares
  const basis = shares.slice(0, k);
  const secret = lagrangeAtZero(basis);

  // Validate all shares against reconstructed polynomial
  const wrongShares = [];
  for (const [x, y] of shares) {
    const expected = evalPoly(basis, x);
    if (expected !== (y % P)) {
      wrongShares.push({ x: x.toString(), given: y.toString(), expected: expected.toString() });
    }
  }

  return { secret: secret.toString(), wrongShares };
}

// ---------------------------
// CLI entry (PowerShell-friendly): node shamir.js input1.json
// ---------------------------
try {
  const filename = process.argv[2] || "input.json";
  const input = fs.readFileSync(filename, "utf8");
  const result = solve(input);

  console.log("✅ Secret (constant term):", result.secret);
  if (result.wrongShares.length) {
    console.log("⚠️ Wrong Shares:");
    console.table(result.wrongShares);
  } else {
    console.log("All shares are valid ✅");
  }
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
