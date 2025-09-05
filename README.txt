# Shamir Secret Sharing – Hashira Placements Assignment

## 📌 Problem Statement
Implement Shamir’s Secret Sharing reconstruction:
- Input is provided in **JSON format** with `n` shares and threshold `k`.
- Each share has:
  - `x` (its index in JSON keys `"1"`, `"2"`, etc.)
  - `base` (number system of the value)
  - `value` (the encoded share)
- Using **any `k` shares**, reconstruct the polynomial and extract the **secret (constant term)**.
- Identify and report **invalid/wrong shares**.

**Note:** Language restriction → any language except Python.  
This repo uses **Node.js (JavaScript)**.

---

## 📂 Files
- `shamir.js` → main program
- `input1.json` → sample test case
- `input2.json` → second test case

---

## ▶️ How to Run

1. Install [Node.js](https://nodejs.org/) (>= 14.x).  
2. Clone/download this repo.  
3. Run the program with an input file:

```
node shamir.js input1.json
node shamir.js input2.json
```

---

## 📝 Sample Input 1
**input1.json**
```json
{
  "keys": {
    "n": 4,
    "k": 3
  },
  "1": { "base": "10", "value": "4" },
  "2": { "base": "2",  "value": "111" },
  "3": { "base": "10", "value": "12" },
  "6": { "base": "4",  "value": "213" }
}
```

### ✅ Output
```
Secret (constant term): 3
All shares are valid ✅
```

---

## 📝 Sample Input 2
**input2.json** (10 shares, threshold k=7, larger bases)

### ✅ Output
```
Secret (constant term): -6290016743746469796
⚠️ Wrong Shares:
┌─────────┬──────┬─────────────────────────┬─────────────────────────┐
│ (index) │  x   │          given          │        expected         │
├─────────┼──────┼─────────────────────────┼─────────────────────────┤
│    0    │ '8'  │ '58725075613853308713'  │ '56628376753849802158'  │
│    1    │ '9'  │ '117852986202006511971' │ '103475622590553895635' │
│    2    │ '10' │ '220003896831595324801' │ '163393027611500647978' │
└─────────┴──────┴─────────────────────────┴─────────────────────────┘
```

---

## 🧮 Approach
- **Manual base conversion** implemented (supports 0–9, A–Z, a–z).  
- **Polynomial reconstruction** using **Lagrange interpolation**.  
- Secret = constant term (polynomial at x=0).  
- Wrong shares detected by checking consistency against reconstructed polynomial.  

---

## ✅ Submission
Push this repo to GitHub and submit the link via the [form](https://forms.office.com/r/Kd5CE3SWcP).  
