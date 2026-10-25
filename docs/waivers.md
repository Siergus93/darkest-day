# Waiver register

A waiver is a recorded acceptance of risk, not a bypass. The authoritative detail lives in
the linked A5; this register exists so expiries are visible.

Rules:

- Required fields: gate, slice/A5 link, reason, blast radius, compensating control, owner,
  expiry.
- An expired waiver fails the gate that it covers.
- Never waive G4d (secrets) or G5c (authorization), and never waive a T3 step without human
  sign-off.
- If the same gate is waived repeatedly, the gate is wrong: change the gate, not the waiver.

| Gate | Slice / A5 | Reason | Blast radius | Compensating control | Owner | Expires | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | No active waivers. | — | — | — | — | — |
